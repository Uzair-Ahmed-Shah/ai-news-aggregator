const express =  require('express');
const cors = require('cors');
const prisma = require('./src/lib/prisma');
const cron = require('node-cron')
const { fetchSaveNews } = require('./src/services/newsScraper');
const { generateWeeklyReport } = require('./src/services/trendAnalyzer');
const authRoutes = require('./src/routes/authRoutes.js')
require('dotenv').config();


console.log('Using node-cron fro scheduling')

// 1. Daily Scrape (3:00 AM)
cron.schedule('0 3 * * *', async () => {
  console.log('Waking up cron at 3am to run the pipeline - fetchSaveNews')
  try {
    await fetchSaveNews();
    console.log('cron ran succesfully')

  }catch (err){
    console.log(`Daily cron failed - ${err.message}`)
  }
})

// 2. Weekly Report (Every Sunday at 4:00 AM)
cron.schedule('0 4 * * 0', async () => {
    console.log("📅 It's Sunday! Generating Weekly AI Trends Report...");
    try {
        await generateWeeklyReport();
    } catch(err) {
        console.error("Weekly Report Failed:", err.message);
    }
});

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('AI News Aggregator API is Running 🚀');
});

// Auth Routes
app.use('/api/auth', authRoutes)


// --- NEW: News Routes ---

// 1. GET /api/news - Fetch articles from DB
app.get('/api/news', async (req, res) => {
    try {
        const { filter } = req.query; // 'top', 'all'

        let whereClause = {};
        
        // Filter Logic
        if (filter === 'high-signal') {
            whereClause = { curatorScore: { gte: 70 } };
        } else if (filter === 'scraped-today') {
            whereClause = { 
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
            };
        }

        const articles = await prisma.article.findMany({
            where: whereClause,
            orderBy: { publishedAt: 'desc' },
            take: 50 // Limit to 50 for the UI
        });
        
        res.json(articles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Db Error" });
    }
});

// 2. POST /api/scrape - Trigger the Scraper + AI Manually
app.post('/api/scrape', async (req, res) => {
    try {
        // Run in background (don't await) so UI doesn't freeze
        fetchSaveNews().then(() => console.log("Background scrape finished"));
        
        res.json({ message: "Scraper started! Check logs & refresh in 60s." });
    } catch (err) {
        res.status(500).json({ error: "Failed to start scraper" });
    }
});

// 3. POST /api/generate-report - Manually Trigger Weekly Report (Debug)
app.post('/api/generate-report', async (req, res) => {
    try {
        console.log("Manual trigger: Weekly Report");
        generateWeeklyReport().then(() => console.log("Background report generation finished"));
        res.json({ message: "Report generation started! Check server logs." });
    } catch (err) {
        res.status(500).json({ error: "Failed to start report generator" });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});