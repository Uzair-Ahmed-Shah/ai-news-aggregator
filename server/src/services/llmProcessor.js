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

const MODELS = {
  PRIMARY: "tngtech/deepseek-r1t2-chimera:free",
  FALLBACK: "tngtech/deepseek-r1t-chimera:free"
};


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
### 2. CLASSIFICATION RULES

**SENTIMENT** (Choose ONE STRICTLY - DO NOT INVENT NEW TYPES):
Sentiment refers to the article’s stance toward the primary development, not writing tone or emotional language.
- **Positive:** Progress, breakthroughs, growth, successful launches.
- **Neutral:** Factual reporting, analysis, balanced views.
- **Critical:** Risks, failures, lawsuits, ethical concerns, job losses.

**IMPACT TYPE** (Choose ONE STRICTLY - DO NOT INVENT NEW TYPES):
- **Social:** Affects people, jobs, education, or culture.
- **Economic:** Market, funding, business strategy.
- **Technological:** New models, hardware, benchmarks, paper releases.
- **Environmental:** Energy usage, climate impact.
- **Political:** Law, geopolitics, sovereignty, regulation.


**CATEGORY** (Choose ONE STRICTLY - DO NOT INVENT NEW TYPES)
- Research | Product | Business | Policy | Security | Ethics | Society | Hardware

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
    "sentiment": "Positive",
    "impactType": "Social",
    "category": "Research",
    "curatorScore": 0-100,
    "confidence": 0-1,
    "reasoning": "One concise sentence explaining the main score tradeoff."
  }
]

`;

class LlmProcessor {

  async processBatch(articles) {
    if (!articles || articles.length === 0) return [];

    console.log(`🧠 AI Processing Batch: ${articles.length} articles...`);

    const promptData = articles.map(a => ({
      id: a.id,
      title: a.title,
      content: (a.fullContent || a.summary || "").substring(0, 2500) 
    }));

    let results = null;

    try {
      results = await this.callLLM(MODELS.PRIMARY, promptData);
      console.log(`Success with PRIMARY model (${MODELS.PRIMARY})`);
    } catch (err) {
      console.warn(`⚠️ PRIMARY model failed: ${err.message}. Switching to FALLBACK...`);

      try {
        results = await this.callLLM(MODELS.FALLBACK, promptData);
        console.log(`Success with FALLBACK model (${MODELS.FALLBACK})`);
      } catch (fallbackErr) {
        console.error(`❌ BOTH models failed. Skipping batch. Error: ${fallbackErr.message}`);
        return [];
      }
    }

    
    if (results) {
      await this.updateDatabase(results);
    }
  }

  
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

  
  robustJSONParse(text) {
    try {
      let jsonString = text.trim();
      jsonString = jsonString.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
      
      return JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`JSON Parse Failed: ${e.message}`);
    }
  }

  
  async updateDatabase(results) {
    console.log(`💾 Saving ${results.length} analyzed articles to DB...`);
    
    for (const elem of results) {
      
      
      const combinedSummary = Array.isArray(elem.summary) ? elem.summary.join("\n• ") : elem.summary;

      await prisma.article.update({
        where: { id: elem.id },
        data: {
          title: elem.title,
          summary: "• " + combinedSummary,
          curatorScore: elem.curatorScore,
          category: elem.category,
          sentiment: elem.sentiment,
          impactType: elem.impactType
        }
      }).catch(err => console.error(`Failed to update article ${elem.id}: ${err.message}`));
    }
  }
}

module.exports = new LlmProcessor();