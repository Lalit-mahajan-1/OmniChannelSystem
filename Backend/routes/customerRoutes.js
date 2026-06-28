const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByChannel,
  updateCustomer,
  deleteCustomer,
  loginCustomer,
} = require('../controllers/customercontroller');

const { getCustomer360 } = require('../controllers/customer360Controller');
const { authenticate, authorize, authenticateOrService } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateLogin, validateRegistration, validateObjectId } = require('../middleware/validate');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/login', authLimiter, validateLogin, loginCustomer);
router.post('/register', authLimiter, validateRegistration, createCustomer);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('employer'), getAllCustomers);
router.get('/consent-stats', authenticate, authorize('employer'), async (req, res) => {
  try {
    const [dncCount, marketingCount, totalCount] = await Promise.all([
      Customer.countDocuments({ 'consentStatus.dnc': true }),
      Customer.countDocuments({ 'consentStatus.marketing': true }),
      Customer.countDocuments(),
    ]);
    res.json({ success: true, data: { dncCount, marketingCount, totalCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/channel/:channel/:value', authenticate, authorize('employer'), getCustomerByChannel);

// ── Customer 360° — Employer only ─────────────────────────────────────────────
router.get('/:id/360', authenticate, authorize('employer'), validateObjectId(), getCustomer360);

// ── CRUD — Employer only ──────────────────────────────────────────────────────
router.route('/:id')
  .get(authenticateOrService, validateObjectId(), getCustomerById)
  .put(authenticate, validateObjectId(), updateCustomer)
  .delete(authenticate, authorize('employer'), validateObjectId(), deleteCustomer);

// ── Auto-Reply Settings — Employer only ───────────────────────────────────────
router.get('/:id/auto-reply', authenticate, authorize('employer'), validateObjectId(), async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .select('autoReplyEmail autoReplyWhatsapp');

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  res.json({
    autoReplyEmail: customer.autoReplyEmail,
    autoReplyWhatsapp: customer.autoReplyWhatsapp,
  });
});

router.patch('/:id/toggle-email', authenticate, authorize('employer'), validateObjectId(), async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customer.autoReplyEmail = !customer.autoReplyEmail;
  await customer.save();

  res.json({
    success: true,
    autoReplyEmail: customer.autoReplyEmail,
  });
});

router.patch('/:id/toggle-whatsapp', authenticate, authorize('employer'), validateObjectId(), async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customer.autoReplyWhatsapp = !customer.autoReplyWhatsapp;
  await customer.save();

  res.json({
    success: true,
    autoReplyWhatsapp: customer.autoReplyWhatsapp,
  });
});

module.exports = router;