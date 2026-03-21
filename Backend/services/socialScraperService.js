const puppeteer = require('puppeteer');

// Keywords that indicate a complaint
const COMPLAINT_KEYWORDS = [
  'complaint', 'issue', 'problem', 'fraud', 'scam', 'worst',
  'terrible', 'horrible', 'pathetic', 'useless', 'cheated',
  'not working', 'failed', 'error', 'blocked', 'stolen',
  'disgusting', 'ridiculous', 'unacceptable', 'disappointed',
  'refund', 'not received', 'pending', 'stuck', 'lost money'
];

const isComplaint = (text) => {
  const lower = text.toLowerCase();
  return COMPLAINT_KEYWORDS.some((kw) => lower.includes(kw));
};

const getSentiment = (text) => {
  const lower = text.toLowerCase();
  const negWords = ['bad', 'worst', 'terrible', 'fraud', 'scam', 'horrible',
                    'useless', 'pathetic', 'disgusting', 'cheated', 'failed'];
  const posWords = ['good', 'great', 'excellent', 'amazing', 'love',
                    'best', 'happy', 'satisfied', 'helpful', 'resolved'];

  const negCount = negWords.filter((w) => lower.includes(w)).length;
  const posCount = posWords.filter((w) => lower.includes(w)).length;

  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
};

/**
 * Scrape Twitter/X for mentions of a keyword
 * Uses nitter.net (public Twitter mirror — no login needed)
 */
const scrapeTwitter = async (keyword) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    );

    // Nitter is a public Twitter frontend — no API key needed
    const searchUrl = `https://nitter.privacydev.net/search?q=${encodeURIComponent(keyword)}&f=tweets`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const tweets = await page.evaluate(() => {
      const items = document.querySelectorAll('.timeline-item');
      const data = [];

      items.forEach((item) => {
        const contentEl = item.querySelector('.tweet-content');
        const authorEl  = item.querySelector('.username');
        const linkEl    = item.querySelector('.tweet-link');
        const dateEl    = item.querySelector('.tweet-date a');

        if (!contentEl) return;

        data.push({
          content:  contentEl.innerText?.trim() || '',
          author:   authorEl?.innerText?.trim() || 'unknown',
          postUrl:  linkEl ? `https://twitter.com${linkEl.getAttribute('href')}` : '',
          postId:   linkEl?.getAttribute('href')?.split('/').pop() || Date.now().toString(),
          date:     dateEl?.getAttribute('title') || new Date().toISOString(),
        });
      });

      return data;
    });

    tweets.forEach((t) => {
      results.push({
        platform:    'twitter',
        keyword,
        postId:      `tw_${t.postId}`,
        author:      t.author,
        content:     t.content,
        postUrl:     t.postUrl,
        sentiment:   getSentiment(t.content),
        isComplaint: isComplaint(t.content),
      });
    });

    console.log(`Twitter: scraped ${results.length} tweets for "${keyword}"`);
  } catch (err) {
    console.error('Twitter scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return results;
};

/**
 * Scrape Reddit for posts mentioning a keyword
 * Uses old.reddit.com — no login needed
 */
const scrapeReddit = async (keyword) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    );

    // Use old Reddit search — clean HTML, easy to scrape
    const searchUrl = `https://old.reddit.com/search/?q=${encodeURIComponent(keyword)}&sort=new`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const posts = await page.evaluate(() => {
      const items = document.querySelectorAll('.search-result-link');
      const data  = [];

      items.forEach((item) => {
        const titleEl  = item.querySelector('a.search-title');
        const authorEl = item.closest('.search-result')?.querySelector('.author');
        const timeEl   = item.closest('.search-result')?.querySelector('time');
        const linkEl   = titleEl;

        if (!titleEl) return;

        data.push({
          content:  titleEl.innerText?.trim() || '',
          author:   authorEl?.innerText?.trim() || 'unknown',
          postUrl:  linkEl?.getAttribute('href') || '',
          postId:   linkEl?.getAttribute('href')?.split('/')[6] || Date.now().toString(),
        });
      });

      return data;
    });

    posts.forEach((p) => {
      results.push({
        platform:    'reddit',
        keyword,
        postId:      `rd_${p.postId}`,
        author:      p.author,
        content:     p.content,
        postUrl:     p.postUrl,
        sentiment:   getSentiment(p.content),
        isComplaint: isComplaint(p.content),
      });
    });

    console.log(`Reddit: scraped ${results.length} posts for "${keyword}"`);
  } catch (err) {
    console.error('Reddit scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return results;
};

module.exports = { scrapeTwitter, scrapeReddit };