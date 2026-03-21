const mongoose = require('mongoose');
const Message = require('../models/Message');
const Customer = require('../models/Customer');
const Employer = require('../models/Employer');

const {
  parseIncomingMessage,
  parseStatusUpdate,
  sendTextMessage,
} = require('../services/whatsappService');

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

const receiveMessage = async (req, res) => {
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    console.log('\n===== RAW WEBHOOK RECEIVED =====');
    console.log(JSON.stringify(body, null, 2));

    if (body.object !== 'whatsapp_business_account') {
      console.log('Not a WhatsApp webhook event');
      return;
    }

    const statusUpdate = parseStatusUpdate(body);
    if (statusUpdate) {
      await Message.findOneAndUpdate(
        { messageId: statusUpdate.messageId },
        { status: statusUpdate.status },
        { new: true }
      );

      console.log(
        `Status updated: ${statusUpdate.messageId} -> ${statusUpdate.status}`
      );
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

    let employer = await Employer.findOne({
      phoneNumberId: parsed.phoneNumberId,
      isActive: true,
    });

    if (!employer) {
      employer = await Employer.findOne({ isActive: true });
    }

    if (!employer) {
      console.log('No active employer found');
      return;
    }

    let customer = await Customer.findOne({
      $or: [{ phone: `+${parsed.from}` }, { 'channel_ids.whatsapp': parsed.from }],
    });

    if (!customer) {
      customer = await Customer.create({
        name: parsed.contactName || `WA_${parsed.from}`,
        email: `wa_${parsed.from}@placeholder.com`,
        password: 'temp123456',
        phone: `+${parsed.from}`,
        channel_ids: {
          whatsapp: parsed.from,
        },
        isActive: true,
      });

      console.log('Customer auto-created:', customer.name);
    }

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

    console.log('Message saved to MongoDB:', savedMessage._id);
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }
};

const sendMessage = async (req, res) => {
  try {
    const { employerId, customerId, message } = req.body;

    const employer = await Employer.findById(employerId);
    const customer = await Customer.findById(customerId);

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

    const phoneNumberId =
      employer.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    const result = await sendTextMessage(customerPhone, message, phoneNumberId);

    await Message.create({
      employerId: employer._id,
      customerId: customer._id,
      from: phoneNumberId,
      to: customerPhone,
      messageId: result.messages?.[0]?.id || '',
      type: 'text',
      body: message,
      direction: 'outbound',
      status: 'sent',
      whatsappTimestamp: new Date(),
      rawPayload: result,
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent',
      data: result,
    });
  } catch (err) {
    console.error('Send message error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: err.response?.data || err.message,
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      customerId: req.params.customerId,
    })
      .sort({ whatsappTimestamp: 1 })
      .select('-rawPayload -__v');

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllConversations = async (req, res) => {
  try {
    const { employerId } = req.query;

    if (!employerId) {
      return res.status(400).json({
        success: false,
        message: 'employerId query param required',
      });
    }

    const conversations = await Message.aggregate([
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
          from: { $first: '$from' },
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'received'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  verifyWebhook,
  receiveMessage,
  sendMessage,
  getConversation,
  getAllConversations,
};