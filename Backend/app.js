const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const employerRoutes = require('./routes/employerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const emailRoutes = require('./routes/emailRoutes');
const socialRoutes = require('./routes/socialRoutes');

const { startGmailPoller } = require('./services/gmailPoller');

const app = express();

// Allow the frontend dev server (and any localhost port) to call the API
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman) or any localhost origin
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/employers', employerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/social', socialRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Omni Channel API running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;