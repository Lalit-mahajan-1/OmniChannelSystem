const mongoose = require('mongoose');
const SocialComplaint = require('../models/SocialComplaint');
const Employer = require('../models/Employer');
const Customer = require('../models/Customer');
const { scrapeByPlatform } = require('../services/socialScraperService');

const ALLOWED_PLATFORMS = ['twitter', 'reddit', 'youtube'];
const ALLOWED_STATUSES = ['new', 'pending', 'assigned', 'in_progress', 'resolved', 'closed'];
const ALLOWED_SENTIMENTS = ['positive', 'negative', 'neutral'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'critical'];

// POST /api/social/scrape
const scrapeAndSave = async (req, res) => {
  try {
    const {
      keyword,
      keywords = [],
      platforms = ['twitter', 'reddit', 'youtube'],
      complaintsOnly = false,
    } = req.body;

    const keywordList = keyword ? [keyword, ...keywords] : keywords;
    const uniqueKeywords = [...new Set(keywordList.map((k) => String(k).trim()).filter(Boolean))];
    const validPlatforms = platforms.filter((p) => ALLOWED_PLATFORMS.includes(p));

    if (!uniqueKeywords.length) {
      return res.status(400).json({ success: false, message: 'At least one keyword is required' });
    }

    if (!validPlatforms.length) {
      return res.status(400).json({ success: false, message: `Platforms must be one of: ${ALLOWED_PLATFORMS.join(', ')}` });
    }

    let allResults = [];

    for (const currentKeyword of uniqueKeywords) {
      for (const platform of validPlatforms) {
        const results = await scrapeByPlatform(platform, currentKeyword);
        allResults.push(...results);
      }
    }

    if (complaintsOnly) {
      allResults = allResults.filter((item) => item.isComplaint);
    }

    let savedCount = 0;
    let duplicateCount = 0;

    for (const item of allResults) {
      try {
        await SocialComplaint.create(item);
        savedCount++;
      } catch (err) {
        if (err.code === 11000) {
          duplicateCount++;
          continue;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Scraping completed',
      meta: {
        totalFetched: allResults.length,
        savedCount,
        duplicateCount,
      },
      data: allResults,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/social/complaints
const getComplaints = async (req, res) => {
  try {
    const {
      keyword,
      platform,
      isComplaint,
      sentiment,
      complaintStatus,
      priority,
      assignedTo,
      customerId,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { isArchived: false };

    if (keyword) filter.keyword = new RegExp(keyword, 'i');
    if (platform && ALLOWED_PLATFORMS.includes(platform)) filter.platform = platform;
    if (isComplaint !== undefined) filter.isComplaint = isComplaint === 'true';
    if (sentiment && ALLOWED_SENTIMENTS.includes(sentiment)) filter.sentiment = sentiment;
    if (complaintStatus && ALLOWED_STATUSES.includes(complaintStatus)) filter.complaintStatus = complaintStatus;
    if (priority && ALLOWED_PRIORITIES.includes(priority)) filter.priority = priority;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) filter.assignedTo = assignedTo;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;

    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { keyword: { $regex: search, $options: 'i' } },
      ];
    }

    const [complaints, total] = await Promise.all([
      SocialComplaint.find(filter)
        .populate('assignedTo', 'name email company')
        .populate('resolvedBy', 'name email company')
        .populate('customerId', 'name email phone')
        .sort({ scrapedAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select('-__v'),
      SocialComplaint.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      data: complaints,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/social/complaints/:id
const getComplaintById = async (req, res) => {
  try {
    const complaint = await SocialComplaint.findOne({
      _id: req.params.id,
      isArchived: false,
    })
      .populate('assignedTo', 'name email company')
      .populate('resolvedBy', 'name email company')
      .populate('customerId', 'name email phone');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.status(200).json({ success: true, data: complaint });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/social/complaints/:id/assign
const assignComplaint = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ success: false, message: 'Valid assignedTo employer ID is required' });
    }

    const employer = await Employer.findOne({ _id: assignedTo, isActive: true });
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const complaint = await SocialComplaint.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      {
        assignedTo,
        assignedAt: new Date(),
        complaintStatus: 'assigned',
      },
      { new: true }
    ).populate('assignedTo', 'name email company');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint assigned successfully',
      data: complaint,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/social/complaints/:id/status
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintStatus } = req.body;

    if (!ALLOWED_STATUSES.includes(complaintStatus)) {
      return res.status(400).json({
        success: false,
        message: `complaintStatus must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const updateData = { complaintStatus };

    if (complaintStatus === 'resolved' || complaintStatus === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const complaint = await SocialComplaint.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      updateData,
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
      data: complaint,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/social/complaints/:id/resolve
const resolveComplaint = async (req, res) => {
  try {
    const { resolvedBy, resolutionNote } = req.body;

    if (!resolvedBy || !mongoose.Types.ObjectId.isValid(resolvedBy)) {
      return res.status(400).json({ success: false, message: 'Valid resolvedBy employer ID is required' });
    }

    const employer = await Employer.findOne({ _id: resolvedBy, isActive: true });
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const complaint = await SocialComplaint.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      {
        complaintStatus: 'resolved',
        resolvedBy,
        resolvedAt: new Date(),
        resolutionNote: resolutionNote?.trim() || '',
      },
      { new: true }
    )
      .populate('assignedTo', 'name email company')
      .populate('resolvedBy', 'name email company');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint resolved successfully',
      data: complaint,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/social/complaints/:id/link-customer
const linkCustomerToComplaint = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: 'Valid customerId is required' });
    }

    const customer = await Customer.findOne({ _id: customerId, isActive: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const complaint = await SocialComplaint.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      { customerId },
      { new: true }
    ).populate('customerId', 'name email phone');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer linked successfully',
      data: complaint,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/social/complaints/:id/note
const addInternalNote = async (req, res) => {
  try {
    const { note, addedBy } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note is required' });
    }

    let employer = null;
    if (addedBy) {
      if (!mongoose.Types.ObjectId.isValid(addedBy)) {
        return res.status(400).json({ success: false, message: 'Invalid addedBy employer ID' });
      }

      employer = await Employer.findOne({ _id: addedBy, isActive: true });
      if (!employer) {
        return res.status(404).json({ success: false, message: 'Employer not found' });
      }
    }

    const complaint = await SocialComplaint.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      {
        $push: {
          internalNotes: {
            note: note.trim(),
            addedBy: employer?._id || null,
            addedAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('internalNotes.addedBy', 'name email company');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Internal note added successfully',
      data: complaint,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/social/stats
const getStats = async (req, res) => {
  try {
    const { keyword } = req.query;
    const filter = { isArchived: false };

    if (keyword) {
      filter.keyword = new RegExp(keyword, 'i');
    }

    const [
      total,
      complaints,
      unassigned,
      newCount,
      pending,
      assigned,
      inProgress,
      resolved,
      closed,
      twitter,
      reddit,
      youtube,
      negative,
      positive,
      neutral,
    ] = await Promise.all([
      SocialComplaint.countDocuments(filter),
      SocialComplaint.countDocuments({ ...filter, isComplaint: true }),
      SocialComplaint.countDocuments({ ...filter, assignedTo: null }),
      SocialComplaint.countDocuments({ ...filter, complaintStatus: 'new' }),
      SocialComplaint.countDocuments({ ...filter, complaintStatus: 'pending' }),
      SocialComplaint.countDocuments({ ...filter, complaintStatus: 'assigned' }),
      SocialComplaint.countDocuments({ ...filter, complaintStatus: 'in_progress' }),
      SocialComplaint.countDocuments({ ...filter, complaintStatus: 'resolved' }),
      SocialComplaint.countDocuments({ ...filter, complaintStatus: 'closed' }),
      SocialComplaint.countDocuments({ ...filter, platform: 'twitter' }),
      SocialComplaint.countDocuments({ ...filter, platform: 'reddit' }),
      SocialComplaint.countDocuments({ ...filter, platform: 'youtube' }),
      SocialComplaint.countDocuments({ ...filter, sentiment: 'negative' }),
      SocialComplaint.countDocuments({ ...filter, sentiment: 'positive' }),
      SocialComplaint.countDocuments({ ...filter, sentiment: 'neutral' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        complaints,
        unassigned,
        status: {
          new: newCount,
          pending,
          assigned,
          in_progress: inProgress,
          resolved,
          closed,
        },
        platform: {
          twitter,
          reddit,
          youtube,
        },
        sentiment: {
          negative,
          positive,
          neutral,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/social/stats/agents
const getAgentStats = async (req, res) => {
  try {
    const stats = await SocialComplaint.aggregate([
      { $match: { isArchived: false, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$complaintStatus', 'resolved'] }, 1, 0] }
          },
          pendingCount: {
            $sum: {
              $cond: [
                { $in: ['$complaintStatus', ['pending', 'assigned', 'in_progress']] },
                1,
                0
              ]
            }
          },
        },
      },
      {
        $lookup: {
          from: 'employers',
          localField: '_id',
          foreignField: '_id',
          as: 'agent',
        },
      },
      { $unwind: '$agent' },
      {
        $project: {
          _id: 0,
          employerId: '$agent._id',
          name: '$agent.name',
          email: '$agent.email',
          company: '$agent.company',
          totalAssigned: 1,
          resolvedCount: 1,
          pendingCount: 1,
        },
      },
      { $sort: { totalAssigned: -1 } },
    ]);

    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/social/complaints/:id
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await SocialComplaint.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      { isArchived: true },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found or already archived' });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint archived successfully',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  scrapeAndSave,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  resolveComplaint,
  linkCustomerToComplaint,
  addInternalNote,
  getStats,
  getAgentStats,
  deleteComplaint,
};