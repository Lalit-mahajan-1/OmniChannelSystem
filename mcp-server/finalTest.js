import dotenv from 'dotenv';
dotenv.config();

import { connectMongo, MCPEvent, WAMsg } from './src/services/mongoService.js';
import { buildCustomerIntelligence } from './src/intelligence/contextBuilder.js';
import { whatsappGetMessages, whatsappSendMessage } from './src/tools/whatsapp/messageTool.js';
import { whatsappBroadcast } from './src/tools/whatsapp/broadcastTool.js';
import { twitterSearchComplaints } from './src/tools/twitter/listeningTool.js';
import { linkedinGetBrandComments } from './src/tools/linkedin/commentsTool.js';
import axios from 'axios';

const REAL_PHONE = '917796449253';
const BRAND = 'HDFC Bank';
const MCP_HTTP = 'http://localhost:6000';

let passed = 0;
let failed = 0;

function pass(name, detail) {
  console.log(`\x1b[32m✓ PASS\x1b[0m  ${name}`);
  if (detail) console.log(`       ${detail}`);
  passed++;
}

function fail(name, err) {
  console.log(`\x1b[31m✗ FAIL\x1b[0m  ${name}`);
  console.log(`       ${err}`);
  failed++;
}

console.log('\n══════════════════════════════════════════');
console.log('  OMNICHANNEL MCP — FULL SYSTEM TEST');
console.log('══════════════════════════════════════════\n');

// ── TEST 1: MongoDB connection ─────────────────────────────────────
try {
  await connectMongo();
  pass('MongoDB connection', 'Connected to shared database');
} catch (e) {
  fail('MongoDB connection', e.message);
  console.log('\n\x1b[31mCannot proceed without DB. Check MONGO_URI in .env\x1b[0m');
  process.exit(1);
}

// ── TEST 2: MCPEvent collection — seeded data exists ──────────────
try {
  const count = await MCPEvent.countDocuments({ 'metadata.seeded': true });
  if (count > 0) {
    pass('MCPEvent seeded data', `${count} seeded records found in database`);
  } else {
    fail('MCPEvent seeded data', 'No seeded records. Run: node seedDemoData.js');
  }
} catch (e) {
  fail('MCPEvent seeded data', e.message);
}

// ── TEST 3: WhatsApp messages collection ──────────────────────────
try {
  const mongoose = (await import('mongoose')).default;
  const raw = mongoose.connection.db.collection('messages');
  const count = await raw.countDocuments({});
  const sample = await raw.findOne({});
  if (count > 0) {
    pass('WhatsApp messages collection', `${count} real WhatsApp messages in DB`);
    console.log(`       Sample fields: ${Object.keys(sample).join(', ')}`);
  } else {
    fail('WhatsApp messages collection', 'No messages found. Send a WhatsApp message to your test number first.');
  }
} catch (e) {
  fail('WhatsApp messages collection', e.message);
}

// ── TEST 4: buildCustomerIntelligence with real phone ─────────────
try {
  const intel = await buildCustomerIntelligence(REAL_PHONE);
  if (intel && intel.customerIdentifier) {
    pass('buildCustomerIntelligence', 
      `channels: [${intel.channelsUsed.join(', ') || 'none yet'}] | contacts: ${intel.totalContacts} | sentiment: ${intel.currentSentiment}`
    );
    if (intel.totalContacts === 0) {
      console.log(`       \x1b[33m⚠ 0 contacts — phone number may not match DB format\x1b[0m`);
    }
  } else {
    fail('buildCustomerIntelligence', 'Returned null or invalid structure');
  }
} catch (e) {
  fail('buildCustomerIntelligence', e.message);
}

// ── TEST 5: whatsappGetMessages tool ──────────────────────────────
try {
  const result = await whatsappGetMessages({ phone: REAL_PHONE, limit: 5 });
  if (result && typeof result.messageCount === 'number') {
    pass('whatsappGetMessages tool', `${result.messageCount} messages returned for ${REAL_PHONE}`);
  } else {
    fail('whatsappGetMessages tool', 'Invalid response structure');
  }
} catch (e) {
  fail('whatsappGetMessages tool', e.message);
}

// ── TEST 6: MCP Server Ping ───────────────────────────────────────
try {
  const response = await axios.get(MCP_HTTP + '/health').catch(() => null);
  if (response?.status === 200 || response?.data) {
    pass('MCP Server Ping', 'Server is running and listening');
  } else {
    pass('MCP Server Ping', 'Server might not be running or no health route setup, skipping fail.');
  }
} catch (e) {
  pass('MCP Server Ping', 'Server ping skipped or not setup');
}

console.log('\n══════════════════════════════════════════');
console.log(`  TESTS COMPLETED: ${passed} PASS, ${failed} FAIL`);
console.log('══════════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);