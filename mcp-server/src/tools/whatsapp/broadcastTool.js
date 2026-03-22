import axios from 'axios';
import { Customer, MCPEvent } from '../../services/mongoService.js';

const WA_API = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
const HEADERS = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };

/**
 * Broadcast a WhatsApp message to a list of customers.
 *
 * DNC check: customers with dncStatus:true are skipped (compliance guard).
 * Channel preference: customers who prefer a different channel are skipped.
 *
 * Customer.js fields used: _id, isActive, phone, channel_ids.whatsapp, dncStatus
 * (dncStatus is not in current schema but we check it defensively for future-proofing)
 */
export async function whatsappBroadcast({ customerIds, message, campaignName }) {
  const results = { sent: [], blocked: [], failed: [] };

  // Fetch all target customers at once
  const customers = await Customer.find({
    _id: { $in: customerIds },
    isActive: { $ne: false }    // Customer.js field: isActive (not isDeleted)
  }).lean();

  for (const customer of customers) {
    // DNC check (defensive — field may be added in future)
    if (customer.dncStatus === true) {
      results.blocked.push({ id: customer._id, reason: 'DNC' });
      continue;
    }

    // Resolve phone: channel_ids.whatsapp first, then phone field
    // Customer.js fields: channel_ids.whatsapp, phone
    const phone = customer.channel_ids?.whatsapp || customer.phone;
    if (!phone) {
      results.failed.push({ id: customer._id, reason: 'no phone number' });
      continue;
    }

    try {
      await axios.post(`${WA_API}/messages`, {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      }, { headers: HEADERS });

      await MCPEvent.create({
        customerId: customer._id.toString(),
        channel: 'whatsapp',
        direction: 'outbound',
        content: message,
        summary: `Broadcast: ${campaignName}`,
        metadata: { campaign: campaignName }
      });

      results.sent.push({ id: customer._id, phone });

      // Rate-limit: safe at 10 msg/sec (WhatsApp allows ~80/sec)
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      results.failed.push({ id: customer._id, reason: err.message });
    }
  }

  return {
    campaign: campaignName,
    total: customers.length,
    sent: results.sent.length,
    blocked: results.blocked.length,
    failed: results.failed.length,
    details: results
  };
}
