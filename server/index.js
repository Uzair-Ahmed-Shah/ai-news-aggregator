const express =  require('express');
const cors = require('cors');
const prisma = require('./src/lib/prisma');
const { fetchSaveNews } = require('./src/services/newsScraper');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes.js')

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});