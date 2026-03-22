import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app       = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY  = process.env.GROQ_API_KEY;
const API_BASE  = process.env.API_BASE || 'http://localhost:5000/api';
const PORT      = process.env.SOCIAL_AGENT_PORT || 5004;

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
      max_tokens: 500,
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

// ── Parse JSON safely ─────────────────────────────────────────────────────────
const parseJSON = (text) => {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
};

// ── Analyze a single complaint and return structured action plan ──────────────
const analyzeComplaint = async (complaint) => {
  const raw = await askGroq(
    `You are a social media crisis management expert for a bank.
     Analyze this customer complaint and return ONLY a valid JSON object.
     No markdown. No explanation. Just the JSON.

     Return this exact structure:
     {
       "urgency": "low|medium|high|critical",
       "sentiment": "positive|neutral|negative|angry",
       "category": "fraud|service|technical|billing|general",
       "summary": "one sentence summary of the issue",
       "suggestedAction": "one clear action to take right now",
       "responseTemplate": "a short professional public reply under 50 words",
       "internalNote": "internal note for the support team",
       "shouldEscalate": true or false,
       "escalationReason": "reason if shouldEscalate is true, else empty string",
       "tags": ["tag1", "tag2"]
     }`,
    `Platform: ${complaint.platform}
     Author: ${complaint.author}
     Keyword: ${complaint.keyword}
     Content: ${complaint.content}
     Current Status: ${complaint.complaintStatus}
     Sentiment: ${complaint.sentiment}
     Priority: ${complaint.priority}`
  );

  const parsed = parseJSON(raw);
  if (!parsed) {
    return {
      urgency: complaint.priority || 'medium',
      sentiment: complaint.sentiment || 'negative',
      category: 'general',
      summary: complaint.content?.substring(0, 100),
      suggestedAction: 'Review and respond to the complaint manually.',
      responseTemplate: 'Thank you for bringing this to our attention. We are looking into this immediately.',
      internalNote: 'AI analysis failed. Manual review required.',
      shouldEscalate: false,
      escalationReason: '',
      tags: [complaint.platform, complaint.keyword],
    };
  }
  return parsed;
};

// ════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// POST /social-agent/analyze/:complaintId
// Analyze one complaint and return action plan
app.post('/social-agent/analyze/:complaintId', async (req, res) => {
  try {
    const complaintRes = await axios.get(
      `${API_BASE}/social/complaints/${req.params.complaintId}`
    );
    const complaint = complaintRes.data.data;
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const analysis = await analyzeComplaint(complaint);

    res.json({
      success: true,
      complaintId: req.params.complaintId,
      complaint: {
        platform:  complaint.platform,
        author:    complaint.author,
        content:   complaint.content?.substring(0, 200),
        status:    complaint.complaintStatus,
      },
      analysis,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /social-agent/analyze-all
// Analyze ALL unresolved complaints and return prioritized action list
// Body: { keyword (optional), platform (optional), limit (optional, default 20) }
app.post('/social-agent/analyze-all', async (req, res) => {
  try {
    const { keyword, platform, limit = 20 } = req.body;

    const params = {
      isComplaint: true,
      limit,
    };
    if (keyword)  params.keyword  = keyword;
    if (platform) params.platform = platform;

    const complaintsRes = await axios.get(`${API_BASE}/social/complaints`, { params });
    const complaints = complaintsRes.data.data || [];

    // Filter only unresolved
    const unresolved = complaints.filter(
      c => !['resolved', 'closed'].includes(c.complaintStatus)
    );

    if (!unresolved.length) {
      return res.json({ success: true, message: 'No unresolved complaints', data: [] });
    }

    console.log(`Analyzing ${unresolved.length} complaints...`);

    const results = await Promise.all(
      unresolved.map(async (complaint) => {
        const analysis = await analyzeComplaint(complaint);
        return {
          complaintId: complaint._id,
          platform:    complaint.platform,
          author:      complaint.author,
          content:     complaint.content?.substring(0, 150),
          status:      complaint.complaintStatus,
          analysis,
        };
      })
    );

    // Sort by urgency — critical first
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    results.sort((a, b) =>
      (urgencyOrder[a.analysis.urgency] ?? 3) - (urgencyOrder[b.analysis.urgency] ?? 3)
    );

    res.json({
      success: true,
      total:    results.length,
      critical: results.filter(r => r.analysis.urgency === 'critical').length,
      high:     results.filter(r => r.analysis.urgency === 'high').length,
      data:     results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /social-agent/suggest-response/:complaintId
// Generate a public response for a complaint
// Body: { tone: "formal|empathetic|apologetic" (optional) }
app.post('/social-agent/suggest-response/:complaintId', async (req, res) => {
  try {
    const { tone = 'empathetic' } = req.body;

    const complaintRes = await axios.get(
      `${API_BASE}/social/complaints/${req.params.complaintId}`
    );
    const complaint = complaintRes.data.data;

    const response = await askGroq(
      `You are a social media manager for a bank.
       Write a ${tone} public reply to this ${complaint.platform} complaint.
       Requirements:
       - Max 60 words
       - Professional and ${tone}
       - Offer a clear next step (DM, call helpline, etc.)
       - Do NOT include any hashtags
       - Do NOT admit fault directly
       Return ONLY the reply text. Nothing else.`,
      `Platform: ${complaint.platform}
       Complaint: ${complaint.content}
       Author: @${complaint.author}`
    );

    res.json({ success: true, response, tone });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /social-agent/bulk-scrape-and-analyze
// Trigger scrape then immediately analyze results
// Body: { keyword, platforms: ["twitter","reddit","youtube"] }
app.post('/social-agent/bulk-scrape-and-analyze', async (req, res) => {
  try {
    const { keyword, platforms = ['twitter', 'reddit'] } = req.body;

    if (!keyword) {
      return res.status(400).json({ success: false, message: 'keyword is required' });
    }

    console.log(`Scraping ${platforms.join(', ')} for: ${keyword}`);

    // Scrape first
    const scrapeRes = await axios.post(`${API_BASE}/social/scrape`, {
      keyword,
      platforms,
    });

    const scraped = scrapeRes.data.data || [];
    console.log(`Scraped ${scraped.length} posts`);

    // Get stats
    const statsRes = await axios.get(`${API_BASE}/social/stats`, {
      params: { keyword },
    });

    // Analyze top complaints (max 10 to avoid rate limits)
    const toAnalyze = scraped
      .filter(c => c.isComplaint)
      .slice(0, 10);

    const analyzed = await Promise.all(
      toAnalyze.map(async (c) => {
        const analysis = await analyzeComplaint(c);
        return { ...c, analysis };
      })
    );

    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    analyzed.sort((a, b) =>
      (urgencyOrder[a.analysis?.urgency] ?? 3) - (urgencyOrder[b.analysis?.urgency] ?? 3)
    );

    res.json({
      success:   true,
      keyword,
      platforms,
      scraped:   scraped.length,
      complaints: toAnalyze.length,
      stats:     statsRes.data.data,
      topIssues: analyzed,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /social-agent/stats
// Quick stats overview
app.get('/social-agent/stats', async (req, res) => {
  try {
    const { keyword } = req.query;
    const statsRes = await axios.get(`${API_BASE}/social/stats`, {
      params: keyword ? { keyword } : {},
    });
    res.json(statsRes.data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\nSocial Agent running on http://localhost:${PORT}`);
  console.log(`  POST /social-agent/analyze/:id           — analyze one complaint`);
  console.log(`  POST /social-agent/analyze-all           — analyze all unresolved`);
  console.log(`  POST /social-agent/suggest-response/:id  — generate public reply`);
  console.log(`  POST /social-agent/bulk-scrape-and-analyze — scrape + analyze`);
  console.log(`  GET  /social-agent/stats                 — quick stats\n`);
});
