import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { buildCustomerIntelligence } from './src/intelligence/contextBuilder.js';
import { whatsappGetMessages } from './src/tools/whatsapp/messageTool.js';
import { twitterSearchComplaints } from './src/tools/twitter/listeningTool.js';

dotenv.config();

async function runTests() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('\n--- 1. Testing buildCustomerIntelligence ---');
    const intel = await buildCustomerIntelligence('1234567890');
    console.log(JSON.stringify(intel, null, 2));

    console.log('\n--- 2. Testing whatsappGetMessages ---');
    const messages = await whatsappGetMessages({ phone: '7796449253', limit: 5 });
    console.log(JSON.stringify(messages, null, 2));

    console.log('\n--- 3. Testing twitterSearchComplaints ---');
    console.log('Searching Twitter for complaints... (This takes a few seconds)');
    const complaints = await twitterSearchComplaints({ keyword: 'complaint', brandName: 'HDFC Bank', limit: 2 });
    console.log(JSON.stringify(complaints, null, 2));

  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDone.');
    process.exit(0);
  }
}

runTests();
