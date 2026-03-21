const Customer = require('../models/Customer');

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { name, email, password, phone, dob, language, timezone, channel_ids } = req.body;

    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const customer = await Customer.create({
      name,
      email,
      password,
      phone,
      dob,
      language,
      timezone,
      channel_ids,
    });

    customer.password = undefined;

    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true }).select('-__v');
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-__v');
    if (!customer || !customer.isActive) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/customers/channel/:channel/:value
// Resolve a customer by any channel identifier (the key omni-channel feature)
const getCustomerByChannel = async (req, res) => {
  try {
    const { channel, value } = req.params;
    const allowed = ['whatsapp', 'chat_uid', 'social_id', 'phone', 'email'];

    if (!allowed.includes(channel)) {
      return res.status(400).json({ success: false, message: `Channel must be one of: ${allowed.join(', ')}` });
    }

    // phone and email are top-level fields; channel_ids are nested
    const query = ['phone', 'email'].includes(channel)
      ? { [channel]: value, isActive: true }
      : { [`channel_ids.${channel}`]: value, isActive: true };

    const customer = await Customer.findOne(query).select('-__v');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found on this channel' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { role, ...updateData } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DELETE /api/customers/:id  (soft delete)
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, message: 'Customer deactivated successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByChannel,
  updateCustomer,
  deleteCustomer,
};