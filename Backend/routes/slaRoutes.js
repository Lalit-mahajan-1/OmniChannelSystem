const express = require("express");
const router = express.Router();
const slaController = require("../controllers/slaController");
const { authenticate, authorize } = require("../middleware/auth");

// All SLA routes require employer authentication
router.use(authenticate, authorize("employer"));

// SLA Policies
router.get("/policies", slaController.listPolicies.bind(slaController));
router.post("/policies", slaController.createPolicy.bind(slaController));
router.get("/policies/:id", slaController.getPolicy.bind(slaController));
router.put("/policies/:id", slaController.updatePolicy.bind(slaController));
router.delete("/policies/:id", slaController.deletePolicy.bind(slaController));

// SLA Breaches
router.get("/breaches", slaController.listBreaches.bind(slaController));
router.get("/breaches/stats", slaController.getBreachStats.bind(slaController));
router.post("/breaches/:id/notify", slaController.markBreachNotified.bind(slaController));

module.exports = router;
