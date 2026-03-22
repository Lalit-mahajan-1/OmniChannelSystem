import puppeteer from 'puppeteer';
import { MCPEvent } from '../../services/mongoService.js';

/**
 * Search Twitter/X via Nitter (no API key needed) for brand complaints.
 * Tries multiple Nitter instances in order; stops on first success.
 *
 * SocialComplaint.js uses Nitter the same way in socialScraperService.js
 * — we write to MCPEvent (our own collection), so zero conflict.
 */
export async function twitterSearchComplaints({ keyword, brandName, limit = 20 }) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  );

  // Fallback Nitter instances (same strategy as teammate's socialScraperService.js)
  const nitterInstances = [
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
    'https://nitter.1d4.us',
    'https://nitter.kavin.rocks',
    'https://nitter.net'
  ];

  const searchTerm = encodeURIComponent(`${brandName} ${keyword}`);
  let results = [];

  for (const instance of nitterInstances) {
    try {
      await page.goto(`${instance}/search?q=${searchTerm}&f=tweets`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      await new Promise(r => setTimeout(r, 2000));

      results = await page.evaluate((lim) => {
        const tweets = document.querySelectorAll('.timeline-item .tweet-content');
        const names  = document.querySelectorAll('.timeline-item .fullname');
        const times  = document.querySelectorAll('.timeline-item .tweet-date a');
        const out = [];
        tweets.forEach((t, i) => {
          if (i >= lim) return;
          out.push({
            text:      t.innerText?.trim(),
            author:    names[i]?.innerText?.trim() || 'unknown',
            timestamp: times[i]?.getAttribute('title') || new Date().toISOString()
          });
        });
        return out;
      }, limit);

      if (results.length > 0) break; // stop once we have data
    } catch (_) {
      continue; // try next instance
    }
  }

  await browser.close();

  // Enrich with sentiment + urgency
  const enriched = results.map(r => {
    const sentiment   = scoreSentiment(r.text);
    const isComplaint = sentiment === 'negative' || sentiment === 'angry';
    const urgency     = scoreUrgency(r.text);
    return { ...r, sentiment, isComplaint, urgency, platform: 'twitter' };
  });

  // Persist complaints to MCPEvent (own collection)
  for (const tweet of enriched.filter(t => t.isComplaint)) {
    await MCPEvent.create({
      customerId: tweet.author,
      channel: 'twitter',
      direction: 'inbound',
      content: tweet.text,
      summary: tweet.text?.substring(0, 100),
      sentiment: tweet.sentiment,
      intent: 'complaint',
      metadata: { urgency: tweet.urgency, brandName, keyword }
    }).catch(() => {});
  }

  return {
    keyword,
    brandName,
    total: enriched.length,
    complaints: enriched.filter(e => e.isComplaint).length,
    highUrgency: enriched.filter(e => e.urgency === 'high').length,
    tweets: enriched
  };
}

function scoreSentiment(text = '') {
  const t = text.toLowerCase();
  if (/fraud|scam|lawsuit|criminal|worst|useless|pathetic/.test(t)) return 'angry';
  if (/bad|terrible|disappointed|problem|issue|complaint|failed|broken/.test(t)) return 'negative';
  if (/good|love|great|amazing|excellent|perfect|thanks/.test(t)) return 'positive';
  return 'neutral';
}

function scoreUrgency(text = '') {
  const t = text.toLowerCase();
  if (/urgent|asap|immediately|emergency|critical|escalate/.test(t)) return 'high';
  if (/soon|waiting|still|delayed|days|week/.test(t)) return 'medium';
  return 'low';
}
