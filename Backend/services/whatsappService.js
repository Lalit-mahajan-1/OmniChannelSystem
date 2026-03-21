const axios = require('axios');

const GRAPH_API_URL = 'https://graph.facebook.com/v22.0';

const sendTextMessage = async (to, text, phoneNumberId) => {
  const token = process.env.WHATSAPP_TOKEN;

  const response = await axios.post(
    `${GRAPH_API_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

const parseIncomingMessage = (body) => {
  try {
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.length) return null;

    const msg = value.messages[0];
    const contact = value.contacts?.[0];

    let messageBody = '';
    if (msg.type === 'text') {
      messageBody = msg.text?.body || '';
    } else if (msg.type === 'button') {
      messageBody = msg.button?.text || '';
    } else if (msg.type === 'interactive') {
      messageBody = JSON.stringify(msg.interactive || {});
    } else if (msg.type === 'image') {
      messageBody = '[image received]';
    } else if (msg.type === 'document') {
      messageBody = '[document received]';
    } else if (msg.type === 'audio') {
      messageBody = '[audio received]';
    } else if (msg.type === 'video') {
      messageBody = '[video received]';
    } else {
      messageBody = `[${msg.type} message received]`;
    }

    return {
      messageId: msg.id,
      from: msg.from,
      to: value.metadata?.display_phone_number || '',
      phoneNumberId: value.metadata?.phone_number_id || '',
      type: msg.type,
      body: messageBody,
      mediaId:
        msg.image?.id ||
        msg.document?.id ||
        msg.audio?.id ||
        msg.video?.id ||
        '',
      whatsappTimestamp: msg.timestamp
        ? new Date(parseInt(msg.timestamp, 10) * 1000)
        : new Date(),
      contactName: contact?.profile?.name || 'Unknown',
      rawPayload: body,
    };
  } catch (err) {
    console.error('parseIncomingMessage error:', err.message);
    return null;
  }
};

const parseStatusUpdate = (body) => {
  try {
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (!value?.statuses?.length) return null;

    const status = value.statuses[0];

    return {
      messageId: status.id,
      status: status.status,
    };
  } catch (err) {
    console.error('parseStatusUpdate error:', err.message);
    return null;
  }
};

module.exports = {
  sendTextMessage,
  parseIncomingMessage,
  parseStatusUpdate,
};