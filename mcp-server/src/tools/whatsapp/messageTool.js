import axios from 'axios';
import { WAMsg, MCPEvent } from '../../services/mongoService.js';

const WA_API = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
const HEADERS = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };

/**
 * Get WhatsApp message history for a customer.
 * Queries the 'messages' collection (Message.js model).
 * Fields used: from, to, body, direction, messageId, whatsappTimestamp, createdAt
 */
export async function whatsappGetMessages({ phone, limit = 20 }) {
  const messages = await WAMsg
    .find({
      $or: [
        { from: { $regex: phone, $options: 'i' } },
        { to:   { $regex: phone, $options: 'i' } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    phone,
    messageCount: messages.length,
    messages: messages.map(m => ({
      id: m._id,
      direction: m.direction || 'inbound',
      content: m.body,             // Message.js field: 'body'
      timestamp: m.whatsappTimestamp || m.createdAt,
      messageId: m.messageId
    }))
  };
}

/**
 * Send a WhatsApp message via Meta Graph API.
 * Logs the outbound event to the MCPEvent collection (our own — no conflict).
 */
export async function whatsappSendMessage({ phone, message, customerId }) {
  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: message }
  };

  const res = await axios.post(`${WA_API}/messages`, payload, { headers: HEADERS });

  await MCPEvent.create({
    customerId: customerId || phone,
    channel: 'whatsapp',
    direction: 'outbound',
    content: message,
    summary: message.substring(0, 100),
    metadata: { messageId: res.data?.messages?.[0]?.id }
  });

  return {
    success: true,
    messageId: res.data?.messages?.[0]?.id,
    to: phone
  };
}
