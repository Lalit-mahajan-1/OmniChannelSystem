/**
 * Calculates a customer health score (0–100) from recent ticket intelligence records.
 * Uses a weighted average approach so a larger ticket history doesn't collapse the score.
 *
 * Weights per record:
 *   negative sentiment  → -10
 *   positive sentiment  →  +5
 *   critical priority   → -15
 *   escalation required → -10
 *
 * The raw delta is normalised by the number of records so a single bad ticket doesn't
 * drop a long-standing healthy customer to zero.
 */
const calculateCustomerHealth = (ticketIntelligenceRecords = []) => {
  if (!ticketIntelligenceRecords.length) {
    return { healthScore: 100, healthStatus: 'Healthy' };
  }

  const totalDelta = ticketIntelligenceRecords.reduce((acc, record) => {
    if (record.sentiment === 'negative') acc -= 10;
    if (record.sentiment === 'positive') acc += 5;
    if (record.priority === 'critical') acc -= 15;
    if (record.escalationRequired) acc -= 10;
    return acc;
  }, 0);

  // Normalise: divide by record count so the score is a per-ticket average impact
  const perTicketImpact = totalDelta / ticketIntelligenceRecords.length;

  // Base of 100, scale the per-ticket impact by a factor of 3 for sensitivity
  const healthScore = Math.max(0, Math.min(100, Math.round(100 + perTicketImpact * 3)));

  const healthStatus =
    healthScore >= 75 ? 'Healthy' : healthScore >= 45 ? 'Watchlist' : 'At Risk';

  return { healthScore, healthStatus };
};

module.exports = { calculateCustomerHealth };
