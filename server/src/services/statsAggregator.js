const prisma = require('../lib/prisma.js');

const getStats = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);


        const categoryGroups = await prisma.article.groupBy({
            by: ['category'],
            _count: { category: true },
            where: { category: { not: "AI" } }
        });

        
        const impactGroups = await prisma.article.groupBy({
            by: ['impactType'],
            _count: { impactType: true }
        });

        
        const sentimentGroups = await prisma.article.groupBy({
            by: ['sentiment'],
            _count: { sentiment: true },
            where: { 
                sentiment: { not: null },
                category: { not: "AI" }
            },
        });

        // 4. Sentiment Matrix: Breakdown of sentiment PER category
        const matrixRaw = await prisma.article.groupBy({
            by: ['category', 'sentiment'],
            _count: { _all: true },
            where: {
                category: { not: 'AI' }, 
                sentiment: { not: null }
            }
        });

        // Transform matrix into a unique list of categories with sentiment counts
        const matrixMap = {};
        matrixRaw.forEach(item => {
            if (!matrixMap[item.category]) {
                matrixMap[item.category] = { category: item.category, Positive: 0, Neutral: 0, Critical: 0, total: 0 };
            }
            const sent = item.sentiment || 'Neutral';
            matrixMap[item.category][sent] = item._count._all;
            matrixMap[item.category].total += item._count._all;
        });
        const sentimentMatrix = Object.values(matrixMap);

        // 5. Daily Trends: Volume and Sentiment over time
        const trendRaw = await prisma.article.findMany({
            where: {
                publishedAt: { gte: thirtyDaysAgo },
                category : {not: 'AI'}
            },
            select: { publishedAt: true, category: true, sentiment: true },
            orderBy: { publishedAt: 'asc' }
        });

        const trendDict = {};

        trendRaw.forEach(elem => {
            if (!elem.publishedAt) return;
            const dateVal = elem.publishedAt.toISOString().split('T')[0];
            const cat = elem.category || 'Other';
            const sent = elem.sentiment || 'Neutral';
            
            const key = `${dateVal}_${cat}`;
            if (!trendDict[key]) {
                trendDict[key] = { 
                    date: dateVal, 
                    category: cat,
                    Positive: 0, 
                    Neutral: 0, 
                    Critical: 0,
                    total: 0
                };
            }
            if (trendDict[key][sent] !== undefined) {
                trendDict[key][sent]++;
            }
            trendDict[key].total++;
        });

        const trendData = Object.values(trendDict).sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            timestamp: new Date(),
            charts: {
                byCategory: categoryGroups.map(elem => ({ name: elem.category, value: elem._count.category })),
                byImpact: impactGroups.map(elem => ({ name: elem.impactType || 'Unknown', value: elem._count.impactType })),
                bySentiment: sentimentGroups.map(elem => ({ name: elem.sentiment, value: elem._count.sentiment })),
                sentimentMatrix: sentimentMatrix
            },
            trends: trendData
        };

    } catch (err) {
        console.error("Stats Error:", err);
        return { error: err.message };
    }
};

module.exports = { getStats };