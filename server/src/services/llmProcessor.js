const OpenAI = require("openai");
const prisma = require("../lib/prisma");
const { FEED_PROCESSING_PROMPT, DEEP_DIVE_PROMPT } = require("./prompts");
require("dotenv").config();

const apiKey = process.env.GROQ_API_KEY;

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1"
});

const FEED_MODEL = 'llama-3.3-70b-versatile'
const FEED_FALLBACK_MODEL = 'openai/gpt-oss-120b'
const DEEP_DIVE_MODEL = 'llama-3.3-70b-versatile';

const parseJsonFromText = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        // Fallthrough
      }
    }
    
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      const jsonCandidate = text.substring(startIndex, endIndex + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (e3) {
        // Fallthrough
      }
    }

    throw new Error(`Failed to parse JSON: ${text.substring(0, 50)}...`);
  }
};
  
const createChatCompletion = async (model, messages) => {
  return client.chat.completions.create({
    model,
    messages,
    temperature: 0.2
  });
};


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
      const messages = [
        { role: "system", content: FEED_PROCESSING_PROMPT },
        { role: "user", content: JSON.stringify(promptData) }
      ];

      let response;
      try {
        response = await createChatCompletion(FEED_MODEL, messages);
      } catch (err) {
        console.warn(`Primary Model Failed: ${err.message}. Switching to Fallback...`);
        response = await createChatCompletion(FEED_FALLBACK_MODEL, messages);
      }

      const responseText = response?.choices?.[0]?.message?.content || "";
      const parsedResults = parseJsonFromText(responseText);

      if (parsedResults && Array.isArray(parsedResults)) {
         await this.updateDatabase(parsedResults);
      }
    } catch (err) {
      console.error(`ALL Models Failed: ${err.message}`);
      throw err
    }
  }

  async generateDeepAnalysis(article) {
     if (!article || !article.fullContent) return null;

     console.log(`Generating deep dive for: ${article.title}`);

     try {
       const messages = [
         { role: "system", content: DEEP_DIVE_PROMPT },
         { role: "user", content: article.fullContent }
       ];
       const response = await createChatCompletion(DEEP_DIVE_MODEL, messages);
       const responseText = response?.choices?.[0]?.message?.content || "";
       
       let markdownOutput = "";
       const markdownRegex = /"markdown"\s*:\s*(\[[\s\S]*?\])/;
       const match = responseText.match(markdownRegex);
       
       let parsedArray = null;

       if (match && match[1]) {
           try {
              parsedArray = JSON.parse(match[1]);
           } catch (e) {
              console.warn("Regex match found but JSON invalid inside markdown key.");
           }
       } 
       if (!parsedArray) {
           try {
               const parsedResponse = parseJsonFromText(responseText);
               if (parsedResponse.markdown && Array.isArray(parsedResponse.markdown)) {
                 parsedArray = parsedResponse.markdown;
               } else if (parsedResponse.markdown && typeof parsedResponse.markdown === 'string') {
                 markdownOutput = parsedResponse.markdown;
               }
           } catch (e) {
               console.warn("   ⚠️ JSON Parse Failed. Falling back to cleaner.");
           }
       }
       if (parsedArray && Array.isArray(parsedArray)) {
          markdownOutput = parsedArray.join('\n\n');
       }
       if (!markdownOutput) {
           let clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
           if (!clean.trim().startsWith('{')) {
               markdownOutput = clean;
           }
       }
       if (markdownOutput) {
           markdownOutput = markdownOutput.replace(/\\n/g, '\n');
       }
       if (markdownOutput) {
          await prisma.article.update({
             where: { id: article.id },
             data: { deepSummary: markdownOutput }
          });
       }

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