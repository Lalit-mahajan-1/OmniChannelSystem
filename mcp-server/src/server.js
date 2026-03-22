import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { connectMongo } from './services/mongoService.js';
import { buildCustomerIntelligence } from './intelligence/contextBuilder.js';
import { whatsappGetMessages, whatsappSendMessage } from './tools/whatsapp/messageTool.js';
import { whatsappTranscribeVoice } from './tools/whatsapp/voiceTool.js';
import { whatsappBroadcast } from './tools/whatsapp/broadcastTool.js';
import { linkedinGetBrandComments } from './tools/linkedin/commentsTool.js';
import { twitterSearchComplaints } from './tools/twitter/listeningTool.js';

dotenv.config();

const server = new McpServer({
  name: 'omnichannel-intelligence',
  version: '1.0.0'
});

// ── TOOL 1: THE BRAIN ──────────────────────────────────────────────
server.tool(
  'get_customer_intelligence',
  'Fetch full customer context across all channels (WhatsApp, Email, Social). ' +
  'Pre-processed and structured into ~300 tokens. Always call this first before drafting any reply.',
  {
    customerIdentifier: z.string().describe('Customer phone number (e.g. 917796449253) or email address')
  },
  async ({ customerIdentifier }) => {
    await connectMongo();
    const intel = await buildCustomerIntelligence(customerIdentifier);
    return { content: [{ type: 'text', text: JSON.stringify(intel, null, 2) }] };
  }
);

// ── TOOL 2: WhatsApp get messages ──────────────────────────────────
server.tool(
  'whatsapp_get_messages',
  'Get WhatsApp message history for a customer phone number. Returns message body, direction, and timestamps.',
  {
    phone: z.string().describe('Customer phone with country code, e.g. 917796449253'),
    limit: z.number().optional().describe('Max messages to return (default 20)')
  },
  async (args) => {
    await connectMongo();
    const result = await whatsappGetMessages(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── TOOL 3: WhatsApp send message ──────────────────────────────────
server.tool(
  'whatsapp_send_message',
  'Send a WhatsApp reply to a customer via Meta Graph API. Logs event to MCP collection.',
  {
    phone: z.string().describe('Recipient phone with country code'),
    message: z.string().describe('Message content to send'),
    customerId: z.string().optional().describe('MongoDB customer _id for logging (optional)')
  },
  async (args) => {
    await connectMongo();
    const result = await whatsappSendMessage(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── TOOL 4: WhatsApp voice transcription ───────────────────────────
server.tool(
  'whatsapp_transcribe_voice',
  'Download and transcribe a WhatsApp voice note using local Whisper model (free, no API cost).',
  {
    mediaId: z.string().describe('WhatsApp media ID from webhook payload'),
    customerId: z.string().optional().describe('Customer identifier for logging')
  },
  async (args) => {
    const result = await whatsappTranscribeVoice(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── TOOL 5: WhatsApp broadcast ─────────────────────────────────────
server.tool(
  'whatsapp_broadcast',
  'Send an approved broadcast message to multiple customers. DNC check is automatic — blocked customers are reported, not skipped silently.',
  {
    customerIds: z.array(z.string()).describe('Array of MongoDB customer _id strings'),
    message: z.string().describe('Approved message content to broadcast'),
    campaignName: z.string().describe('Campaign name for tracking (e.g. "March Promo")')
  },
  async (args) => {
    await connectMongo();
    const result = await whatsappBroadcast(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── TOOL 6: LinkedIn brand scraping ────────────────────────────────
server.tool(
  'linkedin_get_brand_comments',
  'Scrape LinkedIn for public posts mentioning your brand. Auto-detects complaints and saves them.',
  {
    brandName: z.string().describe('Brand name to search, e.g. "HDFC Bank"'),
    keyword: z.string().optional().describe('Additional keyword, e.g. "complaint" or "refund"'),
    limit: z.number().optional().describe('Max posts to scrape (default 15)')
  },
  async (args) => {
    await connectMongo();
    const result = await linkedinGetBrandComments(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── TOOL 7: Twitter social listening ───────────────────────────────
server.tool(
  'twitter_search_complaints',
  'Search Twitter/X via Nitter (no API key needed) for brand mentions and complaints. Scores urgency.',
  {
    keyword: z.string().describe('Search keyword, e.g. "refund failed" or "worst service"'),
    brandName: z.string().describe('Brand name, e.g. "HDFC Bank"'),
    limit: z.number().optional().describe('Max tweets to scrape (default 20)')
  },
  async (args) => {
    await connectMongo();
    const result = await twitterSearchComplaints(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Start server ───────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[MCP] OmniChannel Intelligence Server running on stdio');
