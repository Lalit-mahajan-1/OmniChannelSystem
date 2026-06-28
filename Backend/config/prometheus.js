const promClient = require("prom-client");

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Enable default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics for OmniChannel

// AI Pipeline duration histogram
const aiPipelineDuration = new promClient.Histogram({
  name: "omni_ai_pipeline_duration_ms",
  help: "Duration of AI pipeline processing in milliseconds",
  labelNames: ["conversation_id", "status"],
  buckets: [100, 500, 1000, 2000, 5000, 10000],
  registers: [register],
});

// AI confidence score gauge
const aiConfidenceScore = new promClient.Gauge({
  name: "omni_ai_confidence_score",
  help: "Rolling average of AI confidence scores",
  labelNames: ["agent_name"],
  registers: [register],
});

// Tickets created counter
const ticketsCreated = new promClient.Counter({
  name: "omni_tickets_created_total",
  help: "Total number of tickets created",
  labelNames: ["channel", "priority"],
  registers: [register],
});

// SLA breaches counter
const slaBreaches = new promClient.Counter({
  name: "omni_sla_breaches_total",
  help: "Total number of SLA breaches",
  labelNames: ["breach_type", "severity"],
  registers: [register],
});

// Active conversations gauge
const activeConversations = new promClient.Gauge({
  name: "omni_active_conversations",
  help: "Current number of active conversations",
  labelNames: ["status", "channel"],
  registers: [register],
});

// Socket connections gauge
const socketConnections = new promClient.Gauge({
  name: "omni_socket_connections",
  help: "Current number of Socket.IO connections",
  registers: [register],
});

// Embedding queue depth gauge
const embeddingQueueDepth = new promClient.Gauge({
  name: "omni_embedding_queue_depth",
  help: "Current depth of embedding queue",
  registers: [register],
});

// Churn high risk count gauge
const churnHighRiskCount = new promClient.Gauge({
  name: "omni_churn_high_risk_count",
  help: "Current number of customers at high churn risk",
  labelNames: ["employer_id"],
  registers: [register],
});

// Knowledge base articles counter
const knowledgeBaseArticles = new promClient.Gauge({
  name: "omni_knowledge_base_articles",
  help: "Total number of knowledge base articles",
  labelNames: ["category", "employer_id"],
  registers: [register],
});

// RAG queries counter
const ragQueries = new promClient.Counter({
  name: "omni_rag_queries_total",
  help: "Total number of RAG queries",
  labelNames: ["query_type", "status"],
  registers: [register],
});

// Helper functions to update metrics

function recordAIPipelineDuration(conversationId, duration, status) {
  aiPipelineDuration.observe({ conversation_id: conversationId, status }, duration);
}

function updateAIConfidenceScore(agentName, score) {
  aiConfidenceScore.set({ agent_name: agentName }, score);
}

function incrementTicketsCreated(channel, priority) {
  ticketsCreated.inc({ channel, priority });
}

function incrementSLABreaches(breachType, severity) {
  slaBreaches.inc({ breach_type: breachType, severity });
}

function setActiveConversations(status, channel, count) {
  activeConversations.set({ status, channel }, count);
}

function setSocketConnections(count) {
  socketConnections.set(count);
}

function setEmbeddingQueueDepth(count) {
  embeddingQueueDepth.set(count);
}

function setChurnHighRiskCount(employerId, count) {
  churnHighRiskCount.set({ employer_id: employerId }, count);
}

function setKnowledgeBaseArticles(category, employerId, count) {
  knowledgeBaseArticles.set({ category, employer_id: employerId }, count);
}

function incrementRAGQueries(queryType, status) {
  ragQueries.inc({ query_type: queryType, status });
}

// Metrics endpoint middleware
function metricsMiddleware(req, res) {
  res.set("Content-Type", register.contentType);
  res.end(register.metrics());
}

module.exports = {
  register,
  metricsMiddleware,
  recordAIPipelineDuration,
  updateAIConfidenceScore,
  incrementTicketsCreated,
  incrementSLABreaches,
  setActiveConversations,
  setSocketConnections,
  setEmbeddingQueueDepth,
  setChurnHighRiskCount,
  setKnowledgeBaseArticles,
  incrementRAGQueries,
};
