const ChurnPrediction = require("../models/ChurnPrediction");
const Customer = require("../models/Customer");
const Conversation = require("../models/Conversation");

class ChurnService {
  /**
   * Predict churn risk for a customer
   */
  async predictChurn(customerId, employerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Calculate features
      const features = await this.calculateFeatures(customerId, employerId);

      // Call ML service for prediction
      const prediction = await this.callMLService(features, customerId, employerId);

      // Save prediction to database
      const churnPrediction = await ChurnPrediction.create({
        customerId,
        employerId,
        churnProbability: prediction.probability,
        riskLevel: this.getRiskLevel(prediction.probability),
        features,
        recommendations: prediction.recommendations || [],
        modelVersion: prediction.modelVersion || "1.0.0",
      });

      return churnPrediction;
    } catch (error) {
      console.error("Predict churn error:", error);
      throw error;
    }
  }

  /**
   * Calculate churn features
   */
  async calculateFeatures(customerId, employerId) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get recent conversations
    const conversations = await Conversation.find({
      customerId,
      employerId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate sentiment scores
    let totalSentiment = 0;
    let negativeCount = 0;
    conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        if (msg.metadata?.sentimentScore) {
          totalSentiment += msg.metadata.sentimentScore;
          if (msg.metadata.sentiment === "negative") {
            negativeCount++;
          }
        }
      });
    });

    const avgSentimentScore = conversations.length > 0 ? totalSentiment / conversations.length : 0;
    const negativeInteractionRatio = conversations.length > 0 ? negativeCount / conversations.length : 0;

    // Get customer data
    const customer = await Customer.findById(customerId);

    return {
      avgSentimentScore,
      ticketVolume30d: conversations.length,
      ticketVolumeTrend: 0, // TODO: Calculate trend
      escalationCount: conversations.filter((c) => c.tags?.includes("escalated")).length,
      avgResponseDelayHours: 0, // TODO: Calculate from timestamps
      unresolvedTicketCount: conversations.filter((c) => c.status === "open").length,
      negativeInteractionRatio,
      daysSinceLastPositive: 0, // TODO: Calculate from last positive sentiment
      healthScore: customer?.healthScore || 100,
      channelDiversity: 1, // TODO: Count unique channels
    };
  }

  /**
   * Call ML service for prediction
   */
  async callMLService(features, customerId, employerId) {
    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

      const response = await fetch(`${mlServiceUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          features,
          customerId,
          employerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`ML service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("ML service call error:", error);
      // Fallback to rule-based prediction
      return this.ruleBasedPrediction(features);
    }
  }

  /**
   * Rule-based prediction fallback
   */
  ruleBasedPrediction(features) {
    let probability = 0.1; // Base risk

    // Adjust based on features
    if (features.avgSentimentScore < -0.3) probability += 0.3;
    if (features.ticketVolume30d > 10) probability += 0.2;
    if (features.escalationCount > 2) probability += 0.2;
    if (features.unresolvedTicketCount > 3) probability += 0.15;
    if (features.healthScore < 50) probability += 0.15;
    if (features.negativeInteractionRatio > 0.5) probability += 0.2;

    probability = Math.min(probability, 1.0);

    const recommendations = [];
    if (probability > 0.7) {
      recommendations.push("Immediate outreach recommended");
      recommendations.push("Consider offering discount");
    } else if (probability > 0.4) {
      recommendations.push("Schedule follow-up call");
      recommendations.push("Review recent interactions");
    }

    return {
      probability,
      recommendations,
      modelVersion: "rule-based-1.0",
    };
  }

  /**
   * Get risk level from probability
   */
  getRiskLevel(probability) {
    if (probability >= 0.8) return "critical";
    if (probability >= 0.6) return "high";
    if (probability >= 0.4) return "medium";
    return "low";
  }

  /**
   * Get churn predictions for employer
   */
  async getPredictions(employerId, options = {}) {
    const { riskLevel, limit = 50 } = options;
    const query = { employerId };
    if (riskLevel) query.riskLevel = riskLevel;

    const predictions = await ChurnPrediction.find(query)
      .populate("customerId", "name email")
      .sort({ predictedAt: -1 })
      .limit(limit);

    return predictions;
  }

  /**
   * Get churn statistics
   */
  async getChurnStats(employerId) {
    const stats = await ChurnPrediction.aggregate([
      { $match: { employerId } },
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 },
          avgProbability: { $avg: "$churnProbability" },
        },
      },
    ]);

    const total = await ChurnPrediction.countDocuments({ employerId });

    return {
      total,
      byRiskLevel: stats,
    };
  }

  /**
   * Mark action taken on churn prediction
   */
  async markActionTaken(predictionId, action, actionTakenBy) {
    try {
      const prediction = await ChurnPrediction.findByIdAndUpdate(
        predictionId,
        {
          actionTaken: action,
          actionTakenAt: new Date(),
          actionTakenBy,
        },
        { new: true }
      );

      return prediction;
    } catch (error) {
      console.error("Mark action taken error:", error);
      throw error;
    }
  }
}

module.exports = new ChurnService();
