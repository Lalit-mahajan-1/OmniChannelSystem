const Employer = require('../models/Employer');
const jwt = require('jsonwebtoken');

// ──────────────────────────────────────────────
// POST /api/employers — Create employer
// ──────────────────────────────────────────────
const createEmployer = async (req, res) => {
  try {
    const { name, email, password, company, phone, phoneNumberId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const employer = await Employer.create({
      name,
      email,
      password,
      company,
      phone,
      phoneNumberId,
    });

    // toJSON() auto-strips password
    res.status(201).json({ success: true, data: employer });
  } catch (err) {
    // Duplicate key error
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
// GET /api/employers — Get all (with pagination + search)
// ──────────────────────────────────────────────
const getAllEmployers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [employers, total] = await Promise.all([
      Employer.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Employer.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: employers.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: employers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// GET /api/employers/:id — Get single employer
// ──────────────────────────────────────────────
const getEmployerById = async (req, res) => {
  try {
    const employer = await Employer.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    res.status(200).json({ success: true, data: employer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/employers/:id — Update employer
// ──────────────────────────────────────────────
const updateEmployer = async (req, res) => {
  try {
    // Whitelist allowed fields
    const allowedFields = ['name', 'email', 'password', 'company', 'phone', 'phoneNumberId'];
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
      const existing = await Employer.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: req.params.id },
        isActive: true,
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use by another employer',
        });
      }
    }

    // If phoneNumberId is being changed, check for duplicates
    if (updateData.phoneNumberId) {
      const existing = await Employer.findOne({
        phoneNumberId: updateData.phoneNumberId,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'phoneNumberId already in use by another employer',
        });
      }
    }

    // Only update active employers
    const employer = await Employer.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    res.status(200).json({ success: true, data: employer });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already in use`,
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
// DELETE /api/employers/:id — Soft delete
// ──────────────────────────────────────────────
const deleteEmployer = async (req, res) => {
  try {
    const employer = await Employer.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found or already deactivated',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employer deactivated successfully',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ──────────────────────────────────────────────
// POST /api/employers/login — Login employer
// ──────────────────────────────────────────────
const loginEmployer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Re-select password (hidden by default via select:false)
    const employer = await Employer.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!employer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!employer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    const isMatch = await employer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { id: employer._id, role: employer.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      data: employer, // password stripped via toJSON()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createEmployer,
  getAllEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
  loginEmployer,
};