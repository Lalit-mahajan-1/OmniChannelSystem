const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { authenticate, authorize } = require("../middleware/auth");

const AuditLog = require("../models/AuditLog");

// All audit routes require employer authentication
router.use(authenticate, authorize("employer"));

router.get("/logs", async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    const filter = {};
    if (type && type !== "all") filter.actorType = type;
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List audit logs
router.get("/", auditController.listLogs.bind(auditController));

// Get recent actions
router.get("/recent", auditController.getRecentActions.bind(auditController));

// Get action statistics
router.get("/stats/actions", auditController.getActionStats.bind(auditController));

// Get resource statistics
router.get("/stats/resources", auditController.getResourceStats.bind(auditController));

module.exports = router;
