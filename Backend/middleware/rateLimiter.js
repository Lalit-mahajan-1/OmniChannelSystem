const rateLimit = require('express-rate-limit');

// ──────────────────────────────────────────────
// Global API limiter — 100 requests per 15 minutes
// ──────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000,
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});

// ──────────────────────────────────────────────
// Auth limiter — Strict: 10 login attempts per 15 minutes
// Prevents brute-force attacks on login endpoints
// ──────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

// ──────────────────────────────────────────────
// Scrape limiter — Very strict: 5 scrape requests per 30 minutes
// Social scraping is resource-intensive (Puppeteer)
// ──────────────────────────────────────────────
const scrapeLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Scraping rate limit exceeded. Please try again after 30 minutes.',
  },
});

// ──────────────────────────────────────────────
// Webhook limiter — High: 500 requests per 15 minutes
// Meta sends bursts of webhook events
// ──────────────────────────────────────────────
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Webhook rate limit exceeded.',
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  scrapeLimiter,
  webhookLimiter,
};
