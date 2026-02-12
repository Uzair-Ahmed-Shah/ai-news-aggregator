const prisma = require('../lib/prisma');
const { fetchSaveNews, processArticles } = require('../services/newsScraper');
const { getStats } = require('../services/statsAggregator');


const getNewsFeed = async (req, res) => {
    try {
        let { filter, category, days } = req.query;
        if (days){
            days = parseInt(days)
        }
        let whereClause = {};
        

        const dateDiff = days ? days:7
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - dateDiff)

        if (filter === 'scraped_today') {
            whereClause.createdAt = { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
        } else {
            whereClause.publishedAt = { gte: startDate };
        }

        if (category && category !== 'All') {
            whereClause.category = category;
        }else if (category && category ==="All") {
            whereClause.category = {not : "AI"}
        }

        if (filter === 'high_signal') {
            whereClause.curatorScore = { gte: 70 };
        }
        else {
            whereClause.curatorScore = { gte: 30 };
        }

        const articles = await prisma.article.findMany({
            where: whereClause,
            orderBy: [
                { publishedAt: 'desc' },
                { curatorScore: 'desc' }
                
            ],
            take: 100
        });
        
        return res.json(articles);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Db Error" });
    }
};

const getTopArticle = async (req, res) => {
    try {
         const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

         const topArticle = await prisma.article.findFirst({
             where: {
                 publishedAt: { gte: twentyFourHoursAgo },
                 curatorScore: { gte: 0 }
             },
             orderBy: {
                 curatorScore: 'desc'
             }
         });
 
         return res.json(topArticle || null);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ "error": "Db Error fetching Top Article" });
    }
};


const triggerScrape = async (req, res) => {
    try {
        
        fetchSaveNews()
            .then(async () => {
                console.log("Background scrape finished. Starting AI Analysis...");
                const count = await processArticles(5);
                console.log(`llmProcessor Analysis complete. Processed ${count} articles.`);
            })
            .catch(err => console.error("Pipeline failed:", err));
        
        return res.json({ message: "Full pipeline started! Fetching & Analyzing. refresh in 2 mins." });
    } catch (err) {
        return res.status(500).json({ error: "Failed to start scraper" });
    }
};

const processBatchAdmin = async (req, res) => {
    try {
        console.log('Manual batch processing triggered');
        const count = await processArticles(10);
        res.json({ message: `Batch processed. Articles handled: ${count}` });
    } catch (err) {
        console.error("Error manual batch process:", err);
        res.status(500).json({ error: err.message });
    }
};


const dashboardStatsHandler = async (req, res) => {
    try {
        const stats = await getStats();
        return res.json(stats);
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

const getWeeklyReports = async (req, res) => {
    try {
        const reports = await prisma.weeklyReport.findMany({
            orderBy: { weekEndDate: 'desc' },
            take: 8
        });
        return res.json(reports);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to fetch reports" });
    }
};


// --- AUTHENTICATED ROUTES ---

const getSavedArticles = async (req, res) => {
    const userId = req.user?.id;
    if (!userId){
         return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const saved = await prisma.savedArticle.findMany({
            where: { userId },
            include: { article: true },
            orderBy: { savedAt: 'desc' }
        });
        
        return res.json(saved.map(s => s.article));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Db Error" });
    }
};


const getUserActivity = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    try {
        const likes = await prisma.articleLike.findMany({
            where: { userId },
            include: { article: true },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(likes.map(l => l.article));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Db Error" });
    }
};

const toggleLike = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id; 

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    try {
        const existingLike = await prisma.articleLike.findUnique({
            where: { userId_articleId: { userId, articleId: id } }
        });

        if (existingLike) {
            await prisma.$transaction([
                prisma.articleLike.delete({
                    where : {id:existingLike.id}
                }),
                prisma.article.update({
                    where : {id,},
                    data : {
                        likesCount: { decrement: 1 } 
                    }
                })
            ])
            return res.json({ liked: false })
        } else {
            
            await prisma.$transaction([
                prisma.articleLike.create({ 
                    data: { userId, articleId: id }
                }),
                prisma.article.update({
                    where: { id }, 
                    data: { likesCount: { increment: 1 } } 
                })
            ]);
            return res.json({ liked: true })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to toggle like" });
    }
};

const toggleSave = async (req, res) => {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    try {
        const existingSave = await prisma.savedArticle.findUnique({
             where: { userId_articleId: { userId, articleId: id } }
        })

        if (existingSave) {
            await prisma.savedArticle.delete({ 
                where: { id: existingSave.id } 
            })
            return res.json({ saved: false });
        } else {
            await prisma.savedArticle.create({ 
                data: { userId, articleId: id } 
            });
            return res.json({ saved: true })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to toggle save" });
    }
}

module.exports = { 
    getNewsFeed, 
    getTopArticle,
    triggerScrape, 
    processBatchAdmin,
    dashboardStatsHandler,
    getWeeklyReports,
    getSavedArticles,
    getUserActivity,
    toggleLike,
    toggleSave
};
