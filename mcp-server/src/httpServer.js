import express from 'express';
import dotenv from 'dotenv';
import { connectMongo, MCPEvent } from './services/mongoService.js';
import { buildCustomerIntelligence } from './intelligence/contextBuilder.js';
import { whatsappGetMessages, whatsappSendMessage } from './tools/whatsapp/messageTool.js';
import { whatsappBroadcast } from './tools/whatsapp/broadcastTool.js';
import { whatsappTranscribeVoice } from './tools/whatsapp/voiceTool.js';
import { linkedinGetBrandComments } from './tools/linkedin/commentsTool.js';
import { twitterSearchComplaints } from './tools/twitter/listeningTool.js';

dotenv.config();
const app = express();
app.use(express.json());

// Enable CORS for frontend demo
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

await connectMongo();

// ── HEALTH CHECK ───────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'MCP server running', timestamp: new Date().toISOString() });
});

// ── INTELLIGENCE (THE BRAIN) ───────────────────────
app.post('/intelligence', async (req, res) => {
  try {
    const { customerIdentifier } = req.body;
    if (!customerIdentifier)
      return res.status(400).json({ error: 'customerIdentifier is required' });
    const result = await buildCustomerIntelligence(customerIdentifier);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── WHATSAPP ───────────────────────────────────────
app.post('/whatsapp/messages', async (req, res) => {
  try {
    const { phone, limit } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    const result = await whatsappGetMessages({ phone, limit: limit || 20 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/whatsapp/send', async (req, res) => {
  try {
    const { phone, message, customerId } = req.body;
    if (!phone || !message)
      return res.status(400).json({ error: 'phone and message are required' });
    const result = await whatsappSendMessage({ phone, message, customerId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/whatsapp/broadcast', async (req, res) => {
  try {
    const { customerIds, message, campaignName } = req.body;
    if (!customerIds || !message || !campaignName)
      return res.status(400).json({ error: 'customerIds, message, campaignName required' });
    const result = await whatsappBroadcast({ customerIds, message, campaignName });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/whatsapp/transcribe', async (req, res) => {
  try {
    const { mediaId, customerId } = req.body;
    if (!mediaId) return res.status(400).json({ error: 'mediaId is required' });
    const result = await whatsappTranscribeVoice({ mediaId, customerId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LINKEDIN ───────────────────────────────────────
app.post('/linkedin/comments', async (req, res) => {
  try {
    const { brandName, keyword, limit } = req.body;
    if (!brandName) return res.status(400).json({ error: 'brandName is required' });
    const result = await linkedinGetBrandComments({ brandName, keyword, limit: limit || 15 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TWITTER ────────────────────────────────────────
app.post('/twitter/complaints', async (req, res) => {
  try {
    const { keyword, brandName, limit } = req.body;
    if (!keyword || !brandName)
      return res.status(400).json({ error: 'keyword and brandName are required' });
    const result = await twitterSearchComplaints({ keyword, brandName, limit: limit || 20 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New endpoint — returns seeded/stored social complaints from MCPEvent
// This is what demo.html uses instead of live scraping
app.post('/social/complaints', async (req, res) => {
  try {
    const { brandName, limit } = req.body;
    const events = await MCPEvent.find({
      channel: { $in: ['twitter', 'linkedin'] },
      intent: 'complaint',
      $or: [
        { 'metadata.brandName': { $regex: brandName, $options: 'i' } },
        { 'metadata.seeded': true }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit || 10)
    .lean();

    const twitter = events.filter(e => e.channel === 'twitter');
    const linkedin = events.filter(e => e.channel === 'linkedin');

    res.json({
      total: events.length,
      complaints: events.filter(e => e.sentiment === 'angry' || e.sentiment === 'negative').length,
      tweets: twitter.map(t => ({
        text: t.content,
        author: t.customerId,
        sentiment: t.sentiment,
        isComplaint: true,
        timestamp: t.createdAt
      })),
      linkedinPosts: linkedin.map(p => ({
        text: p.content,
        author: p.customerId,
        sentiment: p.sentiment,
        isComplaint: true,
        timestamp: p.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.MCP_PORT || 6060;
app.listen(PORT, () => {
  console.log(`[MCP HTTP] Server running on http://localhost:${PORT}`);
  console.log(`[MCP HTTP] Health check: http://localhost:${PORT}/health`);
});
