const express =  require('express');
const cors = require('cors');
const prisma = require('./src/lib/prisma');
const cron = require('node-cron')
const { fetchSaveNews } = require('./src/services/newsScraper');
const { getDashboardStats } = require('./src/services/statsAggregator');
const authRoutes = require('./src/routes/authRoutes.js')
require('dotenv').config();


console.log('Using node-cron fro scheduling')

cron.schedule('0 3 * * *', async () => {
  console.log('Waking up cron at 3am to run the pipeline - fetchSaveNews')
  try {
    await fetchSaveNews();
    console.log('cron ran succesfully')

  }catch (err){
    console.log(`Daily cron failed - ${err.message}`)
  }
})

// cron.schedule('0 4 * * 0', async () => {
//     console.log("📅 It's Sunday! Generating Weekly AI Trends Report...");
//     try {
//         await generateWeeklyReport();
//     } catch(err) {
//         console.error("Weekly Report Failed:", err.message);
//     }
// });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('AI News Aggregator API is Running 🚀');
});

app.use('/api/auth', authRoutes)

app.get('/api/news', async (req, res) => {
    try {
        const { filter } = req.query;

        let whereClause = {};
        
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
            take: 50
        });
        
        res.json(articles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Db Error" });
    }
});

app.post('/api/scrape', async (req, res) => {
    try {
        fetchSaveNews().then(() => console.log("Background scrape finished"));
        
        res.json({ message: "Scraper started! Check logs & refresh in 60s." });
    } catch (err) {
        res.status(500).json({ error: "Failed to start scraper" });
    }
});

app.post('/api/generate-report', async (req, res) => {
    try {
        console.log("Manual trigger: Weekly Report");
        generateWeeklyReport().then(() => console.log("Background report generation finished"));
        res.json({ message: "Report generation started! Check server logs." });
    } catch (err) {
        res.status(500).json({ error: "Failed to start report generator" });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});