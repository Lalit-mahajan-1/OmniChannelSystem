const puppeteer = require('puppeteer');

const COMPLAINT_KEYWORDS = [
  'complaint', 'issue', 'problem', 'fraud', 'scam', 'worst',
  'terrible', 'horrible', 'pathetic', 'useless', 'cheated',
  'not working', 'failed', 'error', 'blocked', 'stolen',
  'disgusting', 'ridiculous', 'unacceptable', 'disappointed',
  'refund', 'not received', 'pending', 'stuck', 'lost money',
  'delay', 'poor service', 'bad service', 'no response', 'ignored',
  'harassed', 'chargeback', 'debit', 'credit card', 'unauthorized',
  'bank account', 'account blocked', 'kyc issue', 'loan issue'
];

const NEGATIVE_WORDS = [
  'bad', 'worst', 'terrible', 'fraud', 'scam', 'horrible',
  'useless', 'pathetic', 'disgusting', 'cheated', 'failed',
  'delay', 'broken', 'stuck', 'unacceptable', 'disappointed',
  'blocked', 'pending', 'refund', 'error', 'harassed'
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
    lower.includes('unauthorized') ||
    lower.includes('blocked')
  ) {
    return 'critical';
  }

  if (
    lower.includes('refund') ||
    lower.includes('failed') ||
    lower.includes('worst') ||
    lower.includes('terrible') ||
    lower.includes('pending')
  ) {
    return 'high';
  }

  if (isComplaint(lower)) return 'medium';
  return 'low';
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

const dedupeByPostId = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.postId) return false;
    if (seen.has(item.postId)) return false;
    seen.add(item.postId);
    return true;
  });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const launchBrowser = async () => {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });
};

const createPage = async (browser) => {
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  return page;
};

const safeGoto = async (page, url, opts = {}) => {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
    ...opts,
  });
};

const filterComplaintLike = (items = [], complaintsOnly = false) => {
  if (!complaintsOnly) return items;
  return items.filter((x) => x.isComplaint || x.sentiment === 'negative' || x.priority !== 'low');
};

/* ---------------- TWITTER/X via Nitter ---------------- */

const scrapeTwitter = async (browser, keyword, options = {}) => {
  const page = await createPage(browser);
  const results = [];

  try {
    const nitterInstances = [
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.net',
      'https://nitter.unixfox.eu',
    ];

    let loaded = false;

    for (const baseUrl of nitterInstances) {
      try {
        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(keyword)}&f=tweets`;
        await safeGoto(page, searchUrl);
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
        const fullnameEl = item.querySelector('.fullname');
        const linkEl = item.querySelector('.tweet-link');
        const dateEl = item.querySelector('.tweet-date a');

        if (!contentEl) return;

        const href = linkEl?.getAttribute('href') || '';
        const postId = href.split('/').pop();

        data.push({
          content: contentEl.innerText?.trim() || '',
          author: authorEl?.innerText?.trim() || fullnameEl?.innerText?.trim() || 'unknown',
          authorProfileUrl: authorEl?.getAttribute('href')
            ? `https://twitter.com${authorEl.getAttribute('href')}`
            : '',
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
    await page.close();
  }

  return filterComplaintLike(dedupeByPostId(results), options.complaintsOnly);
};

/* ---------------- REDDIT ---------------- */

const scrapeReddit = async (browser, keyword, options = {}) => {
  const page = await createPage(browser);
  const results = [];

  try {
    const searchUrl = `https://old.reddit.com/search/?q=${encodeURIComponent(keyword)}&sort=new`;
    await safeGoto(page, searchUrl);

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
          authorProfileUrl: authorEl?.getAttribute('href') || '',
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
    await page.close();
  }

  return filterComplaintLike(dedupeByPostId(results), options.complaintsOnly);
};

/* ---------------- YOUTUBE ---------------- */

const scrapeYouTube = async (browser, keyword, options = {}) => {
  const page = await createPage(browser);
  const results = [];

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword + ' complaint')}`;
    await safeGoto(page, searchUrl);
    await page.waitForSelector('a#video-title', { timeout: 12000 });

    await page.evaluate(() => window.scrollBy(0, 1500));
    await sleep(1000);

    const videos = await page.evaluate(() => {
      const items = document.querySelectorAll('ytd-video-renderer');
      const data = [];

      items.forEach((item) => {
        const titleEl = item.querySelector('a#video-title');
        const channelEl = item.querySelector('ytd-channel-name a');
        const metadataLines = item.querySelectorAll('#metadata-line span');

        if (!titleEl) return;

        const href = titleEl.getAttribute('href') || '';
        const videoId = href.includes('watch?v=')
          ? href.split('watch?v=')[1].split('&')[0]
          : null;

        data.push({
          content: titleEl.textContent?.trim() || '',
          author: channelEl?.textContent?.trim() || 'unknown',
          authorProfileUrl: channelEl?.getAttribute('href')
            ? `https://www.youtube.com${channelEl.getAttribute('href')}`
            : '',
          postUrl: href ? `https://www.youtube.com${href}` : '',
          postId: videoId ? `yt_${videoId}` : `yt_${Date.now()}_${Math.random()}`,
          date: metadataLines?.[1]?.textContent?.trim() || null,
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
    await page.close();
  }

  return filterComplaintLike(dedupeByPostId(results), options.complaintsOnly);
};

/* ---------------- LINKEDIN via Bing site search ----------------
   Direct LinkedIn scraping is brittle / often blocked.
   This approach searches publicly indexed LinkedIn pages mentioning the bank.
*/

const scrapeLinkedIn = async (browser, keyword, options = {}) => {
  const page = await createPage(browser);
  const results = [];

  try {
    const searchQuery = `site:linkedin.com/posts OR site:linkedin.com/feed "${keyword}" complaint OR issue OR fraud OR bad service`;
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`;

    await safeGoto(page, searchUrl);
    await page.waitForSelector('li.b_algo', { timeout: 12000 });

    const posts = await page.evaluate(() => {
      const items = document.querySelectorAll('li.b_algo');
      const data = [];

      items.forEach((item) => {
        const titleEl = item.querySelector('h2 a');
        const snippetEl = item.querySelector('.b_caption p');
        if (!titleEl || !snippetEl) return;

        const href = titleEl.getAttribute('href') || '';
        const title = titleEl.textContent?.trim() || '';
        const snippet = snippetEl.textContent?.trim() || '';

        data.push({
          content: `${title} ${snippet}`.trim(),
          author: 'linkedin_public',
          authorProfileUrl: '',
          postUrl: href,
          postId: `li_${Buffer.from(href).toString('base64').slice(0, 32)}`,
          date: null,
        });
      });

      return data;
    });

    for (const post of posts) {
      results.push(mapResult('linkedin', keyword, post));
    }
  } catch (err) {
    console.error('LinkedIn scrape error:', err.message);
  } finally {
    await page.close();
  }

  return filterComplaintLike(dedupeByPostId(results), options.complaintsOnly);
};

/* ---------------- MAIN ORCHESTRATOR ---------------- */

const scrapeByPlatform = async (platform, keyword, options = {}) => {
  const browser = await launchBrowser();
  try {
    switch (platform) {
      case 'twitter':
        return await scrapeTwitter(browser, keyword, options);
      case 'reddit':
        return await scrapeReddit(browser, keyword, options);
      case 'youtube':
        return await scrapeYouTube(browser, keyword, options);
      case 'linkedin':
        return await scrapeLinkedIn(browser, keyword, options);
      default:
        return [];
    }
  } finally {
    await browser.close();
  }
};

const scrapePlatforms = async (keyword, platforms = ['twitter', 'reddit', 'youtube', 'linkedin'], options = {}) => {
  const browser = await launchBrowser();
  try {
    let results = [];

    if (platforms.includes('twitter')) {
      results.push(...await scrapeTwitter(browser, keyword, options));
    }
    if (platforms.includes('reddit')) {
      results.push(...await scrapeReddit(browser, keyword, options));
    }
    if (platforms.includes('youtube')) {
      results.push(...await scrapeYouTube(browser, keyword, options));
    }
    if (platforms.includes('linkedin')) {
      results.push(...await scrapeLinkedIn(browser, keyword, options));
    }

    return dedupeByPostId(results);
  } finally {
    await browser.close();
  }
};

module.exports = {
  scrapeTwitter: (keyword, options = {}) => scrapeByPlatform('twitter', keyword, options),
  scrapeReddit: (keyword, options = {}) => scrapeByPlatform('reddit', keyword, options),
  scrapeYouTube: (keyword, options = {}) => scrapeByPlatform('youtube', keyword, options),
  scrapeLinkedIn: (keyword, options = {}) => scrapeByPlatform('linkedin', keyword, options),
  scrapeByPlatform,
  scrapePlatforms,
  isComplaint,
  getSentiment,
  getPriority,
};