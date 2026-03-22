import puppeteer from 'puppeteer';
import { MCPEvent } from '../../services/mongoService.js';

/**
 * Scrape LinkedIn public search for posts/comments mentioning a brand.
 * Detects complaints and persists them to the MCPEvent collection.
 *
 * Note: LinkedIn may require login for full results. This targets public
 * search pages. If gated, results will be sparse — that is expected.
 */
export async function linkedinGetBrandComments({ brandName, keyword, limit = 15 }) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  );

  const searchQuery = encodeURIComponent(`${brandName} ${keyword || 'complaint'}`);
  const url = `https://www.linkedin.com/search/results/content/?keywords=${searchQuery}&sortBy=date_posted`;

  const results = [];

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));

    const posts = await page.evaluate((lim) => {
      const items = document.querySelectorAll(
        '.search-results__list .entity-result, .feed-shared-update-v2'
      );
      const out = [];
      items.forEach((el, i) => {
        if (i >= lim) return;
        const text   = el.querySelector('.feed-shared-text, .entity-result__summary')?.innerText?.trim();
        const author = el.querySelector('.entity-result__title-text a, .actor-name')?.innerText?.trim();
        const time   = el.querySelector('time')?.getAttribute('datetime');
        if (text) out.push({
          text,
          author: author || 'unknown',
          timestamp: time || new Date().toISOString()
        });
      });
      return out;
    }, limit);

    for (const post of posts) {
      const sentiment  = detectSentiment(post.text);
      const isComplaint = sentiment === 'negative' || sentiment === 'angry';

      results.push({ ...post, sentiment, isComplaint, platform: 'linkedin' });

      if (isComplaint) {
        await MCPEvent.create({
          customerId: post.author,
          channel: 'linkedin',
          direction: 'inbound',
          content: post.text,
          summary: post.text.substring(0, 100),
          sentiment,
          intent: 'complaint',
          metadata: { platform: 'linkedin', brandName }
        }).catch(() => {}); // silent fail on duplicate key
      }
    }
  } catch (err) {
    console.error('[LinkedIn] Scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return {
    brandName,
    keyword,
    total: results.length,
    complaints: results.filter(r => r.isComplaint).length,
    posts: results
  };
}

function detectSentiment(text) {
  const t = text.toLowerCase();
  if (/worst|terrible|horrible|disgusting|fraud|scam|useless|never again/.test(t)) return 'angry';
  if (/bad|poor|disappointed|unhappy|not good|issue|problem|complaint/.test(t)) return 'negative';
  if (/good|great|excellent|amazing|love|perfect|thank/.test(t)) return 'positive';
  return 'neutral';
}
