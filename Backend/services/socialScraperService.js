const puppeteer = require('puppeteer');

const COMPLAINT_KEYWORDS = [
  'complaint', 'issue', 'problem', 'fraud', 'scam', 'worst',
  'terrible', 'horrible', 'pathetic', 'useless', 'cheated',
  'not working', 'failed', 'error', 'blocked', 'stolen',
  'disgusting', 'ridiculous', 'unacceptable', 'disappointed',
  'refund', 'not received', 'pending', 'stuck', 'lost money',
  'delay', 'poor service', 'bad service', 'no response', 'ignored'
];

const NEGATIVE_WORDS = [
  'bad', 'worst', 'terrible', 'fraud', 'scam', 'horrible',
  'useless', 'pathetic', 'disgusting', 'cheated', 'failed',
  'delay', 'broken', 'stuck', 'unacceptable', 'disappointed'
];

const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'love',
  'best', 'happy', 'satisfied', 'helpful', 'resolved'
];

const normalizeText = (text = '') => text.replace(/\s+/g, ' ').trim();

const isComplaint = (text = '') => {
  const lower = text.toLowerCase();
  return COMPLAINT_KEYWORDS.some((kw) => lower.includes(kw));
};

const getSentiment = (text = '') => {
  const lower = text.toLowerCase();
  const negCount = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  const posCount = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;

  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
};

const getPriority = (text = '') => {
  const lower = text.toLowerCase();

  if (
    lower.includes('fraud') ||
    lower.includes('scam') ||
    lower.includes('stolen') ||
    lower.includes('lost money') ||
    lower.includes('blocked')
  ) {
    return 'critical';
  }

  if (
    lower.includes('refund') ||
    lower.includes('failed') ||
    lower.includes('worst') ||
    lower.includes('terrible')
  ) {
    return 'high';
  }

  if (isComplaint(lower)) return 'medium';
  return 'low';
};

const launchBrowser = async () => {
  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
};

const createPage = async (browser) => {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1366, height: 768 });
  return page;
};

const mapResult = (platform, keyword, item) => ({
  platform,
  keyword,
  postId: item.postId,
  author: item.author || 'unknown',
  authorProfileUrl: item.authorProfileUrl || '',
  content: normalizeText(item.content || ''),
  postUrl: item.postUrl || '',
  sentiment: getSentiment(item.content || ''),
  isComplaint: isComplaint(item.content || ''),
  priority: getPriority(item.content || ''),
  sourceCreatedAt: item.date ? new Date(item.date) : null,
});

const scrapeTwitter = async (keyword) => {
  const browser = await launchBrowser();
  const results = [];

  try {
    const page = await createPage(browser);

    const nitterInstances = [
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.net'
    ];

    let loaded = false;

    for (const baseUrl of nitterInstances) {
      try {
        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(keyword)}&f=tweets`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 25000 });
        await page.waitForSelector('.timeline-item', { timeout: 8000 });
        loaded = true;
        break;
      } catch (err) {
        continue;
      }
    }

    if (!loaded) return [];

    const tweets = await page.evaluate(() => {
      const items = document.querySelectorAll('.timeline-item');
      const data = [];

      items.forEach((item) => {
        const contentEl = item.querySelector('.tweet-content');
        const authorEl = item.querySelector('.username');
        const linkEl = item.querySelector('.tweet-link');
        const dateEl = item.querySelector('.tweet-date a');

        if (!contentEl) return;

        const href = linkEl?.getAttribute('href') || '';
        const postId = href.split('/').pop();

        data.push({
          content: contentEl.innerText?.trim() || '',
          author: authorEl?.innerText?.trim() || 'unknown',
          postUrl: href ? `https://twitter.com${href}` : '',
          postId: postId ? `tw_${postId}` : `tw_${Date.now()}_${Math.random()}`,
          date: dateEl?.getAttribute('title') || null,
        });
      });

      return data;
    });

    for (const tweet of tweets) {
      results.push(mapResult('twitter', keyword, tweet));
    }
  } catch (err) {
    console.error('Twitter scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return results;
};

const scrapeReddit = async (keyword) => {
  const browser = await launchBrowser();
  const results = [];

  try {
    const page = await createPage(browser);
    const searchUrl = `https://old.reddit.com/search/?q=${encodeURIComponent(keyword)}&sort=new`;

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const posts = await page.evaluate(() => {
      const cards = document.querySelectorAll('.search-result');
      const data = [];

      cards.forEach((card) => {
        const titleEl = card.querySelector('a.search-title');
        const authorEl = card.querySelector('.author');
        const timeEl = card.querySelector('time');

        if (!titleEl) return;

        const href = titleEl.getAttribute('href') || '';
        const parts = href.split('/');
        const possibleId = parts[6] || `${Date.now()}_${Math.random()}`;

        data.push({
          content: titleEl.innerText?.trim() || '',
          author: authorEl?.innerText?.trim() || 'unknown',
          postUrl: href,
          postId: `rd_${possibleId}`,
          date: timeEl?.getAttribute('datetime') || null,
        });
      });

      return data;
    });

    for (const post of posts) {
      results.push(mapResult('reddit', keyword, post));
    }
  } catch (err) {
    console.error('Reddit scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return results;
};

const scrapeYouTube = async (keyword) => {
  const browser = await launchBrowser();
  const results = [];

  try {
    const page = await createPage(browser);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('a#video-title', { timeout: 10000 });

    const videos = await page.evaluate(() => {
      const items = document.querySelectorAll('ytd-video-renderer');
      const data = [];

      items.forEach((item) => {
        const titleEl = item.querySelector('a#video-title');
        const channelEl = item.querySelector('a.yt-simple-endpoint.yt-formatted-string');
        if (!titleEl) return;

        const href = titleEl.getAttribute('href') || '';
        const videoId = href.includes('watch?v=') ? href.split('watch?v=')[1].split('&')[0] : null;

        data.push({
          content: titleEl.textContent?.trim() || '',
          author: channelEl?.textContent?.trim() || 'unknown',
          postUrl: href ? `https://www.youtube.com${href}` : '',
          postId: videoId ? `yt_${videoId}` : `yt_${Date.now()}_${Math.random()}`,
          date: null,
        });
      });

      return data;
    });

    for (const video of videos) {
      results.push(mapResult('youtube', keyword, video));
    }
  } catch (err) {
    console.error('YouTube scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return results;
};

const scrapeByPlatform = async (platform, keyword) => {
  switch (platform) {
    case 'twitter':
      return scrapeTwitter(keyword);
    case 'reddit':
      return scrapeReddit(keyword);
    case 'youtube':
      return scrapeYouTube(keyword);
    default:
      return [];
  }
};

module.exports = {
  scrapeTwitter,
  scrapeReddit,
  scrapeYouTube,
  scrapeByPlatform,
  isComplaint,
  getSentiment,
  getPriority,
};