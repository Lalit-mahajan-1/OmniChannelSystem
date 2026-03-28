const mongoose = require('mongoose');
const Message = require('../models/Message');
const Customer = require('../models/Customer');
const Employer = require('../models/Employer');
const {
  parseIncomingMessage,
  parseStatusUpdate,
  sendTextMessage,
} = require('../services/whatsappService');
const { generateAIReply } = require('../services/aiAgentService');

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified by Meta');
    return res.status(200).send(challenge);
  }

  return res.status(403).json({
    success: false,
    message: 'Verification failed',
  });
};

const generateCustomerPassword = () => {
  return `${Math.random().toString(36).slice(-8)}Aa1!`;
};

const getEmployerByPhoneNumberId = async (phoneNumberId) => {
  let employer = null;

  if (phoneNumberId) {
    employer = await Employer.findOne({
      phoneNumberId,
      isActive: true,
    });
  }

  if (!employer) {
    employer = await Employer.findOne({ isActive: true }).sort({ createdAt: 1 });
  }

  return employer;
};

const findOrCreateCustomerFromWhatsApp = async (parsed) => {
  let customer = await Customer.findOne({
    $or: [
      { phone: `+${parsed.from}` },
      { 'channel_ids.whatsapp': parsed.from },
    ],
    isActive: true,
  });

  if (customer) return customer;

  const safeEmail = `wa_${parsed.from}_${Date.now()}@local.placeholder`;

  customer = await Customer.create({
    name: parsed.contactName || `WA_${parsed.from}`,
    email: safeEmail,
    password: generateCustomerPassword(),
    phone: `+${parsed.from}`,
    channel_ids: {
      whatsapp: parsed.from,
    },
  });

  return customer;
};

// GET /api/webhook/whatsapp
// Meta verification
// POST /api/webhook/whatsapp
// Incoming messages + statuses
const receiveMessage = async (req, res) => {
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    console.log('\n===== RAW WEBHOOK RECEIVED =====');
    console.log(JSON.stringify(body, null, 2));

    if (body.object !== 'whatsapp_business_account') {
      console.log('Ignored: not a WhatsApp webhook event');
      return;
    }

    const statusUpdate = parseStatusUpdate(body);
    if (statusUpdate) {
      await Message.findOneAndUpdate(
        { messageId: statusUpdate.messageId },
        { status: statusUpdate.status },
        { new: true }
      );

      console.log(`Status updated: ${statusUpdate.messageId} -> ${statusUpdate.status}`);
      return;
    }

    const parsed = parseIncomingMessage(body);
    if (!parsed) {
      console.log('No incoming message found in payload');
      return;
    }

    console.log('\n===== NEW WHATSAPP MESSAGE =====');
    console.log('From:', parsed.contactName);
    console.log('WaID:', parsed.from);
    console.log('Phone Number ID:', parsed.phoneNumberId);
    console.log('Message:', parsed.body);

    const existing = await Message.findOne({ messageId: parsed.messageId });
    if (existing) {
      console.log('Duplicate inbound message ignored');
      return;
    }

    const employer = await getEmployerByPhoneNumberId(parsed.phoneNumberId);
    if (!employer) {
      console.log('No active employer found');
      return;
    }

    const customer = await findOrCreateCustomerFromWhatsApp(parsed);

    const savedMessage = await Message.create({
      employerId: employer._id,
      customerId: customer._id,
      from: parsed.from,
      to: parsed.to,
      messageId: parsed.messageId,
      type: parsed.type,
      body: parsed.body,
      mediaId: parsed.mediaId,
      direction: 'inbound',
      status: 'received',
      whatsappTimestamp: parsed.whatsappTimestamp,
      rawPayload: parsed.rawPayload,
    });

    console.log('Message saved to MongoDB:', savedMessage._id.toString());

    // ── WHATSAPP AUTO-REPLY: check customer flag ──────────────────────────
    if (customer.autoReplyWhatsapp) {
      try {
        // fetch last 10 messages for context
        const msgHistory = await Message.find({
          customerId: customer._id,
          employerId: employer._id,
        })
          .sort({ whatsappTimestamp: -1 })
          .limit(10)
          .select('body direction')
          .lean();

        const history = msgHistory.reverse(); // oldest first for context

        const aiReply = await generateAIReply(
          parsed.body,
          'WhatsApp',
          customer.name,
          history,
          customer.phone || customer.email
        );

        const customerPhone = customer.channel_ids?.whatsapp || customer.phone?.replace('+', '');
        const phoneNumberId = employer.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (customerPhone && phoneNumberId) {
          const result = await sendTextMessage(customerPhone, aiReply, phoneNumberId);

          await Message.create({
            employerId: employer._id,
            customerId: customer._id,
            from: phoneNumberId,
            to: customerPhone,
            messageId: result.messages?.[0]?.id || `auto_${Date.now()}`,
            type: 'text',
            body: aiReply,
            direction: 'outbound',
            status: 'sent',
            whatsappTimestamp: new Date(),
            rawPayload: result,
          });

          console.log(`[Auto-Reply WA] Sent to ${customer.name} (${customerPhone}): ${aiReply.slice(0, 60)}...`);
        } else {
          console.warn('[Auto-Reply WA] Skipped — no phone or phoneNumberId configured');
        }
      } catch (autoErr) {
        console.error('[Auto-Reply WA] Failed:', autoErr.message);
      }
    }
    // ───────────────────────────────────────────────────────────────
  } catch (err) {
    console.error('Webhook processing error:', err);
  }
};


// POST /api/webhook/messages/send
const sendMessage = async (req, res) => {
  try {
    const { employerId, customerId, message } = req.body;

    if (!employerId || !customerId || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'employerId, customerId and message are required',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(customerId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employerId or customerId',
      });
    }

    const employer = await Employer.findOne({ _id: employerId, isActive: true });
    const customer = await Customer.findOne({ _id: customerId, isActive: true });

    if (!employer || !customer) {
      return res.status(404).json({
        success: false,
        message: 'Employer or customer not found',
      });
    }

    const customerPhone =
      customer.channel_ids?.whatsapp || customer.phone?.replace('+', '');

    if (!customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Customer has no WhatsApp number',
      });
    }

    const phoneNumberId = employer.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!phoneNumberId) {
      return res.status(400).json({
        success: false,
        message: 'No WhatsApp phone number id configured',
      });
    }

    const result = await sendTextMessage(customerPhone, message.trim(), phoneNumberId);

    const savedMessage = await Message.create({
      employerId: employer._id,
      customerId: customer._id,
      from: phoneNumberId,
      to: customerPhone,
      messageId: result.messages?.[0]?.id || `out_${Date.now()}`,
      type: 'text',
      body: message.trim(),
      direction: 'outbound',
      status: 'sent',
      whatsappTimestamp: new Date(),
      rawPayload: result,
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: savedMessage,
    });
  } catch (err) {
    console.error('Send message error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp message',
      error: err.response?.data || err.message,
    });
  }
};

// GET /api/webhook/chats?employerId=...
const getAllChats = async (req, res) => {
  try {
    const { employerId } = req.query;

    if (!employerId || !mongoose.Types.ObjectId.isValid(employerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid employerId query param required',
      });
    }

    const chats = await Message.aggregate([
      {
        $match: {
          employerId: new mongoose.Types.ObjectId(employerId),
        },
      },
      { $sort: { whatsappTimestamp: -1 } },
      {
        $group: {
          _id: '$customerId',
          lastMessage: { $first: '$body' },
          lastMessageTime: { $first: '$whatsappTimestamp' },
          lastDirection: { $first: '$direction' },
          lastStatus: { $first: '$status' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'inbound'] },
                    { $eq: ['$status', 'received'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          customerId: '$customer._id',
          customerName: '$customer.name',
          customerEmail: '$customer.email',
          customerPhone: '$customer.phone',
          whatsappId: '$customer.channel_ids.whatsapp',
          lastMessage: 1,
          lastMessageTime: 1,
          lastDirection: 1,
          lastStatus: 1,
          unreadCount: 1,
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      count: chats.length,
      data: chats,
    });
  } catch (err) {
    console.error('Get chats error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// GET /api/webhook/chats/:customerId?employerId=...
const getChatHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { employerId } = req.query;

    if (
      !mongoose.Types.ObjectId.isValid(customerId) ||
      !mongoose.Types.ObjectId.isValid(employerId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid customerId and employerId are required',
      });
    }

    const messages = await Message.find({
      customerId,
      employerId,
    })
      .sort({ whatsappTimestamp: 1 })
      .populate('customerId', 'name email phone channel_ids')
      .populate('employerId', 'name email company phoneNumberId')
      .select('-rawPayload -__v');

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    console.error('Get chat history error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const sendDirectMessage = async (req, res) => {
  try {
    const { to, message, phoneNumberId } = req.body;

    if (!to || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'to and message are required',
      });
    }

    const finalPhoneNumberId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!finalPhoneNumberId) {
      return res.status(400).json({
        success: false,
        message: 'No WhatsApp phone number id configured',
      });
    }

    const cleanTo = String(to).replace(/\D/g, '');
    const formattedPhone = `+${cleanTo}`;

    let employer = await Employer.findOne({
      phoneNumberId: finalPhoneNumberId,
      isActive: true,
    });

    if (!employer) {
      employer = await Employer.findOne({ isActive: true }).sort({ createdAt: 1 });
    }

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'No active employer found',
      });
    }

    let customer = await Customer.findOne({
      $or: [
        { phone: formattedPhone },
        { 'channel_ids.whatsapp': cleanTo },
      ],
      isActive: true,
    });

    if (!customer) {
      const safeEmail = `wa_${cleanTo}_${Date.now()}@local.placeholder`;

      customer = await Customer.create({
        name: `WA_${cleanTo}`,
        email: safeEmail,
        password: generateCustomerPassword(),
        phone: formattedPhone,
        channel_ids: {
          whatsapp: cleanTo,
        },
      });
    }

    const result = await sendTextMessage(cleanTo, message.trim(), finalPhoneNumberId);

    const savedMessage = await Message.create({
      employerId: employer._id,
      customerId: customer._id,
      from: finalPhoneNumberId,
      to: cleanTo,
      messageId: result.messages?.[0]?.id || `out_${Date.now()}`,
      type: 'text',
      body: message.trim(),
      direction: 'outbound',
      status: 'sent',
      whatsappTimestamp: new Date(),
      rawPayload: result,
    });

    return res.status(200).json({
      success: true,
      message: 'Direct WhatsApp message sent and saved successfully',
      data: savedMessage,
    });
  } catch (err) {
    console.error('Send direct message error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send direct WhatsApp message',
      error: err.response?.data || err.message,
    });
  }
};

module.exports = {
  verifyWebhook,
  receiveMessage,
  sendMessage,
  getAllChats,
  getChatHistory,
  sendDirectMessage
};