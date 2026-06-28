const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const employerRoutes = require('./routes/employerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const emailRoutes = require('./routes/emailRoutes');
const socialRoutes = require('./routes/socialRoutes');
const ticketIntelligenceRoutes = require('./routes/ticketIntelligenceRoutes');
const taskRoutes = require('./routes/taskRoutes');
const marketingRoutes = require('./routes/marketingRoutes');
const ragRoutes = require('./routes/ragRoutes');
const knowledgeBaseRoutes = require('./routes/knowledgeBaseRoutes');
const slaRoutes = require('./routes/slaRoutes');
const auditRoutes = require('./routes/auditRoutes');
const agentRoutes = require('./routes/agentRoutes');

const { globalLimiter } = require('./middleware/rateLimiter');
const { startGmailPoller } = require('./services/gmailPoller');
const { initializeSocketIO } = require('./socket');
const { metricsMiddleware } = require('./config/prometheus');

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────────

// Helmet — set security-related HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable CSP for API (frontend handles its own)
}));

// CORS — Allow frontend dev server and any localhost origin
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman), localhost, or deployed frontend
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || /\.netlify\.app$/.test(origin) || origin === process.env.FRONTEND_URL) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key', 'X-Employer-Id'],
}));

// Rate limiting — apply globally to all routes
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent abuse
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// NoSQL injection prevention — sanitize user input
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Security] Sanitized ${key} in request from ${req.ip}`);
  },
}));

// HTTP Parameter Pollution protection
app.use(hpp());

// ── Database Connection ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    if (typeof startGmailPoller === 'function') {
      startGmailPoller();
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/employers', employerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/tickets', ticketIntelligenceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agent-analytics', require('./routes/agentAnalyticsRoutes'));
app.use('/api/churn', require('./routes/churnRoutes'));
app.use('/', require('./routes/integratedAgentRoutes'));

// ── Metrics Endpoint (Prometheus) ───────────────────────────────────────────
app.get('/metrics', metricsMiddleware);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Omni Channel API running',
    timestamp: new Date().toISOString(),
    security: {
      helmet: true,
      rateLimiting: true,
      mongoSanitize: true,
      hpp: true,
    },
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle CORS errors
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  // Handle JSON parse errors
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body too large. Maximum 10KB allowed.',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body.',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong',
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Initialize Socket.IO
initializeSocketIO(server);

module.exports = app;