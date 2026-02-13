require("dotenv").config();
const { fetchSaveNews, processArticles } = require("./src/services/newsScraper");
const prisma = require("./src/lib/prisma");

/**
 * TEST AI PIPELINE
 * This script recreates the full flow:
 * 1. Clears existing articles
 * 2. Fetches & Scrapes from NewsAPI
 * 3. Processes articles through Gemini in batches of 5
 * 4. Automatically triggers the Deep Dive for the top article
 */

async function runTest() {
  console.log("Starting Full AI Pipeline Test...");

  try {
    // 1. Clear DB for a clean slate
    console.log("Clearing database...");
    await prisma.article.deleteMany({});
    console.log("Database cleared.");

    // 2. Fetch & Save News (Scraping)
    console.log("Fetching from NewsAPI...");
    await fetchSaveNews(1, 40);

    // 3. Process with Gemini (Batches of 5)
    console.log("Starting AI processing...");
    const processedCount = await processArticles(20); 
    console.log(`Finished analysis for ${processedCount} candidates.`);

    // 4. Verification
    console.log("\n--- VERIFICATION ---");
    
    // Check main feed results
    const analyzed = await prisma.article.findMany({
      where: { curatorScore: { gte: 10 } },
      orderBy: { curatorScore: 'desc' }
    });
    console.log(`Found ${analyzed.length} articles with AI summaries.`);

    // Check Deep Dive result
    const topArticle = await prisma.article.findFirst({
        where: { deepSummary: { not: null } }
    });

    if (topArticle) {
        console.log(`\nTop Article: ${topArticle.title}`);
        console.log(`Score: ${topArticle.curatorScore}`);
        console.log(`Deep Dive Status: Completed`);
        console.log("\n--- PREVIEW ---");
        console.log(topArticle.deepSummary.substring(0, 500) + "...");
    } else {
        console.log("\nNo Deep Dive found.");
    }

  } catch (error) {
    console.error("Pipeline test failed:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\nTest Finished.");
  }
}

runTest();

