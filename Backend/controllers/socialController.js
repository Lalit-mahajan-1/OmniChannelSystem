const SocialComplaint = require('../models/SocialComplaint');
const { scrapeTwitter, scrapeReddit } = require('../services/socialScraperService');

/**
 * POST /api/social/scrape
 * Body: { keyword: "HDFC Bank", platforms: ["twitter", "reddit"] }
 * Scrapes and saves to MongoDB
 */
const scrapeAndSave = async (req, res) => {
  try {
    const { keyword, platforms = ['twitter', 'reddit'] } = req.body;

    if (!keyword) {
      return res.status(400).json({ success: false, message: 'keyword is required' });
    }

    console.log(`Scraping "${keyword}" on: ${platforms.join(', ')}`);

    let allResults = [];

    // Run scrapers
    if (platforms.includes('twitter')) {
      const tweets = await scrapeTwitter(keyword);
      allResults = [...allResults, ...tweets];
    }

    if (platforms.includes('reddit')) {
      const posts = await scrapeReddit(keyword);
      allResults = [...allResults, ...posts];
    }

    // Save to MongoDB (skip duplicates)
    let savedCount = 0;
    for (const item of allResults) {
      try {
        await SocialComplaint.create(item);
        savedCount++;
      } catch (err) {
        if (err.code === 11000) continue; // duplicate postId, skip
        console.error('Save error:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Scraped ${allResults.length} posts, saved ${savedCount} new ones`,
      data: allResults,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/social/complaints
 * Query: ?keyword=HDFC&platform=twitter&isComplaint=true
 */
const getComplaints = async (req, res) => {
  try {
    const { keyword, platform, isComplaint, sentiment } = req.query;

    const filter = {};
    if (keyword)     filter.keyword     = new RegExp(keyword, 'i');
    if (platform)    filter.platform    = platform;
    if (isComplaint) filter.isComplaint = isComplaint === 'true';
    if (sentiment)   filter.sentiment   = sentiment;

    const complaints = await SocialComplaint.find(filter)
      .sort({ scrapedAt: -1 })
      .limit(100)
      .select('-__v');

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/social/stats
 * Summary stats for dashboard
 */
const getStats = async (req, res) => {
  try {
    const { keyword } = req.query;
    const filter = keyword ? { keyword: new RegExp(keyword, 'i') } : {};

    const [total, complaints, twitter, reddit, negative] = await Promise.all([
      SocialComplaint.countDocuments(filter),
      SocialComplaint.countDocuments({ ...filter, isComplaint: true }),
      SocialComplaint.countDocuments({ ...filter, platform: 'twitter' }),
      SocialComplaint.countDocuments({ ...filter, platform: 'reddit' }),
      SocialComplaint.countDocuments({ ...filter, sentiment: 'negative' }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, complaints, twitter, reddit, negative },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/social/:id
 */
const deleteComplaint = async (req, res) => {
  try {
    await SocialComplaint.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { scrapeAndSave, getComplaints, getStats, deleteComplaint };