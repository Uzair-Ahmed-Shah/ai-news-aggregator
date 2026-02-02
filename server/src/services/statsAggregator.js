const prisma = require('../lib/prisma.js')

const getStats = async () => {
    try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const gorupCategories = await prisma.article.groupBy({
            by : ['category'],
            _count :{category: true},
            where : {category : {not : "AI"}}
        })
        const gorupImpacts = await prisma.article.groupBy({
            by : ['impactType'],
            _count :{impactType: true}
        })

        const groupSentiments = await prisma.article.groupBy({
            by : ['sentiment'],
            _count :{sentiment: true},
            where : {sentiment : {not : null}},
        })

        const caegorySentiment = await prisma.article.groupBy({
            by : ['category', "sentiment"],
            _count: {all : true},
            where : {
                category : {not : 'AI'},
                sentiment : {not : null}
            }
        })
        const data = await prisma.article.findMany({
            where: {
                publishedAt : {gte : thirtyDaysAgo},
                category : {not:"AI"}
            },
            select : {publishedAt: true, category : true},
            orderBy: { publishedAt: 'asc'}
        })

        const trendDict = {}

        data.forEach(elem => {
            const dateVal = elem.publishedAt.toISOString().split('T')[0]
            if (!trendDict[dateVal]){
                trendDict[dateVal] = {date : dateVal}
            }

            const category = article.category;
            trendDict[dateVal][category] = (trendDict[dateVal][category] || 0) + 1
        })

        const trendData = Object.values(trendDict)

        return {
            timestamp: new Date(),
            charts: {
                byCategory: categoryGroups.map(elem => ({ name: elem.category, value: elem._count.category })),
                byImpact: impactGroups.map(elem => ({ name: elem.impactType, value: elem._count.impactType })),
                bySentiment: sentimentGroups.map(elem => ({ name: elem.sentiment, value: elem._count.sentiment })),
                categorySentimentMatrix: catXSent
            },
            trends: trendHistory
        };

        



    }catch (err) {
        console.log(`Failed Stats Aggregation, error: ${err}`)
        return {error : err}
    }
}

module.exports = {getStats}