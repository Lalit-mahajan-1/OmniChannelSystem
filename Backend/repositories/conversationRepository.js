const Conversation = require("../models/Conversation");

class ConversationRepository {
  async create(data) {
    return await Conversation.create(data);
  }

  async findById(id) {
    return await Conversation.findById(id).populate("customerId").populate("employerId").populate("assignedAgent");
  }

  async findByConversationId(conversationId) {
    return await Conversation.findOne({ conversationId }).populate("customerId").populate("employerId").populate("assignedAgent");
  }

  async findByCustomerId(customerId, options = {}) {
    const { limit = 20, skip = 0, status } = options;
    const query = { customerId };
    if (status) query.status = status;
    
    return await Conversation.find(query)
      .populate("assignedAgent")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findByEmployerId(employerId, options = {}) {
    const { limit = 20, skip = 0, status, channel } = options;
    const query = { employerId };
    if (status) query.status = status;
    if (channel) query.channel = channel;
    
    return await Conversation.find(query)
      .populate("customerId", "name email")
      .populate("assignedAgent", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async update(conversationId, data) {
    return await Conversation.findOneAndUpdate({ conversationId }, data, { new: true });
  }

  async updateById(id, data) {
    return await Conversation.findByIdAndUpdate(id, data, { new: true });
  }

  async addMessage(conversationId, messageData) {
    return await Conversation.findOneAndUpdate(
      { conversationId },
      { $push: { messages: messageData } },
      { new: true }
    );
  }

  async updateStatus(conversationId, status) {
    const updateData = { status };
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }
    return await Conversation.findOneAndUpdate({ conversationId }, updateData, { new: true });
  }

  async assignAgent(conversationId, agentId) {
    return await Conversation.findOneAndUpdate(
      { conversationId },
      { assignedAgent: agentId },
      { new: true }
    );
  }

  async delete(conversationId) {
    return await Conversation.findOneAndDelete({ conversationId });
  }

  async countByEmployer(employerId, filters = {}) {
    return await Conversation.countDocuments({ employerId, ...filters });
  }

  async getOpenConversationsByAgent(agentId) {
    return await Conversation.find({ assignedAgent: agentId, status: "open" })
      .populate("customerId", "name email")
      .sort({ updatedAt: -1 });
  }
}

module.exports = new ConversationRepository();
