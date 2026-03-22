import dotenv from 'dotenv';
dotenv.config();

import { twitterSearchComplaints } from './src/tools/twitter/listeningTool.js';
import { connectMongo } from './src/services/mongoService.js';

async function runLiveScrape() {
  console.log("Connecting to Database...");
  await connectMongo();
  
  console.log("Initializing dynamic web scraper (Puppeteer) via Nitter...");
  console.log("Searching live internet for: HDFC Bank complaints");
  
  try {
    const result = await twitterSearchComplaints({ 
      keyword: "complaint refund", 
      brandName: "HDFC Bank", 
      limit: 3 
    });
    
    console.log("\n✅ LIVE DYNAMIC FETCH SUCCESSFUL!");
    console.log(`Found ${result.total} real tweets actively scraping right now.`);
    console.log(JSON.stringify(result.tweets.slice(0, 2), null, 2));
    
    console.log("\nThese were dynamically scraped, scored by AI, and injected into context!");
  } catch (err) {
    console.log("\n❌ Scraping failed (Nitter might be down right now):", err.message);
  }
  
  process.exit(0);
}

runLiveScrape();
