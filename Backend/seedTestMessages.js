require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('./models/Message');
const Customer = require('./models/Customer');

const EMPLOYER_ID = process.env.EMPLOYER_MONGO_ID;

const conversations = [
  {
    customerQuery: 'john',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1182382191621888',
    messages: [
      { body: 'Hi, I wanted to check about my savings account interest rate. It seems lower than what was advertised.', direction: 'inbound', minutesAgo: 180 },
      { body: 'Hello John! I can help you with that. Let me check your account details. Could you confirm your account number?', direction: 'outbound', minutesAgo: 175 },
      { body: 'Sure, its 4520-8871-3302. Also I noticed a charge of ₹500 that I dont recognize.', direction: 'inbound', minutesAgo: 170 },
      { body: 'Thank you. I see your account — the current rate is 6.5% APY for balances above ₹1L. Regarding the ₹500 charge, that appears to be an annual maintenance fee. Would you like me to look into a waiver?', direction: 'outbound', minutesAgo: 165 },
      { body: 'Yes please get that waived. And can you also tell me about your fixed deposit rates?', direction: 'inbound', minutesAgo: 10 },
    ],
  },
  {
    customerQuery: 'bob',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1182382191621888',
    messages: [
      { body: 'Hello, I need help with my credit card statement. I see a duplicate transaction.', direction: 'inbound', minutesAgo: 1440 },
      { body: 'Hi Bob, I am sorry to hear that. Could you share the transaction date and amount so I can investigate?', direction: 'outbound', minutesAgo: 1430 },
      { body: 'It was on June 20th, ₹2,350 charged twice at Amazon. Order ID is #AMZ-8834721.', direction: 'inbound', minutesAgo: 1420 },
      { body: 'I can see both charges. I have initiated a reversal for the duplicate. It should reflect in 3-5 business days. Is there anything else?', direction: 'outbound', minutesAgo: 1410 },
      { body: 'Thanks! Actually yes — I want to increase my credit limit. Currently its 50K and I need at least 1L.', direction: 'inbound', minutesAgo: 5 },
    ],
  },
  {
    customerQuery: 'jane',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1182382191621888',
    messages: [
      { body: 'Hi, I just moved to a new city and need to update my address. Also, can I get a new debit card delivered to my new address?', direction: 'inbound', minutesAgo: 60 },
    ],
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    if (!EMPLOYER_ID) {
      console.error('EMPLOYER_MONGO_ID not set in .env');
      process.exit(1);
    }

    await Message.deleteMany({});
    console.log('Cleared existing messages');

    for (const conv of conversations) {
      const customer = await Customer.findOne({
        name: { $regex: conv.customerQuery, $options: 'i' },
      });

      if (!customer) {
        console.warn(`Customer "${conv.customerQuery}" not found, skipping`);
        continue;
      }

      const waId = customer.channel_ids?.whatsapp || customer.phone?.replace('+', '') || `test_${Date.now()}`;

      for (const msg of conv.messages) {
        const ts = new Date(Date.now() - msg.minutesAgo * 60 * 1000);

        await Message.create({
          employerId: EMPLOYER_ID,
          customerId: customer._id,
          from: msg.direction === 'inbound' ? waId : conv.phoneNumberId,
          to: msg.direction === 'inbound' ? conv.phoneNumberId : waId,
          messageId: `seed_${customer._id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: 'text',
          body: msg.body,
          direction: msg.direction,
          status: msg.direction === 'inbound' ? 'received' : 'sent',
          whatsappTimestamp: ts,
        });
      }

      console.log(`Seeded ${conv.messages.length} messages for ${customer.name}`);
    }

    const total = await Message.countDocuments();
    console.log(`\nDone — ${total} messages in database`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
