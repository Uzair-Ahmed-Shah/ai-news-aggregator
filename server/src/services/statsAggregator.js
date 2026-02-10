const prisma = require('../lib/prisma.js');

const getStats = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Group by Category
        const categoryGroups = await prisma.article.groupBy({
            by: ['category'],
            _count: { category: true },
            where: { category: { not: "AI" } } // Optional filter if needed
        });

        // 2. Group by Impact
        const impactGroups = await prisma.article.groupBy({
            by: ['impactType'],
            _count: { impactType: true }
        });

        // 3. Group by Sentiment
        const sentimentGroups = await prisma.article.groupBy({
            by: ['sentiment'],
            _count: { sentiment: true },
            where: { sentiment: { not: null } },
        });

        // 4. Matrix: Category x Sentiment
        const matrixRaw = await prisma.article.groupBy({
            by: ['category', 'sentiment'],
            _count: { _all: true },
            where: {
                category: { not: 'General' }, // Filter out boring ones if needed
                sentiment: { not: null }
            },
            take: 20,
            orderBy: {
                _count: {
                    sentiment: 'desc'
                }
            }
        });

        const categorySentimentMatrix = matrixRaw.map(item => ({
            category: item.category,
            sentiment: item.sentiment,
            count: item._count._all
        }));


        // 5. Trends (Daily volume by category)
        const trendRaw = await prisma.article.findMany({
            where: {
                publishedAt: { gte: thirtyDaysAgo },
            },
            select: { publishedAt: true, category: true },
            orderBy: { publishedAt: 'asc' }
        });

        const trendDict = {};

        trendRaw.forEach(elem => {
            const dateVal = elem.publishedAt.toISOString().split('T')[0];
            if (!trendDict[dateVal]) {
                trendDict[dateVal] = { date: dateVal };
            }
            const cat = elem.category || 'Other';
            trendDict[dateVal][cat] = (trendDict[dateVal][cat] || 0) + 1;
        });

        const trendData = Object.values(trendDict).sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            timestamp: new Date(),
            charts: {
                byCategory: categoryGroups.map(elem => ({ name: elem.category, value: elem._count.category })),
                byImpact: impactGroups.map(elem => ({ name: elem.impactType || 'Unknown', value: elem._count.impactType })),
                bySentiment: sentimentGroups.map(elem => ({ name: elem.sentiment, value: elem._count.sentiment })),
                categorySentimentMatrix: categorySentimentMatrix
            },
            trends: trendData
        };

    } catch (err) {
        console.error("Stats Error:", err);
        return { error: err.message };
    }
};

module.exports = { getStats };