const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const prisma = require("../lib/prisma");
const { FEED_PROCESSING_PROMPT, DEEP_DIVE_PROMPT } = require("./prompts");
require("dotenv").config();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const feedModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  systemInstruction: FEED_PROCESSING_PROMPT,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
             id: { type: SchemaType.STRING },
             title: { type: SchemaType.STRING },
             summary: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
             sentiment: { type: SchemaType.STRING },
             impactType: { type: SchemaType.STRING },
             category: { type: SchemaType.STRING },
             curatorScore: { type: SchemaType.NUMBER },
          },
          required: ["id", "title", "summary", "sentiment", "impactType", "category", "curatorScore"]
        }
    }
  }
});

const deepDiveModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  systemInstruction: DEEP_DIVE_PROMPT,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        markdown: { type: SchemaType.STRING }
      },
      required: ["markdown"]
    }
  }
});


class LlmProcessor {

  async processBatch(articles) {
    if (!articles || articles.length === 0) return [];

    console.log(`Processing batch of ${articles.length} articles`);

    const promptData = articles.map(a => ({
      id: a.id,
      title: a.title,
      content: (a.fullContent || a.summary || "").substring(0, 5000) 
    }));

    try {
      const result = await feedModel.generateContent(JSON.stringify(promptData));
      const responseText = result.response.text();
      
      const parsedResults = JSON.parse(responseText);

      if (parsedResults && Array.isArray(parsedResults)) {
         await this.updateDatabase(parsedResults);
      }
    } catch (err) {
      console.error(`Gemini batch failed: ${err.message}`);
    }
  }

  async generateDeepAnalysis(article) {
     if (!article || !article.fullContent) return null;

     console.log(`Generating deep dive for: ${article.title}`);

     try {
       const result = await deepDiveModel.generateContent(article.fullContent);
       const responseText = result.response.text();
       const parsedResponse = JSON.parse(responseText);
       const markdownOutput = parsedResponse.markdown || responseText;

          await prisma.article.update({
          where: { id: article.id },
          data: { deepSummary: markdownOutput }
       });

       return markdownOutput;
     } catch (err) {
       console.error(`Deep dive failed: ${err.message}`);
       return null;
     }
  }

  async updateDatabase(results) {
    console.log(`Saving ${results.length} articles to database`);
    
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