const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const ContentApproval = require('../models/ContentApproval');

const createCampaign = async (req, res) => {
  try {
    const { name, type, content, targetSegment } = req.body;
    const newCampaign = await Campaign.create({
      name, type, content, targetSegment, status: 'Draft'
    });
    res.status(201).json(newCampaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const requestApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndUpdate(id, { status: 'Pending Approval' }, { new: true });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const channelMap = { WhatsApp: 'whatsapp', Email: 'email', SMS: 'sms' };

    await ContentApproval.create({
      relatedType: 'Campaign',
      relatedId: id,
      name: campaign.name,
      channel: channelMap[campaign.type] || 'email',
      submittedBy: req.user?.name || 'Unknown',
      risk: 'low',
      status: 'Pending',
    });

    res.status(200).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, content, targetSegment, scheduledAt } = req.body;
    const update = {};
    if (name) update.name = name;
    if (type) update.type = type;
    if (content) update.content = content;
    if (targetSegment) update.targetSegment = targetSegment;
    if (scheduledAt !== undefined) update.scheduledAt = scheduledAt || null;

    const campaign = await Campaign.findByIdAndUpdate(id, update, { new: true });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getApprovals = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const approvals = await ContentApproval.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: approvals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getApprovalStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      ContentApproval.countDocuments({ status: "Pending" }),
      ContentApproval.countDocuments({ status: "Approved" }),
      ContentApproval.countDocuments({ status: "Rejected" }),
      ContentApproval.countDocuments(),
    ]);
    res.json({ success: true, data: { pending, approved, rejected, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateApproval = async (req, res) => {
  try {
    const { status, comments } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Approved or Rejected" });
    }
    const approval = await ContentApproval.findByIdAndUpdate(
      req.params.id,
      { status, comments: comments || "" },
      { new: true }
    );
    if (!approval) return res.status(404).json({ success: false, message: "Approval not found" });

    if (approval.relatedType === 'Campaign' && approval.relatedId) {
      const campaignStatus = status === 'Approved' ? 'Approved' : 'Rejected';
      await Campaign.findByIdAndUpdate(approval.relatedId, { status: campaignStatus });
    }

    res.json({ success: true, data: approval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  updateCampaign,
  requestApproval,
  getApprovals,
  getApprovalStats,
  updateApproval,
};
