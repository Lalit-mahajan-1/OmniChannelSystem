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
const PORT        = process.env.ANALYTICS_AGENT_PORT || 5005;

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
      max_tokens: 600,
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

// ── Fetch all data from your backend ─────────────────────────────────────────
const fetchAllData = async () => {
  const [emailsRes, waRes, socialRes, customersRes] = await Promise.allSettled([
    axios.get(`${API_BASE}/emails`, { params: { employerId: EMPLOYER_ID, limit: 100 } }),
    axios.get(`${API_BASE}/webhook/chats`, { params: { employerId: EMPLOYER_ID } }),
    axios.get(`${API_BASE}/social/complaints`, { params: { limit: 100 } }),
    axios.get(`${API_BASE}/customers`, { params: { limit: 100 } }),
  ]);

  return {
    emails:    emailsRes.status    === 'fulfilled' ? (emailsRes.value.data.data    || []) : [],
    waChats:   waRes.status        === 'fulfilled' ? (waRes.value.data.data        || []) : [],
    social:    socialRes.status    === 'fulfilled' ? (socialRes.value.data.data    || []) : [],
    customers: customersRes.status === 'fulfilled' ? (customersRes.value.data.data || []) : [],
  };
};

// ── Compute real metrics from data ────────────────────────────────────────────
const computeMetrics = (emails, waChats, social, customers) => {
  const now = Date.now();
  const oneDayAgo   = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo  = now - 7  * 24 * 60 * 60 * 1000;

  // ── Email metrics
  const totalEmails      = emails.length;
  const repliedEmails    = emails.filter(e => e.status === 'replied' || e.status === 'resolved');
  const unrepliedEmails  = emails.filter(e => e.direction === 'inbound' && e.status === 'received');
  const inboundEmails    = emails.filter(e => e.direction === 'inbound');
  const aiRepliedEmails  = emails.filter(e => e.aiReplySent === true);

  const emailResolutionRate = inboundEmails.length > 0
    ? Math.round((repliedEmails.length / inboundEmails.length) * 100)
    : 0;

  const aiReplyRate = inboundEmails.length > 0
    ? Math.round((aiRepliedEmails.length / inboundEmails.length) * 100)
    : 0;

  // ── WhatsApp metrics
  const totalWaChats    = waChats.length;
  const unreadWaChats   = waChats.filter(c => c.unreadCount > 0);
  const activeWaChats   = waChats.filter(c => {
    const t = new Date(c.lastMessageTime).getTime();
    return t > oneDayAgo;
  });

  // ── Social metrics
  const totalComplaints  = social.filter(s => s.isComplaint).length;
  const unresolvedSocial = social.filter(s =>
    s.isComplaint && !['resolved', 'closed'].includes(s.complaintStatus)
  );
  const negativeSocial   = social.filter(s => s.sentiment === 'negative' || s.sentiment === 'angry');
  const criticalSocial   = social.filter(s => s.priority === 'critical' || s.priority === 'high');

  // ── At-risk customers (have negative sentiment OR unread messages > 2 days old)
  const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
  const atRiskCustomers = [
    ...new Set([
      ...unrepliedEmails
        .filter(e => new Date(e.emailDate || e.createdAt).getTime() < twoDaysAgo)
        .map(e => e.customerId?._id || e.customerId),
      ...unreadWaChats
        .filter(c => new Date(c.lastMessageTime).getTime() < twoDaysAgo)
        .map(c => c.customerId),
    ])
  ].filter(Boolean);

  // ── Channel distribution
  const channelDist = {
    email:     inboundEmails.length,
    whatsapp:  waChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    twitter:   social.filter(s => s.platform === 'twitter').length,
    reddit:    social.filter(s => s.platform === 'reddit').length,
    youtube:   social.filter(s => s.platform === 'youtube').length,
    linkedin:  social.filter(s => s.platform === 'linkedin').length,
  };

  // ── Sentiment breakdown
  const sentimentBreakdown = {
    positive: social.filter(s => s.sentiment === 'positive').length,
    neutral:  social.filter(s => s.sentiment === 'neutral').length,
    negative: negativeSocial.length,
  };

  // ── Recent activity (last 24h)
  const recentEmails = emails.filter(e =>
    new Date(e.emailDate || e.createdAt).getTime() > oneDayAgo
  );
  const recentWaMessages = waChats.filter(c =>
    new Date(c.lastMessageTime).getTime() > oneDayAgo
  );

  return {
    summary: {
      totalCustomers:       customers.length,
      activeChats:          activeWaChats.length + recentEmails.length,
      unrepliedEmails:      unrepliedEmails.length,
      unreadWhatsApp:       unreadWaChats.length,
      atRiskCustomers:      atRiskCustomers.length,
      totalComplaints,
      unresolvedComplaints: unresolvedSocial.length,
      criticalComplaints:   criticalSocial.length,
    },
    rates: {
      emailResolutionRate,
      aiReplyRate,
      negativeRatio: social.length > 0
        ? Math.round((negativeSocial.length / social.length) * 100)
        : 0,
    },
    channels: channelDist,
    sentiment: sentimentBreakdown,
    recentActivity: {
      emailsLast24h:    recentEmails.length,
      whatsappLast24h:  recentWaMessages.length,
    },
    atRiskIds: atRiskCustomers,
    alerts: [
      ...(unrepliedEmails.length > 5  ? [`${unrepliedEmails.length} emails unreplied`] : []),
      ...(unreadWaChats.length > 3    ? [`${unreadWaChats.length} WhatsApp chats unread`] : []),
      ...(criticalSocial.length > 0   ? [`${criticalSocial.length} critical social complaints`] : []),
      ...(atRiskCustomers.length > 0  ? [`${atRiskCustomers.length} at-risk customers need attention`] : []),
    ],
  };
};

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// GET /analytics-agent/metrics
// Real computed metrics from all your data — feeds the analytics dashboard
app.get('/analytics-agent/metrics', async (req, res) => {
  try {
    const { emails, waChats, social, customers } = await fetchAllData();
    const metrics = computeMetrics(emails, waChats, social, customers);
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /analytics-agent/recommendations
// AI-powered recommendations based on current metrics
app.get('/analytics-agent/recommendations', async (req, res) => {
  try {
    const { emails, waChats, social, customers } = await fetchAllData();
    const metrics = computeMetrics(emails, waChats, social, customers);

    const raw = await askGroq(
      `You are a customer support operations analyst.
       Based on the metrics provided, return ONLY a JSON array of 4-5 recommendations.
       Each recommendation must have:
       {
         "priority": "high|medium|low",
         "category": "response_time|ai_automation|customer_risk|social_media|staffing",
         "title": "short action title",
         "description": "2 sentence explanation",
         "action": "specific next step to take right now",
         "impact": "expected improvement"
       }
       Return ONLY the JSON array. No markdown. No explanation.`,
      `Current metrics:
       - Unreplied emails: ${metrics.summary.unrepliedEmails}
       - Unread WhatsApp: ${metrics.summary.unreadWhatsApp}
       - At-risk customers: ${metrics.summary.atRiskCustomers}
       - Critical complaints: ${metrics.summary.criticalComplaints}
       - AI reply rate: ${metrics.rates.aiReplyRate}%
       - Email resolution rate: ${metrics.rates.emailResolutionRate}%
       - Negative sentiment ratio: ${metrics.rates.negativeRatio}%
       - Active chats: ${metrics.summary.activeChats}
       - Alerts: ${metrics.alerts.join(', ') || 'none'}`
    );

    const recommendations = parseJSON(raw) || [];

    res.json({
      success: true,
      metrics: metrics.summary,
      alerts:  metrics.alerts,
      recommendations,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /analytics-agent/channel-breakdown
// Per-channel stats for the channels tab
app.get('/analytics-agent/channel-breakdown', async (req, res) => {
  try {
    const { emails, waChats, social } = await fetchAllData();

    const inbound  = emails.filter(e => e.direction === 'inbound');
    const replied  = emails.filter(e => e.status === 'replied');
    const aiSent   = emails.filter(e => e.aiReplySent);

    res.json({
      success: true,
      data: {
        email: {
          total:          inbound.length,
          replied:        replied.length,
          unreplied:      inbound.filter(e => e.status === 'received').length,
          aiReplied:      aiSent.length,
          resolutionRate: inbound.length > 0 ? Math.round((replied.length / inbound.length) * 100) : 0,
        },
        whatsapp: {
          total:     waChats.length,
          unread:    waChats.filter(c => c.unreadCount > 0).length,
          active:    waChats.filter(c => new Date(c.lastMessageTime) > new Date(Date.now() - 86400000)).length,
        },
        social: {
          total:      social.length,
          complaints: social.filter(s => s.isComplaint).length,
          resolved:   social.filter(s => s.complaintStatus === 'resolved').length,
          critical:   social.filter(s => s.priority === 'critical').length,
          byPlatform: {
            twitter:  social.filter(s => s.platform === 'twitter').length,
            reddit:   social.filter(s => s.platform === 'reddit').length,
            youtube:  social.filter(s => s.platform === 'youtube').length,
            linkedin: social.filter(s => s.platform === 'linkedin').length,
          },
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /analytics-agent/sentiment-trend
// Sentiment data for the sentiment tab chart
app.get('/analytics-agent/sentiment-trend', async (req, res) => {
  try {
    const { social, emails } = await fetchAllData();

    // Group by day for last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const trend = days.map(day => {
      const dayPosts = social.filter(s => {
        const d = new Date(s.scrapedAt || s.createdAt).toISOString().split('T')[0];
        return d === day;
      });

      return {
        date:     day,
        positive: dayPosts.filter(s => s.sentiment === 'positive').length,
        neutral:  dayPosts.filter(s => s.sentiment === 'neutral').length,
        negative: dayPosts.filter(s => s.sentiment === 'negative' || s.sentiment === 'angry').length,
        total:    dayPosts.length,
      };
    });

    const overall = {
      positive: social.filter(s => s.sentiment === 'positive').length,
      neutral:  social.filter(s => s.sentiment === 'neutral').length,
      negative: social.filter(s => s.sentiment === 'negative' || s.sentiment === 'angry').length,
    };

    res.json({ success: true, data: { trend, overall } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /analytics-agent/alerts
// Active alerts that need attention right now
app.get('/analytics-agent/alerts', async (req, res) => {
  try {
    const { emails, waChats, social } = await fetchAllData();
    const metrics = computeMetrics(emails, waChats, social, []);

    const alerts = [
      ...(metrics.summary.unrepliedEmails > 0 ? [{
        type:     'email',
        severity: metrics.summary.unrepliedEmails > 5 ? 'high' : 'medium',
        title:    `${metrics.summary.unrepliedEmails} unreplied emails`,
        action:   'Run Gmail Agent to auto-reply',
        link:     '/dashboard/inbox',
      }] : []),
      ...(metrics.summary.unreadWhatsApp > 0 ? [{
        type:     'whatsapp',
        severity: metrics.summary.unreadWhatsApp > 3 ? 'high' : 'medium',
        title:    `${metrics.summary.unreadWhatsApp} unread WhatsApp chats`,
        action:   'Run WhatsApp Agent to auto-reply',
        link:     '/dashboard/inbox',
      }] : []),
      ...(metrics.summary.criticalComplaints > 0 ? [{
        type:     'social',
        severity: 'critical',
        title:    `${metrics.summary.criticalComplaints} critical social complaints`,
        action:   'Go to My Tasks and resolve immediately',
        link:     '/dashboard/my-tasks',
      }] : []),
      ...(metrics.summary.atRiskCustomers > 0 ? [{
        type:     'customer',
        severity: 'high',
        title:    `${metrics.summary.atRiskCustomers} at-risk customers`,
        action:   'Review customers with no response for 48h+',
        link:     '/dashboard/customers',
      }] : []),
    ];

    res.json({
      success: true,
      count:   alerts.length,
      data:    alerts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\nAnalytics Agent running on http://localhost:${PORT}`);
  console.log(`  GET /analytics-agent/metrics             — real metrics from all data`);
  console.log(`  GET /analytics-agent/recommendations     — AI action recommendations`);
  console.log(`  GET /analytics-agent/channel-breakdown   — per-channel stats`);
  console.log(`  GET /analytics-agent/sentiment-trend     — 7-day sentiment trend`);
  console.log(`  GET /analytics-agent/alerts              — active alerts\n`);
});
