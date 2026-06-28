const express = require("express");
const router = express.Router();
const agentWorkflowController = require("../controllers/agentWorkflowController");
const presenceController = require("../controllers/presenceController");
const { authenticate, authorize } = require("../middleware/auth");

// All agent routes require employer authentication
router.use(authenticate, authorize("employer"));

// Agent Workflow
router.post("/workflow/trigger", agentWorkflowController.triggerWorkflow.bind(agentWorkflowController));
router.post("/workflow/sync", agentWorkflowController.processWorkflowSync.bind(agentWorkflowController));
router.get("/workflow/trace/:conversationId", agentWorkflowController.getWorkflowTrace.bind(agentWorkflowController));

// Agent Presence
router.get("/presence/online", presenceController.getOnlineAgents.bind(presenceController));
router.get("/presence/:agentId", presenceController.getAgentPresence.bind(presenceController));
router.put("/presence", presenceController.updatePresence.bind(presenceController));
router.get("/presence/stats", presenceController.getPresenceStats.bind(presenceController));

module.exports = router;
