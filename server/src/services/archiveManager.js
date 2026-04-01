const prisma = require('../lib/prisma');

const generateWeeklySnapshot = async () => {
    try {
        console.log("   Starting Weekly Archive Snapshot generation.");

        const weekEndDate = new Date();
        const weekStartDate = new Date();
        weekStartDate.setDate(weekStartDate.getDate() - 7);

        const topArticles = await prisma.article.findMany({
            where: {
                publishedAt: {
                    gte: weekStartDate,
                    lte: weekEndDate
                }
            },
            orderBy: {
                curatorScore: 'desc'
            },
            take: 10
        });

        if (topArticles.length === 0) {
            console.log("   No articles found for this week. Skipping archive.");
            return;
        }

        const snapshotData = topArticles.map(article => ({
            id: article.id,
            title: article.title,
            summary: article.summary,
            url: article.url,
            sourceName: article.sourceName,
            curatorScore: article.curatorScore,
            category: article.category,
            publishedAt: article.publishedAt
        }));

        // TODO: Future LLM Hook
        // const generatedTitle = await generateCatchyTitle(snapshotData);
        
        const dateOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
        const placeholderTitle = `Weekly Intel: ${weekStartDate.toLocaleDateString('en-US', dateOptions)} - ${weekEndDate.toLocaleDateString('en-US', dateOptions)}`;

        const archiveEntry = await prisma.weeklyReport.create({
            data: {
                title: placeholderTitle,
                weekEndDate: weekEndDate,
                topArticles: snapshotData
            }
        });

        console.log(`✅ Successfully archived Edition ID: ${archiveEntry.id} with ${snapshotData.length} articles.`);

    } catch (error) {
        console.error("❌ Failed to generate Weekly Archive Snapshot:", error);
    }
};

module.exports = { generateWeeklySnapshot };
