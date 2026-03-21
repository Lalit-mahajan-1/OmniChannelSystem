const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

// ──────────────────────────────────────────────
// POST /api/customers — Create customer
// ──────────────────────────────────────────────
const createCustomer = async (req, res) => {
  try {
    const { name, email, password, phone, dob, language, timezone, channel_ids } = req.body;

    // Check required fields early (Mongoose will also catch, but clearer error)
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Atomic duplicate check using the unique index (no race condition)
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

    // toJSON() auto-strips password now
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    // Duplicate key error (email already exists)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already registered`,
      });
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// GET /api/customers — Get all (with pagination + search)
// ──────────────────────────────────────────────
const getAllCustomers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    // Build filter
    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Customer.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: customers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// GET /api/customers/:id — Get single customer
// ──────────────────────────────────────────────
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// GET /api/customers/channel/:channel/:value — Omni-channel resolve
// ──────────────────────────────────────────────
const getCustomerByChannel = async (req, res) => {
  try {
    const { channel, value } = req.params;
    const allowed = ['whatsapp', 'chat_uid', 'social_id', 'phone', 'email'];

    if (!allowed.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: `Channel must be one of: ${allowed.join(', ')}`,
      });
    }

    if (!value || !value.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Channel value cannot be empty',
      });
    }

    // phone and email are top-level; channel_ids are nested
    const queryKey = ['phone', 'email'].includes(channel) ? channel : `channel_ids.${channel}`;

    const query = { [queryKey]: value.trim(), isActive: true };

    // Case-insensitive for email
    if (channel === 'email') {
      query[queryKey] = value.trim().toLowerCase();
    }

    const customer = await Customer.findOne(query);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found on this channel',
      });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/customers/:id — Update customer
// ──────────────────────────────────────────────
const updateCustomer = async (req, res) => {
  try {
    // Whitelist allowed fields — block role, isActive, _id manipulation
    const allowedFields = ['name', 'email', 'password', 'phone', 'dob', 'language', 'timezone', 'channel_ids'];
    const updateData = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    // If email is being changed, check for duplicates
    if (updateData.email) {
      const existing = await Customer.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: req.params.id },
        isActive: true,
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use by another customer',
        });
      }
    }

    // Only update active customers
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate value conflict',
      });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// DELETE /api/customers/:id — Soft delete
// ──────────────────────────────────────────────
const deleteCustomer = async (req, res) => {
  try {
    // Only deactivate currently active customers
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or already deactivated',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// POST /api/customers/login — Login customer
// ──────────────────────────────────────────────
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!customer.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: customer._id, role: customer.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({ success: true, token, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByChannel,
  updateCustomer,
  deleteCustomer,
  loginCustomer,
};