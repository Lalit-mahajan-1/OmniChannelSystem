const slaRepository = require("../repositories/slaRepository");
const auditLogRepository = require("../repositories/auditLogRepository");

class SLAController {
  /**
   * List SLA policies
   */
  async listPolicies(req, res) {
    try {
      const employerId = req.employer._id;
      const policies = await slaRepository.findPoliciesByEmployer(employerId.toString());

      res.json(policies);
    } catch (error) {
      console.error("List SLA policies error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get single policy
   */
  async getPolicy(req, res) {
    try {
      const { id } = req.params;
      const policy = await slaRepository.findPolicyById(id);

      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }

      // Verify employer owns the policy
      if (policy.employerId.toString() !== req.employer._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(policy);
    } catch (error) {
      console.error("Get SLA policy error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create SLA policy
   */
  async createPolicy(req, res) {
    try {
      const data = {
        ...req.body,
        employerId: req.employer._id,
      };

      const policy = await slaRepository.createPolicy(data);

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "sla_policy.created",
        resource: "sla_policy",
        resourceId: policy._id.toString(),
        employerId: req.employer._id,
        newState: policy,
      });

      res.status(201).json(policy);
    } catch (error) {
      console.error("Create SLA policy error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update SLA policy
   */
  async updatePolicy(req, res) {
    try {
      const { id } = req.params;
      const policy = await slaRepository.findPolicyById(id);

      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }

      // Verify employer owns the policy
      if (policy.employerId.toString() !== req.employer._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      const previousState = policy.toObject();
      const updatedPolicy = await slaRepository.updatePolicy(id, req.body);

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "sla_policy.updated",
        resource: "sla_policy",
        resourceId: id,
        employerId: req.employer._id,
        previousState,
        newState: updatedPolicy,
      });

      res.json(updatedPolicy);
    } catch (error) {
      console.error("Update SLA policy error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete SLA policy
   */
  async deletePolicy(req, res) {
    try {
      const { id } = req.params;
      const policy = await slaRepository.findPolicyById(id);

      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }

      // Verify employer owns the policy
      if (policy.employerId.toString() !== req.employer._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      await slaRepository.softDeletePolicy(id);

      // Log action
      await auditLogRepository.create({
        actorId: req.employer._id,
        actorType: "employer",
        actorEmail: req.employer.email,
        action: "sla_policy.deleted",
        resource: "sla_policy",
        resourceId: id,
        employerId: req.employer._id,
        previousState: policy,
      });

      res.json({ success: true, message: "Policy deleted successfully" });
    } catch (error) {
      console.error("Delete SLA policy error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * List SLA breaches
   */
  async listBreaches(req, res) {
    try {
      const { page = 1, limit = 50, severity, startDate, endDate } = req.query;
      const employerId = req.employer._id;

      const breaches = await slaRepository.findBreachesByEmployer(employerId.toString(), {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        severity,
        startDate,
        endDate,
      });

      const total = await slaRepository.countBreachesByEmployer(employerId.toString(), { severity });

      res.json({
        breaches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("List SLA breaches error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get breach statistics
   */
  async getBreachStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const employerId = req.employer._id;

      const stats = await slaRepository.getBreachStats(employerId.toString(), startDate, endDate);

      res.json(stats);
    } catch (error) {
      console.error("Get breach stats error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark breach as notified
   */
  async markBreachNotified(req, res) {
    try {
      const { id } = req.params;
      const breach = await slaRepository.findBreachById(id);

      if (!breach) {
        return res.status(404).json({ error: "Breach not found" });
      }

      // Verify employer owns the breach
      if (breach.employerId.toString() !== req.employer._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      await slaRepository.markBreachNotified(id);

      res.json({ success: true, message: "Breach marked as notified" });
    } catch (error) {
      console.error("Mark breach notified error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SLAController();
