const axios = require('axios');
const cheerio = require('cheerio');
const prisma = require('../lib/prisma.js')
const llmProcessor = require('./llmProcessor.js')
require('dotenv').config();

const cleanUrl = (url) => {
    if (!url) return "";
    try {
        const urlObj = new URL(url);
        return urlObj.origin + urlObj.pathname;
    } catch (e) {
        return url.split('?')[0];
    }
};

const calculateRelevanceScore = (text) => {
    const highValue = [
        "neural", 'transformer', 'gpt', 'gemini', 'llm', 'generative', 'algorithm', 'openai', 
        'copilot', 'machine', 'learning', 'ml', 'llms', 'library', 'libraries','ai', 'artificial', 'intelligence', 'robot', 'robots', 'bot', 'bots', 'agent', 'agents',
         'automation', 'siri', 'claude', 'anthropic'
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

        
        
        const selectors = [
            'article p', '.richtext p', '#firehose p',
            '.content p', '.post-content p', '.entry-content p', 
            '#main-content p', '.story-body p', '.article-body p', 
            '.mw-body-content p',  '.intro p','[itemprop="articleBody"] p',
            'main p', 'section.body p', '.story p', 
            '.article-text p', '.post-body p'
        ];
        
        $(selectors.join(', ')).each((index, element) => {
            const text = $(element).text().trim()
            if (text.length > 50) { 
                 fullContent += text + '\n\n';
            }
        })

        if (!fullContent || fullContent.length < 200) {
            $('p, div').each((index, element) => {
                const text = $(element).text().trim();
                if (text.length > 80 && 
                    !text.includes('Copyright') && 
                    !text.includes('All rights reserved') &&
                    !text.includes('allowed to prompt it')
                ) { 
                    if (!fullContent.includes(text)) {
                         fullContent += text + '\n\n';
                    }
                }
            });
        }

        if (!fullContent || fullContent.length < 100) {
             return { success: false, reason: "No content found (Selector mismatch)" };
        }

        const introText = fullContent.substring(0, 1000)
        const score = calculateRelevanceScore(introText);

        if (score <= 2) {
            return { success: false, reason: `Low Relevance Score: ${score}` };
        }

        return { success: true, content: fullContent, score };
    }catch (err){
        console.log(`Error scraping ${url}: ${err.message}`);
        return { success: false, reason: `Scrape Error: ${err.message}` };
    }
}

const fetchSaveNews = async (days = 1, pageSize = 40) => {
    try {
        const toDate = new Date();
        toDate.setDate(toDate.getDate() - 1);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - (days + 1));
        
        const formattedFromDate = fromDate.toISOString().split('T')[0];
        const formattedToDate = toDate.toISOString().split('T')[0];

        console.log(`Searching NewsAPI for articles between ${formattedFromDate} and ${formattedToDate}...`);
        const response = await axios.get('https://newsapi.org/v2/everything', {
            params : {
                q: 'AI OR "Artificial Intelligence" OR "Machine Learning"',
                sortBy: 'relevancy',
                language: 'en',
                from: formattedFromDate,
                to: formattedToDate,
                pageSize: pageSize
            },
            headers : { 'X-Api-Key': process.env.apiKey || process.env.NEWS_API_KEY}
        })        if (!response.data || !response.data.articles) {
            console.log("⚠️ No articles found in NewsAPI response.");
            return;
        }

        const articles = response.data.articles;
        console.log(`Found ${articles.length} potential articles. Starting scrape...`);
        let savedCount = 0;
        const seenUrls = new Set();

        for (const article of articles) {
            const cleanedUrl = cleanUrl(article.url);
            
            if (seenUrls.has(cleanedUrl)) continue;
            seenUrls.add(cleanedUrl);

            console.log(`   Stats check: ${article.title.substring(0, 40)}...`);

            const existing = await prisma.article.findUnique({
                where: { url: cleanedUrl },
                select: { id: true, fullContent: true }
            });

            if (existing && existing.fullContent && existing.fullContent.length > 500) {
                console.log(`   Skipping (Already in DB with content)`);
                continue;
            }
            
            const result = await scrapeArticleContent(cleanedUrl);
            
            if (result.success) {
                try {

                    const data = await prisma.article.upsert({
                        where : {url:cleanedUrl},
                        update : {
                            curatorScore: result.score,
                            fullContent: result.content,
                            summary: article.description || "",
                            title: article.title || "No Title",
                            imageUrl: article.urlToImage || null
                        },
                        create:{
                            title: article.title || "No Title",
                            url: cleanedUrl,
                            fullContent:result.content,
                            summary:article.description || "",
                            imageUrl: article.urlToImage || null,
                            sourceName: article.source.name || "",
                            publishedAt : new Date(article.publishedAt),
                            curatorScore:result.score,
                            category: "AI",
                        }
                    });
                    savedCount += 1

                }catch (err){
                    console.error(`Db Error: ${err.message}`);
                }
            }
        }

        await pruneLowQualityContent()

        console.log(`Fetching and Saving complete, got ${savedCount} articles.`)
        
    }catch (err) {
        console.error("Scrape Failed:", err.message);
    }

}

const processArticles = async (size = 30) => {
    console.log("Looking for articles")

    try{
        const candidates = await prisma.article.findMany({
            where: {
                category: "AI",
                curatorScore: { gt: 2 } 
            },
            orderBy: [
                { curatorScore: 'desc' },
                { publishedAt: 'desc' }
            ],
            take: size 
        });

            if (candidates.length > 0) {
                console.log(`Found ${candidates.length} articles, processing in batches of 5...`);
                
                for (let i = 0; i < candidates.length; i += 5) {
                    const batch = candidates.slice(i, i + 5);
                    console.log(`Processing batch ${Math.floor(i / 5) + 1}`);
                    
                    try {
                        await llmProcessor.processBatch(batch);
                    } catch (err) {
                        console.error(`Batch failed: ${err.message}`);
                        
                        if (err.message.includes("429") || err.message.includes("503")) {
                            console.log("Rate limit hit. Waiting 60s extra before re-trying this batch...");
                            await new Promise(res => setTimeout(res, 60000));
                            try {
                                console.log("Retrying batch...");
                                await llmProcessor.processBatch(batch);
                                console.log("Retry Successful.");
                            } catch (retryErr) {
                                console.error(`Retry failed: ${retryErr.message}`);
                            }
                        }
                    }

                    
                    if (i + 5 < candidates.length) {
                        console.log("Waiting 90 seconds...");
                        await new Promise(res => setTimeout(res, 90000));
                    }
                }
                
                console.log("Identifying top article for deep dive...");

                const topArticle = await prisma.article.findFirst({
                    where: {
                        publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, 
                        curatorScore: { gte: 75 } 
                    },
                    orderBy: { curatorScore: 'desc' }
                });

                if (topArticle) {
                    if (!topArticle.deepSummary) {
                        console.log(`Generating deep dive for: ${topArticle.title}`);
                        await llmProcessor.generateDeepAnalysis(topArticle);
                    } else {
                        console.log(`Top article already has deep dive: ${topArticle.title}`);
                    }
                } else {
                    console.log("No article met the threshold (score >= 75) for deep dive.");
                }
                // ---------------------------------------------------
                
            } else {
                console.log("No candidates met the threshold for AI processing.");
            }
            
            return candidates.length;

    }catch (err){
        console.log(`Processing Error: ${err}`)
        return 0;
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
                fullContent: "" 
            }
        });
        console.log(`Pruned ${result.count} articles.`);
    } catch (err) {
        console.error("Pruning error:", err.message);
    }
}

module.exports = { fetchSaveNews, processArticles, calculateRelevanceScore, scrapeArticleContent };