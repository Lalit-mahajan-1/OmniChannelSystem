const KnowledgeBase = require("../models/KnowledgeBase");

class KnowledgeBaseRepository {
  async create(data) {
    return await KnowledgeBase.create(data);
  }

  async findById(id) {
    return await KnowledgeBase.findById(id).populate("createdBy", "name email").populate("lastUpdatedBy", "name email");
  }

  async findByEmployerId(employerId, options = {}) {
    const { limit = 20, skip = 0, category, isActive = true } = options;
    const query = { employerId, isActive };
    if (category) query.category = category;
    
    return await KnowledgeBase.find(query)
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async update(id, data) {
    return await KnowledgeBase.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await KnowledgeBase.findByIdAndDelete(id);
  }

  async softDelete(id) {
    return await KnowledgeBase.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async search(query, employerId) {
    return await KnowledgeBase.find({
      employerId,
      isActive: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ],
    }).populate("createdBy", "name email");
  }

  async getByCategory(category, employerId) {
    return await KnowledgeBase.find({ employerId, category, isActive: true })
      .populate("createdBy", "name email")
      .sort({ viewCount: -1 });
  }

  async incrementViewCount(id) {
    return await KnowledgeBase.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true });
  }

  async incrementHelpfulVotes(id) {
    return await KnowledgeBase.findByIdAndUpdate(id, { $inc: { helpfulVotes: 1 } }, { new: true });
  }

  async countByEmployer(employerId) {
    return await KnowledgeBase.countDocuments({ employerId, isActive: true });
  }

  async countByCategory(employerId) {
    return await KnowledgeBase.aggregate([
      { $match: { employerId, isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }
}

module.exports = new KnowledgeBaseRepository();
