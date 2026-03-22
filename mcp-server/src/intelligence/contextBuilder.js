import { Email, WAMsg, Social, MCPEvent } from '../services/mongoService.js';

/**
 * Build a structured customer intelligence object from all channels.
 *
 * customerIdentifier — phone number (digits only) OR email address.
 * Returns a ~300-token JSON object ready to inject into an LLM prompt.
 */
export async function buildCustomerIntelligence(customerIdentifier) {

  // ── PARALLEL fetch from all teammate's collections ─────────────────
  //
  //  Email collection fields:  from, fromEmail, to, body, direction, emailDate, createdAt
  //  Message collection fields: from, to, body, direction, customerId, whatsappTimestamp, createdAt
  //  SocialComplaint fields:   author, content, platform, sentiment, isComplaint, scrapedAt
  //  MCPEvent fields:          customerId, channel, direction, content, summary, sentiment, intent, isResolved

  const [waMessages, emails, socialPosts, mcpEvents] = await Promise.all([

    // WhatsApp messages — collection: 'messages'
    // Match on 'from' field (phone) or customerId
    WAMsg.find({
      $or: [
        { from: { $regex: customerIdentifier, $options: 'i' } },
        { to:   { $regex: customerIdentifier, $options: 'i' } },
        { customerId: customerIdentifier }
      ]
    }).sort({ createdAt: 1 }).limit(50).lean(),

    // Emails — collection: 'emails'
    // Match on from, fromEmail, or to fields
    Email.find({
      $or: [
        { from:      { $regex: customerIdentifier, $options: 'i' } },
        { fromEmail: { $regex: customerIdentifier, $options: 'i' } },
        { to:        { $regex: customerIdentifier, $options: 'i' } }
      ]
    }).sort({ emailDate: 1 }).limit(50).lean(),

    // Social complaints — collection: 'socialcomplaints'
    // No customer ID link in most records; pull recent posts for context
    Social.find({
      $or: [
        { author: { $regex: customerIdentifier, $options: 'i' } },
        { isComplaint: true }
      ]
    }).sort({ scrapedAt: -1 }).limit(20).lean(),

    // Our own MCP events
    MCPEvent.find({ customerId: customerIdentifier })
      .sort({ createdAt: 1 }).lean()
  ]);

  // ── MERGE into a unified timeline ──────────────────────────────────
  const allEvents = [
    ...waMessages.map(m => ({
      channel: 'whatsapp',
      timestamp: m.whatsappTimestamp || m.createdAt,
      content: m.body,
      direction: m.direction || 'inbound',
      sentiment: m.sentiment || 'neutral',
      intent: m.intent || null,
      isResolved: false
    })),
    ...emails.map(e => ({
      channel: 'email',
      timestamp: e.emailDate || e.createdAt,
      content: (e.subject || '') + (e.body ? ': ' + e.body.substring(0, 200) : ''),
      direction: e.direction || 'inbound',
      sentiment: e.sentiment || 'neutral',
      intent: null,
      isResolved: e.status === 'replied'
    })),
    ...mcpEvents.map(ev => ({
      channel: ev.channel,
      timestamp: ev.createdAt,
      content: ev.summary || ev.content,
      direction: ev.direction,
      sentiment: ev.sentiment,
      intent: ev.intent,
      isResolved: ev.isResolved
    }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // ── ANALYSE ────────────────────────────────────────────────────────
  const sentimentScore = { positive: 1, neutral: 0, negative: -1, angry: -2 };

  const sentiments = allEvents.map(e => e.sentiment).filter(Boolean);
  const avgSentiment = sentiments.length
    ? sentiments.reduce((s, v) => s + (sentimentScore[v] ?? 0), 0) / sentiments.length
    : 0;

  const unresolvedIssues = allEvents
    .filter(e => e.intent === 'complaint' && !e.isResolved)
    .map(e => e.content?.substring(0, 100));

  const channelsUsed = [...new Set(allEvents.map(e => e.channel))];

  const daysSinceFirst = allEvents.length
    ? Math.floor((Date.now() - new Date(allEvents[0].timestamp)) / 86_400_000)
    : 0;

  const lastOutbound = allEvents.filter(e => e.direction === 'outbound').at(-1);

  const sentimentTrend = sentiments.length > 2
    ? (sentimentScore[sentiments.at(-1)] < sentimentScore[sentiments[0]]
        ? 'escalating' : 'improving')
    : 'stable';

  const socialComplaints = socialPosts
    .filter(p => p.isComplaint || p.sentiment === 'negative')
    .map(p => ({ platform: p.platform, text: p.content?.substring(0, 120) }));

  // ── RETURN structured intelligence ─────────────────────────────────
  return {
    customerIdentifier,
    totalContacts: allEvents.length,
    channelsUsed,
    daysSinceFirstContact: daysSinceFirst,
    currentSentiment: sentiments.at(-1) || 'unknown',
    sentimentTrend,
    averageSentimentScore: parseFloat(avgSentiment.toFixed(2)),
    unresolvedIssues,
    lastAgentResponse: lastOutbound
      ? {
          content: lastOutbound.content?.substring(0, 150),
          timestamp: lastOutbound.timestamp
        }
      : null,
    socialComplaints: socialComplaints.slice(0, 3),
    recentTimeline: allEvents.slice(-5).map(e => ({
      channel: e.channel,
      direction: e.direction,
      summary: e.content?.substring(0, 80),
      sentiment: e.sentiment,
      timestamp: e.timestamp
    })),
    recommendation: unresolvedIssues.length > 0
      ? `Customer has ${unresolvedIssues.length} unresolved issue(s). Prioritise resolution.`
      : sentimentTrend === 'escalating'
        ? 'Sentiment is worsening. Respond with empathy and urgency.'
        : 'Customer in good standing. Standard response appropriate.'
  };
}
