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

        



    }catch (err) {

    }
}