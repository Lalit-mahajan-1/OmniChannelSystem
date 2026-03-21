const express = require('express');
const mongoose = require('mongoose');
const Email = require('../models/Email');
const Employer = require('../models/Employer');
const { sendReply } = require('../services/gmailService');

const router = express.Router();

// GET /api/emails
router.get('/', async (req, res) => {
  try {
    const {
      employerId,
      assignedTo,
      customerId,
      status,
      direction,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { isArchived: false };

    if (employerId && mongoose.Types.ObjectId.isValid(employerId)) filter.employerId = employerId;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) filter.assignedTo = assignedTo;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;
    if (status) filter.status = status;
    if (direction) filter.direction = direction;

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { fromEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const [emails, total] = await Promise.all([
      Email.find(filter)
        .sort({ emailDate: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('customerId', 'name email phone')
        .populate('employerId', 'name email company')
        .populate('assignedTo', 'name email company')
        .select('-__v'),
      Email.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: emails.length,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      data: emails,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/emails/:id
router.get('/:id', async (req, res) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, isArchived: false })
      .populate('customerId', 'name email phone')
      .populate('employerId', 'name email company')
      .populate('assignedTo', 'name email company')
      .populate('notes.addedBy', 'name email company');

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    res.status(200).json({ success: true, data: email });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid email ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/emails/thread/:threadId
router.get('/thread/:threadId', async (req, res) => {
  try {
    const emails = await Email.find({
      threadId: req.params.threadId,
      isArchived: false,
    })
      .sort({ emailDate: 1 })
      .populate('customerId', 'name email phone')
      .populate('assignedTo', 'name email company')
      .select('-__v');

    res.status(200).json({ success: true, count: emails.length, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/emails/customer/:customerId
router.get('/customer/:customerId', async (req, res) => {
  try {
    const emails = await Email.find({
      customerId: req.params.customerId,
      isArchived: false,
    })
      .sort({ emailDate: -1 })
      .select('-__v');

    res.status(200).json({ success: true, count: emails.length, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/emails/:id/assign
router.patch('/:id/assign', async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ success: false, message: 'Valid assignedTo employer ID is required' });
    }

    const employer = await Employer.findOne({ _id: assignedTo, isActive: true });
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      { assignedTo, status: 'assigned' },
      { new: true }
    ).populate('assignedTo', 'name email company');

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Email assigned successfully',
      data: email,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid email ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/emails/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const allowed = ['received', 'pending', 'assigned', 'replied', 'resolved', 'closed'];
    const { status } = req.body;

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      { status },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Email status updated successfully',
      data: email,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid email ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/emails/:id/note
router.patch('/:id/note', async (req, res) => {
  try {
    const { note, addedBy } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note is required' });
    }

    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      {
        $push: {
          notes: {
            note: note.trim(),
            addedBy: addedBy || null,
            addedAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('notes.addedBy', 'name email company');

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: email,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid email ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/emails/:id/reply
router.post('/:id/reply', async (req, res) => {
  try {
    const { body, sentBy } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Reply body is required' });
    }

    const email = await Email.findOne({ _id: req.params.id, isArchived: false });
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const gmailResponse = await sendReply(
      email.fromEmail,
      email.subject || 'Support Reply',
      body.trim(),
      email.threadId
    );

    const outbound = await Email.create({
      employerId: email.employerId,
      customerId: email.customerId,
      assignedTo: sentBy || email.assignedTo || null,
      gmailId: gmailResponse.id,
      threadId: email.threadId,
      from: process.env.GMAIL_ADDRESS,
      fromEmail: process.env.GMAIL_ADDRESS,
      to: email.fromEmail,
      subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || 'Support Reply'}`,
      rawBody: body.trim(),
      body: body.trim(),
      direction: 'outbound',
      status: 'replied',
      emailDate: new Date(),
    });

    await Email.findByIdAndUpdate(email._id, { status: 'replied' });

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: outbound,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
});

// DELETE /api/emails/:id
router.delete('/:id', async (req, res) => {
  try {
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      { isArchived: true },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found or already archived' });
    }

    res.status(200).json({
      success: true,
      message: 'Email archived successfully',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid email ID' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;