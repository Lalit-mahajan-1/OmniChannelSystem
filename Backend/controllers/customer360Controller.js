const Customer = require('../models/Customer');
const Email = require('../models/Email');
const Message = require('../models/Message');
const SocialComplaint = require('../models/SocialComplaint');

// ── Keyword-based sentiment scoring (mirrors sentiment agent) ─────────────
const scoreText = (text = '') => {
  const t = text.toLowerCase();
  const angry = ['fraud', 'scam', 'worst', 'terrible', 'useless', 'pathetic', 'disgusting', 'lawsuit', 'criminal', 'cheated'];
  const negative = ['bad', 'issue', 'problem', 'complaint', 'failed', 'broken', 'disappointed', 'unhappy', 'refund', 'stuck', 'pending', 'delayed', 'not working'];
  const positive = ['thank', 'good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'resolved', 'helpful', 'satisfied'];

  if (angry.some(w => t.includes(w))) return { label: 'angry', score: -2 };
  const neg = negative.filter(w => t.includes(w)).length;
  const pos = positive.filter(w => t.includes(w)).length;
  if (neg > pos) return { label: 'negative', score: -1 };
  if (pos > neg) return { label: 'positive', score: 1 };
  return { label: 'neutral', score: 0 };
};

// ──────────────────────────────────────────────
// GET /api/customers/:id/360  — Customer 360° Profile
// ──────────────────────────────────────────────
const getCustomer360 = async (req, res) => {
  try {
    // ── 1. Fetch customer profile ─────────────────────────────────────────
    const customer = await Customer.findOne({ _id: req.params.id, isActive: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // ── 2. Fetch all data in parallel ─────────────────────────────────────
    const [emails, messages, socialComplaints] = await Promise.all([
      Email.find({ customerId: customer._id, isArchived: false })
        .sort({ emailDate: -1 })
        .select('-__v -rawPayload')
        .lean(),
      Message.find({ customerId: customer._id })
        .sort({ whatsappTimestamp: -1 })
        .select('-__v -rawPayload')
        .lean(),
      SocialComplaint.find({ customerId: customer._id, isArchived: false })
        .sort({ scrapedAt: -1 })
        .select('-__v')
        .lean(),
    ]);

    // ── 3. Build unified timeline ─────────────────────────────────────────
    const timeline = [];

    emails.forEach(e => {
      timeline.push({
        id: e._id,
        channel: 'email',
        direction: e.direction,
        subject: e.subject || '',
        content: e.body || e.rawBody || '',
        status: e.status,
        timestamp: e.emailDate || e.createdAt,
        aiReply: e.aiReply || null,
        aiReplySent: e.aiReplySent || false,
      });
    });

    messages.forEach(m => {
      timeline.push({
        id: m._id,
        channel: 'whatsapp',
        direction: m.direction,
        subject: null,
        content: m.body || '',
        status: m.status,
        timestamp: m.whatsappTimestamp || m.createdAt,
        aiReply: null,
        aiReplySent: false,
      });
    });

    socialComplaints.forEach(s => {
      timeline.push({
        id: s._id,
        channel: `social_${s.platform}`,
        direction: 'inbound',
        subject: s.keyword,
        content: s.content,
        status: s.complaintStatus,
        timestamp: s.scrapedAt || s.createdAt,
        sentiment: s.sentiment,
        platform: s.platform,
        postUrl: s.postUrl,
      });
    });

    // Sort timeline chronologically (newest first)
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // ── 4. Channel activity stats ─────────────────────────────────────────
    const emailInbound = emails.filter(e => e.direction === 'inbound');
    const emailOutbound = emails.filter(e => e.direction === 'outbound');
    const waInbound = messages.filter(m => m.direction === 'inbound');
    const waOutbound = messages.filter(m => m.direction === 'outbound');

    const channelStats = {
      email: {
        total: emails.length,
        inbound: emailInbound.length,
        outbound: emailOutbound.length,
        unreplied: emailInbound.filter(e => e.status === 'received').length,
        aiReplied: emails.filter(e => e.aiReplySent).length,
      },
      whatsapp: {
        total: messages.length,
        inbound: waInbound.length,
        outbound: waOutbound.length,
        unread: waInbound.filter(m => m.status === 'received').length,
      },
      social: {
        total: socialComplaints.length,
        complaints: socialComplaints.filter(s => s.isComplaint).length,
        resolved: socialComplaints.filter(s => s.complaintStatus === 'resolved').length,
        platforms: [...new Set(socialComplaints.map(s => s.platform))],
      },
    };

    // ── 5. Engagement metrics ─────────────────────────────────────────────
    const totalInteractions = emails.length + messages.length + socialComplaints.length;
    const channelsUsed = [];
    if (emails.length > 0) channelsUsed.push('email');
    if (messages.length > 0) channelsUsed.push('whatsapp');
    if (socialComplaints.length > 0) channelsUsed.push('social');

    // First and last interaction dates
    const allDates = timeline.map(t => new Date(t.timestamp).getTime()).filter(d => !isNaN(d));
    const firstInteraction = allDates.length ? new Date(Math.min(...allDates)) : null;
    const lastInteraction = allDates.length ? new Date(Math.max(...allDates)) : null;

    // Average response time (email: first inbound → first outbound per thread)
    const threadMap = {};
    emails.forEach(e => {
      if (!threadMap[e.threadId]) threadMap[e.threadId] = { inbound: null, outbound: null };
      if (e.direction === 'inbound' && !threadMap[e.threadId].inbound) threadMap[e.threadId].inbound = new Date(e.emailDate || e.createdAt);
      if (e.direction === 'outbound' && !threadMap[e.threadId].outbound) threadMap[e.threadId].outbound = new Date(e.emailDate || e.createdAt);
    });
    const responseTimes = [];
    Object.values(threadMap).forEach(t => {
      if (t.inbound && t.outbound && t.outbound > t.inbound) {
        responseTimes.push((t.outbound - t.inbound) / 60000); // minutes
      }
    });
    const avgResponseTimeMin = responseTimes.length
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

    // ── 6. Sentiment analysis ─────────────────────────────────────────────
    const inboundContent = [
      ...emailInbound.map(e => e.body || e.rawBody || ''),
      ...waInbound.map(m => m.body || ''),
    ];

    const sentimentScores = inboundContent.map(txt => scoreText(txt));
    const sentimentCounts = { angry: 0, negative: 0, neutral: 0, positive: 0 };
    sentimentScores.forEach(s => { sentimentCounts[s.label]++; });

    const avgSentiment = sentimentScores.length
      ? sentimentScores.reduce((a, b) => a + b.score, 0) / sentimentScores.length
      : 0;
    const overallSentiment = avgSentiment <= -1.5 ? 'angry'
      : avgSentiment <= -0.5 ? 'negative'
        : avgSentiment >= 0.5 ? 'positive'
          : 'neutral';

    // Sentiment trend (first half vs second half)
    const half = Math.floor(sentimentScores.length / 2);
    const firstHalf = sentimentScores.slice(0, half).map(s => s.score);
    const secondHalf = sentimentScores.slice(half).map(s => s.score);
    const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const sentimentTrend = secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable';

    // ── 7. Resolution status ──────────────────────────────────────────────
    const allItems = [...emails, ...messages];
    const hasOutbound = allItems.some(m => m.direction === 'outbound');
    let resolutionStatus = 'no_interaction';
    if (allItems.length > 0) {
      if (!hasOutbound) {
        resolutionStatus = 'unresolved';
      } else {
        const lastInboundTime = Math.max(
          ...emailInbound.map(e => new Date(e.emailDate || e.createdAt).getTime()),
          ...waInbound.map(m => new Date(m.whatsappTimestamp || m.createdAt).getTime()),
          0
        );
        const lastOutboundTime = Math.max(
          ...emailOutbound.map(e => new Date(e.emailDate || e.createdAt).getTime()),
          ...waOutbound.map(m => new Date(m.whatsappTimestamp || m.createdAt).getTime()),
          0
        );
        resolutionStatus = lastInboundTime > lastOutboundTime ? 'pending' : 'resolved';
      }
    }

    // ── 8. Activity by day of week (for engagement heatmap) ───────────────
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
    const hourCounts = new Array(24).fill(0);
    timeline.forEach(t => {
      const d = new Date(t.timestamp);
      if (!isNaN(d.getTime())) {
        dayOfWeekCounts[d.getDay()]++;
        hourCounts[d.getHours()]++;
      }
    });

    // ── 9. Assemble response ──────────────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        profile: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || null,
          language: customer.language,
          timezone: customer.timezone,
          channel_ids: customer.channel_ids || {},
          isActive: customer.isActive,
          autoReplyEmail: customer.autoReplyEmail,
          autoReplyWhatsapp: customer.autoReplyWhatsapp,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },

        engagement: {
          totalInteractions,
          channelsUsed,
          firstInteraction,
          lastInteraction,
          avgResponseTimeMin,
          daysSinceFirstContact: firstInteraction
            ? Math.floor((Date.now() - firstInteraction.getTime()) / 86400000)
            : 0,
        },

        channelStats,

        sentiment: {
          overall: overallSentiment,
          score: parseFloat(avgSentiment.toFixed(2)),
          trend: sentimentTrend,
          breakdown: sentimentCounts,
        },

        resolution: {
          status: resolutionStatus,
        },

        activityPattern: {
          byDayOfWeek: {
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            data: dayOfWeekCounts,
          },
          byHour: hourCounts,
        },

        timeline: timeline.slice(0, 100), // Cap at 100 for performance
      },
    });
  } catch (err) {
    console.error('[Customer360] Error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid customer ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getCustomer360 };
