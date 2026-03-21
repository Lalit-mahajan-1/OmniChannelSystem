const Employer = require('../models/Employer');

// POST /api/employers
const createEmployer = async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;

    const existing = await Employer.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const employer = await Employer.create({ name, email, password, company, phone });

    // Don't return password
    employer.password = undefined;

    res.status(201).json({ success: true, data: employer });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/employers
const getAllEmployers = async (req, res) => {
  try {
    const employers = await Employer.find({ isActive: true }).select('-__v');
    res.status(200).json({ success: true, count: employers.length, data: employers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/employers/:id
const getEmployerById = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id).select('-__v');
    if (!employer || !employer.isActive) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }
    res.status(200).json({ success: true, data: employer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/employers/:id
const updateEmployer = async (req, res) => {
  try {
    // Prevent role/email tampering
    const { role, ...updateData } = req.body;

    const employer = await Employer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    res.status(200).json({ success: true, data: employer });
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

// DELETE /api/employers/:id  (soft delete)
const deleteEmployer = async (req, res) => {
  try {
    const employer = await Employer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    res.status(200).json({ success: true, message: 'Employer deactivated successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = {
  createEmployer,
  getAllEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
};