import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app         = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY    = process.env.GROQ_API_KEY;
const API_BASE    = process.env.API_BASE || 'http://localhost:5000/api';
const EMPLOYER_ID = process.env.EMPLOYER_MONGO_ID;
const PORT        = process.env.SENTIMENT_AGENT_PORT || 5006;

// ── Groq AI ───────────────────────────────────────────────────────────────────
const askGroq = async (systemPrompt, userPrompt) => {
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      max_tokens: 800,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data.choices[0].message.content.trim();
};

const parseJSON = (text) => {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
};

// ── Score sentiment from text (local, no AI needed) ───────────────────────────
const scoreText = (text = '') => {
  const t = text.toLowerCase();
  const angry    = ['fraud', 'scam', 'worst', 'terrible', 'useless', 'pathetic', 'disgusting', 'lawsuit', 'criminal', 'cheated'];
  const negative = ['bad', 'issue', 'problem', 'complaint', 'failed', 'broken', 'disappointed', 'unhappy', 'refund', 'stuck', 'pending', 'delayed', 'not working'];
  const positive = ['thank', 'good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'resolved', 'helpful', 'satisfied'];

  const angryScore    = angry.filter(w => t.includes(w)).length;
  const negativeScore = negative.filter(w => t.includes(w)).length;
  const positiveScore = positive.filter(w => t.includes(w)).length;

  if (angryScore > 0)          return { label: 'angry',    score: -2 };
  if (negativeScore > positiveScore) return { label: 'negative', score: -1 };
  if (positiveScore > negativeScore) return { label: 'positive', score:  1 };
  return { label: 'neutral', score: 0 };
};

// ── Determine resolution status ───────────────────────────────────────────────
const getResolutionStatus = (messages = [], emails = []) => {
  const hasOutbound = [...messages, ...emails].some(m => m.direction === 'outbound');
  const lastInbound = [...messages, ...emails]
    .filter(m => m.direction === 'inbound')
    .sort((a, b) => new Date(b.whatsappTimestamp || b.emailDate || b.createdAt) - new Date(a.whatsappTimestamp || a.emailDate || a.createdAt))[0];

  const lastOutbound = [...messages, ...emails]
    .filter(m => m.direction === 'outbound')
    .sort((a, b) => new Date(b.whatsappTimestamp || b.emailDate || b.createdAt) - new Date(a.whatsappTimestamp || a.emailDate || a.createdAt))[0];

  if (!hasOutbound) return 'unresolved';

  // Check if last message is from customer (means still open)
  const lastInTime  = new Date(lastInbound?.whatsappTimestamp  || lastInbound?.emailDate  || lastInbound?.createdAt  || 0).getTime();
  const lastOutTime = new Date(lastOutbound?.whatsappTimestamp || lastOutbound?.emailDate || lastOutbound?.createdAt || 0).getTime();

  if (lastInTime > lastOutTime) return 'pending';
  return 'resolved';
};

// ── Compute response time in minutes ─────────────────────────────────────────
const getResponseTime = (messages = []) => {
  const inbound  = messages.filter(m => m.direction === 'inbound').sort((a, b) => new Date(a.whatsappTimestamp || a.emailDate || a.createdAt) - new Date(b.whatsappTimestamp || b.emailDate || b.createdAt));
  const outbound = messages.filter(m => m.direction === 'outbound').sort((a, b) => new Date(a.whatsappTimestamp || a.emailDate || a.createdAt) - new Date(b.whatsappTimestamp || b.emailDate || b.createdAt));

  if (!inbound.length || !outbound.length) return null;

  const firstInTime  = new Date(inbound[0].whatsappTimestamp  || inbound[0].emailDate  || inbound[0].createdAt).getTime();
  const firstOutTime = new Date(outbound[0].whatsappTimestamp || outbound[0].emailDate || outbound[0].createdAt).getTime();

  if (firstOutTime < firstInTime) return null;
  return Math.round((firstOutTime - firstInTime) / 60000); // minutes
};

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// POST /sentiment-agent/analyze-customer
// Full sentiment + resolution report for one customer across all channels
// Body: { customerId }
app.post('/sentiment-agent/analyze-customer', async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required' });
    }

    // Fetch all messages for this customer
    const [waRes, emailRes, customerRes] = await Promise.allSettled([
      axios.get(`${API_BASE}/webhook/chats/${customerId}`, { params: { employerId: EMPLOYER_ID } }),
      axios.get(`${API_BASE}/emails/customer/${customerId}`),
      axios.get(`${API_BASE}/customers/${customerId}`),
    ]);

    const waMessages   = waRes.status    === 'fulfilled' ? (waRes.value.data.data    || []) : [];
    const emails       = emailRes.status === 'fulfilled' ? (emailRes.value.data.data || []) : [];
    const customer     = customerRes.status === 'fulfilled' ? customerRes.value.data.data : null;

    const allMessages  = [...waMessages, ...emails];
    if (!allMessages.length) {
      return res.status(404).json({ success: false, message: 'No messages found for this customer' });
    }

    // Score each message
    const scoredMessages = allMessages.map(m => ({
      channel:   m.body ? 'whatsapp' : 'email',
      direction: m.direction,
      content:   m.body || m.rawBody || '',
      timestamp: m.whatsappTimestamp || m.emailDate || m.createdAt,
      sentiment: scoreText(m.body || m.rawBody || ''),
    }));

    // Overall sentiment
    const scores        = scoredMessages.filter(m => m.direction === 'inbound').map(m => m.sentiment.score);
    const avgScore      = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const overallLabel  = avgScore <= -1.5 ? 'angry' : avgScore <= -0.5 ? 'negative' : avgScore >= 0.5 ? 'positive' : 'neutral';

    // Resolution
    const resolutionStatus = getResolutionStatus(waMessages, emails);
    const responseTimeMin  = getResponseTime(allMessages);

    // Sentiment trend (first half vs second half)
    const half       = Math.floor(scoredMessages.length / 2);
    const firstHalf  = scoredMessages.slice(0, half).map(m => m.sentiment.score);
    const secondHalf = scoredMessages.slice(half).map(m => m.sentiment.score);
    const firstAvg   = firstHalf.length  ? firstHalf.reduce((a, b)  => a + b, 0) / firstHalf.length  : 0;
    const secondAvg  = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const trend      = secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable';

    // AI deep analysis
    const conversationText = scoredMessages
      .slice(-8)
      .map(m => `[${m.channel.toUpperCase()}] ${m.direction === 'inbound' ? 'Customer' : 'Support'}: ${m.content?.substring(0, 120)}`)
      .join('\n');

    const aiAnalysis = await askGroq(
      `You are a customer experience analyst.
       Analyze this conversation and return ONLY a JSON object with:
       {
         "mainQuery": "what exactly the customer was asking about",
         "queryCategory": "billing|technical|account|complaint|general",
         "isResolved": true or false,
         "resolutionQuality": "excellent|good|poor|none",
         "customerFrustrationLevel": "low|medium|high|critical",
         "keyIssues": ["issue1", "issue2"],
         "whatWentWell": "one sentence",
         "whatCouldImprove": "one sentence",
         "recommendedNextAction": "specific action to take"
       }
       Return ONLY the JSON. No markdown.`,
      `Conversation:\n${conversationText}`
    );

    const analysis = parseJSON(aiAnalysis) || {};

    res.json({
      success: true,
      customer: {
        id:    customerId,
        name:  customer?.name  || 'Unknown',
        email: customer?.email || '',
        phone: customer?.phone || '',
      },
      sentiment: {
        overall:     overallLabel,
        score:       parseFloat(avgScore.toFixed(2)),
        trend,
        breakdown: {
          angry:    scoredMessages.filter(m => m.sentiment.label === 'angry').length,
          negative: scoredMessages.filter(m => m.sentiment.label === 'negative').length,
          neutral:  scoredMessages.filter(m => m.sentiment.label === 'neutral').length,
          positive: scoredMessages.filter(m => m.sentiment.label === 'positive').length,
        },
      },
      resolution: {
        status:           resolutionStatus,
        responseTimeMin,
        totalMessages:    allMessages.length,
        inboundCount:     allMessages.filter(m => m.direction === 'inbound').length,
        outboundCount:    allMessages.filter(m => m.direction === 'outbound').length,
        channelsUsed:     [...new Set(allMessages.map(m => m.body ? 'whatsapp' : 'email'))],
      },
      aiAnalysis: analysis,
      timeline: scoredMessages.map(m => ({
        direction: m.direction,
        channel:   m.channel,
        content:   m.content?.substring(0, 100),
        sentiment: m.sentiment.label,
        timestamp: m.timestamp,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /sentiment-agent/full-report
// Full report across ALL customers — the main report endpoint
app.get('/sentiment-agent/full-report', async (req, res) => {
  try {
    // Fetch all emails and WA chats
    const [emailsRes, waRes, customersRes] = await Promise.allSettled([
      axios.get(`${API_BASE}/emails`, { params: { employerId: EMPLOYER_ID, limit: 200 } }),
      axios.get(`${API_BASE}/webhook/chats`, { params: { employerId: EMPLOYER_ID } }),
      axios.get(`${API_BASE}/customers`, { params: { limit: 100 } }),
    ]);

    const emails    = emailsRes.status    === 'fulfilled' ? (emailsRes.value.data.data    || []) : [];
    const waChats   = waRes.status        === 'fulfilled' ? (waRes.value.data.data        || []) : [];
    const customers = customersRes.status === 'fulfilled' ? (customersRes.value.data.data || []) : [];

    // Per-customer analysis
    const customerMap = new Map();

    // Process emails
    emails.forEach(e => {
      const cid  = e.customerId?._id || e.customerId;
      const name = e.customerId?.name || 'Unknown';
      if (!cid) return;

      if (!customerMap.has(cid)) {
        customerMap.set(cid, { id: cid, name, messages: [], emails: [] });
      }
      customerMap.get(cid).emails.push(e);
    });

    // Process WA chats
    waChats.forEach(c => {
      const cid  = c.customerId;
      const name = c.customerName || 'Unknown';
      if (!cid) return;

      if (!customerMap.has(cid)) {
        customerMap.set(cid, { id: cid, name, messages: [], emails: [] });
      }
      // mark channel
      customerMap.get(cid).hasWhatsApp = true;
      customerMap.get(cid).lastMessage = c.lastMessage;
      customerMap.get(cid).unreadCount = c.unreadCount;
    });

    // Compute per-customer scores
    const customerReports = Array.from(customerMap.values()).map(c => {
      const allContent = [
        ...c.emails.map(e => e.body || e.rawBody || ''),
        c.lastMessage || '',
      ].join(' ');

      const sentiment        = scoreText(allContent);
      const unrepliedEmails  = c.emails.filter(e => e.direction === 'inbound' && e.status === 'received');
      const repliedEmails    = c.emails.filter(e => e.status === 'replied');
      const resolutionStatus = c.emails.length > 0
        ? getResolutionStatus([], c.emails)
        : (c.unreadCount > 0 ? 'pending' : 'resolved');

      return {
        customerId:       c.id,
        name:             c.name,
        sentiment:        sentiment.label,
        sentimentScore:   sentiment.score,
        resolutionStatus,
        unrepliedEmails:  unrepliedEmails.length,
        totalEmails:      c.emails.length,
        hasWhatsApp:      !!c.hasWhatsApp,
        unreadWhatsApp:   c.unreadCount || 0,
        isAtRisk:         sentiment.label === 'angry' || sentiment.label === 'negative' || unrepliedEmails.length > 2,
      };
    });

    // Overall stats
    const totalCustomers   = customerReports.length;
    const resolved         = customerReports.filter(c => c.resolutionStatus === 'resolved').length;
    const pending          = customerReports.filter(c => c.resolutionStatus === 'pending').length;
    const unresolved       = customerReports.filter(c => c.resolutionStatus === 'unresolved').length;
    const atRisk           = customerReports.filter(c => c.isAtRisk).length;
    const resolutionRate   = totalCustomers > 0 ? Math.round((resolved / totalCustomers) * 100) : 0;

    const sentimentBreakdown = {
      positive: customerReports.filter(c => c.sentiment === 'positive').length,
      neutral:  customerReports.filter(c => c.sentiment === 'neutral').length,
      negative: customerReports.filter(c => c.sentiment === 'negative').length,
      angry:    customerReports.filter(c => c.sentiment === 'angry').length,
    };

    // AI executive summary
    const summaryRaw = await askGroq(
      `You are a customer experience director.
       Write a brief executive summary (3-4 sentences) about the current 
       customer support performance. Be specific and actionable.
       Then return ONLY a JSON object:
       {
         "executiveSummary": "3-4 sentence summary",
         "healthScore": 0-100 number,
         "topConcern": "biggest issue right now",
         "quickWin": "one thing to do today to improve most",
         "weeklyTrend": "improving|stable|declining"
       }`,
      `Stats:
       Total customers: ${totalCustomers}
       Resolved: ${resolved} (${resolutionRate}%)
       Pending: ${pending}
       Unresolved: ${unresolved}
       At-risk: ${atRisk}
       Sentiment: ${JSON.stringify(sentimentBreakdown)}
       Unreplied emails: ${emails.filter(e => e.direction === 'inbound' && e.status === 'received').length}
       Unread WhatsApp: ${waChats.filter(c => c.unreadCount > 0).length}`
    );

    const aiSummary = parseJSON(summaryRaw) || { executiveSummary: summaryRaw };

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      overview: {
        totalCustomers,
        resolutionRate,
        resolved,
        pending,
        unresolved,
        atRisk,
        sentimentBreakdown,
      },
      aiSummary,
      customers: customerReports.sort((a, b) => {
        // Sort: at-risk first, then by sentiment score
        if (a.isAtRisk && !b.isAtRisk) return -1;
        if (!a.isAtRisk && b.isAtRisk) return 1;
        return a.sentimentScore - b.sentimentScore;
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /sentiment-agent/resolution-stats
// Quick resolution stats — how many resolved, pending, unresolved
app.get('/sentiment-agent/resolution-stats', async (req, res) => {
  try {
    const emailsRes = await axios.get(`${API_BASE}/emails`, {
      params: { employerId: EMPLOYER_ID, limit: 200 },
    });
    const emails = emailsRes.data.data || [];

    const inbound    = emails.filter(e => e.direction === 'inbound');
    const resolved   = inbound.filter(e => ['replied', 'resolved', 'closed'].includes(e.status));
    const pending    = inbound.filter(e => e.status === 'pending');
    const unresolved = inbound.filter(e => e.status === 'received');
    const aiHandled  = inbound.filter(e => e.aiReplySent === true);

    const avgResponseMs = emails
      .filter(e => e.direction === 'outbound' && e.emailDate)
      .reduce((acc, e) => acc, 0);

    res.json({
      success: true,
      data: {
        total:          inbound.length,
        resolved:       resolved.length,
        pending:        pending.length,
        unresolved:     unresolved.length,
        aiHandled:      aiHandled.length,
        resolutionRate: inbound.length > 0 ? Math.round((resolved.length / inbound.length) * 100) : 0,
        aiRate:         inbound.length > 0 ? Math.round((aiHandled.length / inbound.length) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\nSentiment & Resolution Agent running on http://localhost:${PORT}`);
  console.log(`  POST /sentiment-agent/analyze-customer  — deep analysis for one customer`);
  console.log(`  GET  /sentiment-agent/full-report       — full report all customers`);
  console.log(`  GET  /sentiment-agent/resolution-stats  — quick resolution numbers\n`);
});
