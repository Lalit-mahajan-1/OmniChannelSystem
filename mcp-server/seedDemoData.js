import dotenv from 'dotenv';
dotenv.config();

import { connectMongo } from './src/services/mongoService.js';
import { MCPEvent } from './src/services/mongoService.js';
import mongoose from 'mongoose';

await connectMongo();

const REAL_PHONE = '917796449253'; // your real number from DB

console.log('Clearing old seeded data...');
await MCPEvent.deleteMany({ 'metadata.seeded': true });

console.log('Seeding demo data for:', REAL_PHONE);

await MCPEvent.insertMany([

  // ── WhatsApp conversation — 5 messages showing escalation ─────────
  {
    customerId: REAL_PHONE,
    channel: 'whatsapp',
    direction: 'inbound',
    content: 'Hello, I placed an order 3 weeks ago (order #4521) and raised a refund request. No update yet.',
    summary: 'Refund request for order #4521 — 3 weeks pending',
    sentiment: 'neutral',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 21 * 86400000),
    metadata: { seeded: true, urgency: 'medium' }
  },
  {
    customerId: REAL_PHONE,
    channel: 'whatsapp',
    direction: 'outbound',
    content: 'Thank you for reaching out. We have registered your refund request and our team will get back to you within 48 hours.',
    summary: 'Standard acknowledgement — 48hr promise made',
    sentiment: 'neutral',
    intent: 'response',
    isResolved: false,
    createdAt: new Date(Date.now() - 20 * 86400000),
    metadata: { seeded: true }
  },
  {
    customerId: REAL_PHONE,
    channel: 'whatsapp',
    direction: 'inbound',
    content: 'It has been 2 weeks now and no one has contacted me. This is really disappointing.',
    summary: 'Follow-up — no response received, frustrated',
    sentiment: 'negative',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 7 * 86400000),
    metadata: { seeded: true, urgency: 'medium' }
  },
  {
    customerId: REAL_PHONE,
    channel: 'whatsapp',
    direction: 'inbound',
    content: 'I want my money back immediately. This is completely unacceptable. I will escalate this further.',
    summary: 'Escalation threat — demands immediate refund',
    sentiment: 'angry',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 2 * 86400000),
    metadata: { seeded: true, urgency: 'high' }
  },
  {
    customerId: REAL_PHONE,
    channel: 'whatsapp',
    direction: 'inbound',
    content: 'Has anyone even read my messages? I am going to consumer court if this is not resolved today.',
    summary: 'Legal threat — consumer court mentioned — URGENT',
    sentiment: 'angry',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 3600000),
    metadata: { seeded: true, urgency: 'critical' }
  },

  // ── Twitter complaints ─────────────────────────────────────────────
  {
    customerId: 'twitter_user_rohit_k',
    channel: 'twitter',
    direction: 'inbound',
    content: '@HDFCBank worst experience ever. Raised refund 3 weeks ago for order 4521. Zero response. #HDFCBank #complaint #fraud',
    summary: 'Public Twitter complaint — refund delay 3 weeks',
    sentiment: 'angry',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 2 * 86400000),
    metadata: { seeded: true, platform: 'twitter', urgency: 'high', brandName: 'HDFC Bank' }
  },
  {
    customerId: 'twitter_user_priya_s',
    channel: 'twitter',
    direction: 'inbound',
    content: 'Absolute fraud by @HDFCBank. Took money, no product, no refund, no response. Pathetic customer service. #consumer #complaint',
    summary: 'Fraud allegation on Twitter — high urgency',
    sentiment: 'angry',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 86400000),
    metadata: { seeded: true, platform: 'twitter', urgency: 'critical', brandName: 'HDFC Bank' }
  },
  {
    customerId: 'twitter_user_ankit_m',
    channel: 'twitter',
    direction: 'inbound',
    content: 'Been waiting for refund from @HDFCBank for over a month. No updates, no calls back. Is this how you treat customers?',
    summary: 'Month-long refund wait — public complaint',
    sentiment: 'negative',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 5 * 3600000),
    metadata: { seeded: true, platform: 'twitter', urgency: 'medium', brandName: 'HDFC Bank' }
  },
  {
    customerId: 'twitter_user_meena_r',
    channel: 'twitter',
    direction: 'inbound',
    content: '@HDFCBank your customer service is broken. Called 5 times, every agent says different thing. Terrible.',
    summary: 'Inconsistent agent responses — service complaint',
    sentiment: 'negative',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 8 * 3600000),
    metadata: { seeded: true, platform: 'twitter', urgency: 'medium', brandName: 'HDFC Bank' }
  },

  // ── LinkedIn complaints ────────────────────────────────────────────
  {
    customerId: 'linkedin_user_vikram_s',
    channel: 'linkedin',
    direction: 'inbound',
    content: 'Extremely disappointed with HDFC Bank\'s customer service. Raised a complaint 3 weeks ago, still unresolved. Professionals deserve better banking.',
    summary: 'LinkedIn public post — professional calling out HDFC',
    sentiment: 'negative',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 3 * 86400000),
    metadata: { seeded: true, platform: 'linkedin', urgency: 'medium', brandName: 'HDFC Bank' }
  },
  {
    customerId: 'linkedin_user_sneha_d',
    channel: 'linkedin',
    direction: 'inbound',
    content: 'I have been a loyal HDFC Bank customer for 8 years. The recent experience with their support team has been absolutely terrible. Refund pending for 4 weeks.',
    summary: 'Loyal customer expressing disappointment — LinkedIn',
    sentiment: 'negative',
    intent: 'complaint',
    isResolved: false,
    createdAt: new Date(Date.now() - 4 * 86400000),
    metadata: { seeded: true, platform: 'linkedin', urgency: 'high', brandName: 'HDFC Bank' }
  }
]);

// ── Verify what was seeded ─────────────────────────────────────────
const count = await MCPEvent.countDocuments({ 'metadata.seeded': true });
const waCount = await MCPEvent.countDocuments({ 'metadata.seeded': true, channel: 'whatsapp' });
const twCount = await MCPEvent.countDocuments({ 'metadata.seeded': true, channel: 'twitter' });
const liCount = await MCPEvent.countDocuments({ 'metadata.seeded': true, channel: 'linkedin' });

console.log('\n✓ Seeding complete!');
console.log(`  Total records: ${count}`);
console.log(`  WhatsApp: ${waCount} messages`);
console.log(`  Twitter:  ${twCount} complaints`);
console.log(`  LinkedIn: ${liCount} posts`);
console.log(`  Customer phone: ${REAL_PHONE}`);
console.log('\nNow open demo.html and use phone number:', REAL_PHONE);

process.exit(0);
