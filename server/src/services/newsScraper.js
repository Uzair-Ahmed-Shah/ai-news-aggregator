const axios = require('axios');
const cheerio = require('cheerio');
const prisma = require('../lib/prisma.js')
const llmProcessor = require('./llmProcessor.js')
require('dotenv').config();

const stopWords = new Set(["the", "and", "is", "of", "to", "in", "that", "it", "for", "on", "with", "as", "was", "at", "by", "an", "be", "this", "which", "or", "from", "but", "not", "are", "your", "all", "have", "new", "more", "one", "its", "we", "can", "said", "about", "like", "just", "time", "up", "out", "some", "what", "google", "microsoft", "openai", "artificial", "intelligence", "market", "stock", "data", "company", "model", "models"]);
const topKeywords = (text) => {
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);

    const frequency = {};
    words.forEach(word => {
        if (word.length > 4 && !stopWords.has(word)) { 
            if (word in frequency){
                frequency[word] += 1
            }else {
                frequency[word] = 1
            }
        }
    });

    const listFrequency = Object.entries(frequency)
    const sortedFrequency = listFrequency.sort((a,b) => b[1] - a[1])
    return sortedFrequency.slice(0, 5).map(item => item[0])

}

const calculateRelevanceScore = (text) => {
    const highValue = [
        "neural", 'transformer', 'gpt', 'gemini', 'llm', 'generative', 'algorithm', 'openai', 
        'copilot', 'machine', 'learning', 'ml', 'llms', 'library', 'libraries','ai', 'artificial', 'intelligence', 'robot', 'robots', 'bot', 'bots', 'agent', 'agents',
         'automation'
    ]
    const lowValue = ["football", 'premier league', 'soccer', 'cricket', 'deal', 'shopping']

    let score = 0;
    const words = text.toLowerCase().split(/[\s']+/)
    words.forEach(element => {
        if (highValue.includes(element)){
            score += 1
        }
        else if (lowValue.includes(element)){
            score -= 5
        }
    });
    return score
}

const scrapeArticleContent = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers : { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' },
            timeout: 5000
        })

        const $ = cheerio.load(data)
        let fullContent = ''

        
        
        $('article p, .content p, .post-content p, .entry-content p, #main-content p, .story-body p, .article-body p, .mw-body-content p, #firehose p, .intro p').each((index, element) => {
            const text = $(element).text().trim()
            if (text.length > 50) { 
                 fullContent += text + '\n\n';
            }
        })

        if (!fullContent) {
             return { success: false, reason: "No content found (Selector mismatch)" };
        }

        const introText = fullContent.substring(0, 1000)
        const score = calculateRelevanceScore(introText);

        if (score < 2) {
            return { success: false, reason: `Low Relevance Score: ${score}` };
        }

        return { success: true, content: fullContent, score };
    }catch (err){
        console.log(`Error scraping ${url}: ${err.message}`);
        return { success: false, reason: `Scrape Error: ${err.message}` };
    }
}

const fetchSaveNews = async () => {
    try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
            params : {
                q: '("Artificial Intelligence" OR "Machine Learning" OR "Deep Learning" OR "Neural Networks" OR "Large Language Models" OR "Generative AI") NOT (football OR soccer OR "translated by AI")',
                excludeDomains: 'yahoo.com,consent.yahoo.com',
                searchIn: 'title,description',
                sortBy: 'relevancy',
                language: 'en',
                from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Fetch last 24h only
                pageSize: 30
            },
            headers : { 'X-Api-Key': process.env.apiKey}
        })

        const articles = response.data.articles;
        // const results = [];
        // const discarded = [];
        let savedCount = 0;

        for (const article of articles) {
            console.log(`   Stats check: ${article.title.substring(0, 40)}...`);
            
            const result = await scrapeArticleContent(article.url);
            
            if (result.success) {
                try {
                    const keywords = topKeywords(result.content);

                    const data = await prisma.article.upsert({
                        where : {url:article.url},
                        update : {
                            curatorScore: result.score,
                            keywords: keywords,
                            fullContent: result.content,
                            summary: article.description || "",
                            title: article.title || "No Title"
                        },
                        create:{
                            title: article.title || "No Title",
                            url: article.url,
                            fullContent:result.content,
                            summary:article.description || "",
                            sourceName: article.source.name || "",
                            publishedAt : new Date(article.publishedAt),
                            curatorScore:result.score,
                            category: "AI",
                            keywords: keywords
                        }
                    });
                    savedCount += 1

                }catch (err){
                    console.error(`Db Error: ${err.message}`);
                }
            }
        }

                console.log(`Fetching and Saving complete, got ${savedCount} articles.`)

        // FORCE CHECK: Always look for unprocessed candidates, even if no NEW articles were saved.
        console.log("Checking for unprocessed candidates for AI Analysis...");
            
        await new Promise(r => setTimeout(r, 2000));
        
        const candidates = await prisma.article.findMany({
            where: {
                category: "AI",
                curatorScore: { gt: 2 } // Process almost everything (Scores 3, 4, 5...)
            },
            orderBy: { publishedAt: 'desc' },
            take: 10 
        });

            if (candidates.length > 0) {
                console.log(`${candidates.length} articles, processing in batches.`);
                
                const batch1 = candidates.slice(0, 3);
                const batch2 = candidates.slice(3, 6);
                const batch3 = candidates.slice(6, 10);

                await llmProcessor.processBatch(batch1);

                if (batch2.length > 0) {
                    await llmProcessor.processBatch(batch2);
                }
                if (batch3.length > 0) {
                    await llmProcessor.processBatch(batch3);
                }
                
            } else {
                console.log("No candidates met the threshold for AI processing.");
            }
            
            await pruneLowQualityContent();

    }catch (err) {
        console.error("Scrape Failed:", err.message);
    }

}

const pruneLowQualityContent = async () => {
    try {
        console.log("Removing fullContent for non-candidate articles to save space");
        const result = await prisma.article.updateMany({
            where: {
                category: "AI", 
                curatorScore: { lte: 2 } 
            },
            data: {
                fullContent: null 
            }
        });
        console.log(`Pruned ${result.count} articles.`);
    } catch (err) {
        console.error("Pruning error:", err.message);
    }
}

module.exports = { fetchSaveNews, calculateRelevanceScore, scrapeArticleContent }; 