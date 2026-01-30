const OpenAI = require("openai");
const prisma = require("../lib/prisma"); // Adjust path if needed
require("dotenv").config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AI News Aggregator",
  },
});

// 1. Models Configuration
const MODELS = {
  PRIMARY: "tngtech/deepseek-r1t2-chimera:free",  // Fast, clean
  FALLBACK: "tngtech/deepseek-r1t-chimera:free"   // Slower, reliable backup
};

// 2. The "Senior Journalist" System Prompt
const SYSTEM_PROMPT = `
You are a Senior Journalist analyzing high-signal AI news across the global ecosystem.
Your task is to identify developments that materially change how AI is built, governed, used, or experienced — not hype or speculation.

---

### IMPORTANCE DEFINITION
A news item is important if it produces at least one of the following:
- Measurable societal or labor change
- Economic or industry-wide effects
- Regulatory or legal precedent
- Shifts in power, access, or control of AI systems

Non-technical or incremental developments may still be highly important if their impact is real and durable.

---

### SCORING FRAMEWORK (0–100, WEIGHTED)
Evaluate each dimension independently.

**1. NOVELTY (30%)**  
Meaningful change in the current state.  
High: first-of-its-kind deployment, new model class, new law, or clear expansion.  
Low: repackaging, opinions, recycled narratives.

**2. IMPACT & SCALE (40%)**  
Size and durability of real-world consequences.  
High: affects industries, large populations, or governance structures.  
Low: localized or short-term effects.

**3. SUBSTANCE (20%)**  
Quality of verifiable detail.  
High: data, benchmarks, legal text, or primary reporting.  
Low: vague claims or promotional framing.

**4. TRUST & GROUNDING (10%)**  
Evidence and sourcing over brand reputation.  
High: official documentation or multiple confirmations.  
Low: single-source or unclear attribution.

---

### CATEGORY
Choose ONE: Research | Product | Industry | Economic/Labor | Policy | Society | Hardware

---

### SUMMARY RULES
Write exactly **3 bullet points**.

Each bullet should be **1–2 sentences**, written in a clear, neutral journalistic tone that invites reading without hype.
Bullets should:
- Describe what happened using concrete facts
- Explain why it matters or what it changes
- Add brief context or implications where helpful

Avoid marketing language, speculation, dramatic adjectives, or opinionated phrasing.
Do not sound conversational or robotic.

---

### OUTPUT FORMAT (JSON ONLY)
Return a valid JSON array. No markdown, no extra text.

[
  {
    "id": "original-uuid",
    "title": "Clear, factual, non-hype headline",
    "summary": [
      "Factual description of the development with necessary context.",
      "Primary impact or consequence for people, industry, or governance.",
      "Scope, limitation, or uncertainty that frames its significance."
    ],
    "category": "Policy",
    "curatorScore": 0-100,
    "confidence": 0-1,
    "reasoning": "One concise sentence explaining the main score tradeoff."
  }
]

`;

class LlmProcessor {
  /**
   * Main Entry Point: Processes a batch of articles with Fallback Logic
   */
  async processBatch(articles) {
    if (!articles || articles.length === 0) return [];

    console.log(`🧠 AI Processing Batch: ${articles.length} articles...`);

    // Prepare Data for Prompt
    const promptData = articles.map(a => ({
      id: a.id,
      title: a.title,
      // Provide first 1500 chars of context (User requested increase from 1000 suitable for lengthy intros)
      content: (a.summary || a.fullContent || "").substring(0, 1400) 
    }));

    let results = null;

    // 1️⃣ Try PRIMARY Model
    try {
      results = await this.callLLM(MODELS.PRIMARY, promptData);
      console.log(`✅ Success with PRIMARY model (${MODELS.PRIMARY})`);
    } catch (err) {
      console.warn(`⚠️ PRIMARY model failed: ${err.message}. Switching to FALLBACK...`);
      
      // 2️⃣ Try FALLBACK Model
      try {
        results = await this.callLLM(MODELS.FALLBACK, promptData);
        console.log(`✅ Success with FALLBACK model (${MODELS.FALLBACK})`);
      } catch (fallbackErr) {
        console.error(`❌ BOTH models failed. Skipping batch. Error: ${fallbackErr.message}`);
        return [];
      }
    }

    // 3️⃣ Update Database
    if (results) {
      await this.updateDatabase(results);
    }
  }

  /**
   * Helper: Calls OpenRouter and Parses JSON
   */
  async callLLM(modelName, data) {
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "user",
          content: SYSTEM_PROMPT + "\n\nDATA TO ANALYZE:\n" + JSON.stringify(data)
        }
      ]
    });

    const rawOutput = completion.choices[0].message.content;
    return this.robustJSONParse(rawOutput);
  }

  /**
   * Helper: Robust JSON Parser (handles markdown & chatter)
   */
  robustJSONParse(text) {
    try {
      let jsonString = text.trim();
      // Remove chatter before/after JSON array
      jsonString = jsonString.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
      // Remove markdown code blocks
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
      
      return JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`JSON Parse Failed: ${e.message}`);
    }
  }

  /**
   * Helper: Writes Back to DB
   */
  async updateDatabase(results) {
    console.log(`💾 Saving ${results.length} analyzed articles to DB...`);
    
    for (const res of results) {
      // Find the article to ensure it exists
      // Note: We'll join the bullet points into a single string for the standard 'summary' field
      // Or we can simple store the first point. 
      // Let's store the full array as a joined string for now.
      
      const combinedSummary = Array.isArray(res.summary) ? res.summary.join("\n• ") : res.summary;

      await prisma.article.update({
        where: { id: res.id },
        data: {
          title: res.title, // AI cleaned title
          summary: "• " + combinedSummary,
          curatorScore: res.curatorScore,
          category: res.category,
          // We can add 'reasoning' to keywords or a new field later
          keywords: { push: `AI_SCORE_${res.curatorScore}` } 
        }
      }).catch(err => console.error(`Failed to update article ${res.id}: ${err.message}`));
    }
  }
}

module.exports = new LlmProcessor();