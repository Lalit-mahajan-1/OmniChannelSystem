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

// ---------------- PUBLIC ----------------
router.post('/login', loginCustomer);

// ---------------- CRUD ----------------
router.route('/')
  .post(createCustomer)
  .get(getAllCustomers);

router.get('/channel/:channel/:value', getCustomerByChannel);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

// ---------------- AUTO REPLY ----------------

// GET status
router.get('/:id/auto-reply', async (req, res) => {
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

// Toggle Email
router.patch('/:id/toggle-email', async (req, res) => {
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

// Toggle WhatsApp
router.patch('/:id/toggle-whatsapp', async (req, res) => {
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