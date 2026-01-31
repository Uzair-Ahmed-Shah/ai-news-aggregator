const OpenAI = require("openai");
const prisma = require("../lib/prisma");
require("dotenv").config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AI News Aggregator",
  },
});

const SYSTEM_PROMPT = `
You are a Senior Analyst identifying meaningful weekly trends in the global AI ecosystem.

You will be given a list of AI news articles from a single week, each with an ID, title, summary, category, and score.
Your task is to identify underlying trends that emerge across multiple articles and assess the overall sentiment of each article.

You are analyzing patterns and direction, not predicting the future.

---

### TREND IDENTIFICATION RULES
A trend is a recurring underlying theme supported by multiple independent articles.

A valid trend must:
- Be supported by at least 3 articles
- Represent a shared development, pressure, or shift (technical, economic, regulatory, or social)
- Be described clearly and consistently (short, stable naming)

Do NOT invent trends supported by only one article.
Do NOT describe individual news events as trends.

---

### SENTIMENT RULES
For each article, assign a coarse sentiment reflecting its overall impact on the AI ecosystem:
- Positive: Expands access, capability, opportunity, or growth
- Neutral: Informational or mixed impact
- Negative: Restrictive, harmful, or contractionary impact (e.g. bans, layoffs, legal penalties)

Sentiment should be directional, not emotional or speculative.

---

### OUTPUT FORMAT (JSON ONLY)
Return a valid JSON object with two keys: "trends" and "articleSentiment".

{
  "trends": [
    {
      "trend": "Clear, descriptive trend name",
      "description": "One sentence explaining the shared theme across articles.",
      "article_ids": ["uuid-1", "uuid-2", "uuid-3"]
    }
  ],
  "articleSentiment": [
    {
      "id": "uuid-1",
      "sentiment": "Positive | Neutral | Negative"
    }
  ]
}

---

### IMPORTANT CONSTRAINTS
- Do not assign numbers, weights, or scores.
- Do not summarize individual articles again.
- Do not use hype, predictions, or opinionated language.
- Use only the information present in the provided articles.
`;

const generateWeeklyReport = async () => {
    console.log("Starting weekly trend analysis.");

    try {
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const articles = await prisma.article.findMany({
            where: {
                publishedAt: { gte: sevenDaysAgo },
                curatorScore: { gte: 50 }, 
                category: { not: "AI" }   
            },
            select: {
                id: true,  
                title: true,
                summary: true,
                category: true,
                curatorScore: true
            },
            take: 60 
        });

        if (articles.length < 5) {
            console.log("Not enough high quality articles to generate report, need at least 5+");
            return;
        }

        console.log(`Fetched ${articles.length} high quality articles for analysis.`);


        const contextText = articles.map(a => 
            `[ID: ${a.id}] (${a.category}, Score: ${a.curatorScore}) ${a.title}\nSummary: ${a.summary}`
        ).join("\n\n---\n\n");


        const completion = await openai.chat.completions.create({
            model: "tngtech/deepseek-r1t2-chimera:free", 
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Here are the articles for analysis:\n\n${contextText}` }
            ]
        });

        const rawOutput = completion.choices[0].message.content;
        

        let jsonString = rawOutput.trim();
        jsonString = jsonString.replace(/^[^{]*/, '').replace(/[^}]*$/, ''); 
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
        
        const reportData = JSON.parse(jsonString);


        const savedReport = await prisma.weeklyReport.create({
            data: {
                weekStartDate: sevenDaysAgo,
                weekEndDate: new Date(),
                trends: reportData 
            }
        });

        console.log(`Generated the weekly report (ID: ${savedReport.id})`);
        
        return savedReport;

    } catch (err) {
        console.error("Trend Analysis Failed:", err.message);
    }
};

module.exports = { generateWeeklyReport };
