const prisma = require('../lib/prisma');
const { fetchSaveNews, processArticles } = require('../services/newsScraper');
const { getStats } = require('../services/statsAggregator');
const PDFDocument = require('pdfkit');

const getNewsFeed = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const articles = await prisma.article.findMany({
            where: {
                publishedAt: { gte: sevenDaysAgo },
                curatorScore: { gte: 30 },
                category: { not: "AI" } 
            },
            orderBy: { publishedAt: 'desc' },
            take: 300,
            select: {
                id: true, title: true, url: true, summary: true,
                deepSummary: true, imageUrl: true, curatorScore: true,
                sourceName: true, category: true, sentiment: true,
                impactType: true, publishedAt: true, createdAt: true,
                likesCount: true,
            }
        });

        const sortedArticles = articles.sort((a, b) => {
            const dateA = new Date(a.publishedAt).toISOString().split('T')[0];
            const dateB = new Date(b.publishedAt).toISOString().split('T')[0];
            if (dateA !== dateB) {
                return dateB.localeCompare(dateA);
            }
            return (b.curatorScore || 0) - (a.curatorScore || 0);
        });

        if (sortedArticles.length > 0) {
            const hero = sortedArticles[0];
            if (!hero.deepSummary) {
                try {
                    const heroFull = await prisma.article.findUnique({
                        where: { id: hero.id },
                        select: { fullContent: true }
                    });
                    if (heroFull?.fullContent) {
                        const llmProcessor = require('../services/llmProcessor');
                        console.log(`Deep Dive generation triggered for Hero Article: ${hero.title}`);
                        await llmProcessor.generateDeepAnalysis({ ...hero, fullContent: heroFull.fullContent });
                        const updatedHero = await prisma.article.findUnique({
                            where: { id: hero.id },
                            select: {
                                id: true, title: true, url: true, summary: true,
                                deepSummary: true, imageUrl: true, curatorScore: true,
                                sourceName: true, category: true, sentiment: true,
                                impactType: true, publishedAt: true, createdAt: true,
                                likesCount: true,
                            }
                        });
                        if (updatedHero) {
                            sortedArticles[0] = updatedHero;
                        }
                    }
                } catch (err) {
                    console.error("Failed to generate deep dive:", err.message);
                }
            }
        }
        
        return res.json({ articles :sortedArticles });
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
 
         return res.json({ article: topArticle });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Db Error" });
    }
}

const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await prisma.article.findUnique({
            where: { id: id }
        });

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        return res.json({ article });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Db Error" });
    }
}

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


const getSavedArticles = async (req, res) => {
    const userId = req.user?.userId;
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
    const userId = req.user?.userId;
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
    const userId = req.user?.userId; 

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
    const userId = req.user?.userId

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


const generateWeeklyPDF = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const topArticles = await prisma.article.findMany({
            where: {
                publishedAt: { gte: sevenDaysAgo },
                category: { not: "AI" } 
            },
            orderBy: { curatorScore: 'desc' },
            take: 10
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="The_AI_Intel_Weekly_Dossier.pdf"');

        const doc = new PDFDocument({ margin: 50 });

        doc.pipe(res);

        doc.font('Helvetica-Bold').fontSize(24).text('THE AI INTEL', { align: 'center' });
        doc.font('Helvetica').fontSize(12).text('Weekly Intelligence Dossier', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('gray').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(3);

        topArticles.forEach((article, index) => {
            doc.fillColor('black').font('Helvetica-Bold').fontSize(14)
               .text(`${String(index + 1).padStart(2, '0')} // ${article.category.toUpperCase()}`);

            doc.moveDown(0.3);
            doc.font('Helvetica-Bold').fontSize(16).text(article.title);

            doc.moveDown(0.2);
            doc.font('Helvetica').fontSize(10).fillColor('blue')
               .text(`Signal Score: ${article.curatorScore}  |  Source: ${article.sourceName || 'Unknown'}`);

            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(11).fillColor('#333333')
               .text(article.summary ? article.summary.replace(/•/g, '') : "Analysis pending.", {
                   align: 'justify',
                   lineGap: 4
               });

            doc.moveDown(2); 
        });


        doc.end();

    } catch (err) {
        console.error("PDF Generation Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate dossier." });
        }
    }
};

module.exports = { 
    getNewsFeed, 
    getArticleById,
    getTopArticle,
    triggerScrape, 
    processBatchAdmin,
    dashboardStatsHandler,
    getWeeklyReports,
    getSavedArticles,
    getUserActivity,
    toggleLike,
    toggleSave,
    generateWeeklyPDF
};
