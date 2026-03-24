import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedResponse, SeoResult, GroundingSource } from "../types";

const processEnvApiKey = process.env.API_KEY;

// Strict target for 2500-4000 words to ensure depth
const TARGET_CHAR_COUNT = 30000;

const extractJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[1] || match[0]);
      } catch (innerE) {
        throw new Error("Could not parse JSON from AI response.");
      }
    }
    throw new Error("AI response did not contain valid JSON.");
  }
};

export const generateSeoContent = async (
  topic: string,
  focusKeyword: string,
  primaryKeyword: string,
  viralHook: string,
  gapAnalysis: string,
  affiliateLink: string,
  crossPromotion: string,
  customTone: string,
  countries: string[],
  websiteContext: string,
  defaultTone: string,
  language: string,
  onProgress: (partialContent: string, progress: number) => void,
  apiKeyOverride?: string
): Promise<GeneratedResponse> => {
  const apiKey = apiKeyOverride || processEnvApiKey;
  
  if (!apiKey) {
    return { result: null, sources: [], error: "API Key is missing." };
  }

  const ai = new GoogleGenAI({ apiKey });
  const countryString = countries.includes('Worldwide') ? "Global trends" : countries.join(", ");
  
  const isBangla = language.includes("Bangla");
  const expertHeader = isBangla ? "💡 ব্যক্তিগত অভিজ্ঞতা ও বিশ্লেষণ" : "💡 Expert Analysis & Experience";
  const proTipHeader = isBangla ? "✅ প্রো টিপ" : "✅ Pro Tip";

  // NARRATIVE DESIGN PROMPT
  const designInstruction = `
    **STRICT ARCHITECTURAL RULES (অবশ্যই পালনীয়)**:
    1. **WRAPPER**: Wrap the entire article content inside <div class="icontent-article">.
    2. **TITLE (H1)**: Start with a catchy <h1> title. Avoid generic "Ultimate Guide" titles.
    3. **LEAD HOOK**: Provide a 2-3 line engaging introduction inside <div class="lead-hook"><p>...</p></div>. **CRITICAL**: DO NOT start with "In the digital landscape of...", "In the fast-paced world of...", or "Welcome to...". Start with a direct question, a shocking stat, or a relatable problem.
    4. **SEMANTIC HTML**: Use <h2>, <h3>, <h4>. 
    5. **NATURAL FLOW**: Do not force exactly 20 sections. Use as many as needed for a natural flow (8-15 is often better than 20). Avoid "Perfect" symmetry.
    6. **SHORT PARAGRAPHS**: Each paragraph MUST be 2-3 lines long.
    7. **EXPERT CALLOUT**: Use <div class="expert-callout"><h3>${expertHeader}</h3><p>...</p></div>.
    8. **PRO TIP**: Use <div class="pro-tip"><h3>${proTipHeader}</h3><p>...</p></div>.
    9. **TABLES**: ALWAYS wrap <table> inside <div class="table-wrapper">. Example: <div class="table-wrapper"><table>...</table></div>.
    10. **IMAGE CAPTIONS**: If you describe an image, use <span class="img-caption">Caption text here</span> below the image placeholder.
    11. **IMAGE PLACEHOLDERS**: Throughout the article, where an image is needed (e.g., after a major section), add a placeholder in Bengali: <div class="image-placeholder">ইমেজ লাগবে এই খানে। বিষয় : [Describe the image subject here]</div>.
    12. **NO MARKDOWN**: Use HTML tags only.
    13. **HUMAN TOUCH**: Occasionally use shorter, punchy sentences. Use transitions that sound like a conversation, not a textbook.
  `;

  const languageStyleInstruction = isBangla 
    ? `**STYLE: AUTHENTIC BANGLADESHI BLOGGER (চলিত ও সাবলীল)**
       - **EEAT & HUMANITY**: AI-এর মতো যান্ত্রিক ভাষা পরিহার করুন। "আমি গত ৩ বছর ধরে..." এই ধরণের কাল্পনিক বুলি না বলে বাস্তবসম্মত সমস্যা নিয়ে কথা বলুন। যেমন: "আমি যখন প্রথম এই টুলটি ব্যবহার করি, তখন আমার এই সমস্যাটি হয়েছিল..."।
       - **NO CLICHÉS**: "ডিজিটাল ল্যান্ডস্কেপ", "বিপ্লব ঘটাবে", "রাজত্ব করছে" - এই ধরণের ইংরেজি থেকে সরাসরি অনুবাদ করা ভারি শব্দ এড়িয়ে চলুন। 
       - **TONE**: একজন বড় ভাই বা বন্ধুর মতো পরামর্শ দিন। কিছু জায়গায় নিজের 'বায়াস' বা পছন্দ-অপছন্দ প্রকাশ করুন। সব কিছু 'নিখুঁত' দেখানোর প্রয়োজন নেই।`
    : `**STYLE: RAW & AUTHENTIC EXPERT (NO AI CLICHÉS)**
       - **FORBIDDEN PHRASES**: "In the digital landscape of...", "reigned supreme", "cracks in the monarchy", "radical transparency", "core value proposition", "delve into", "unleash", "comprehensive guide".
       - **HUMAN PERSPECTIVE**: Write with a slight bias. If a tool has a bad UI, say "It looks like it was designed in 1998" instead of "The user interface presents some challenges."
       - **SENTENCE VARIETY**: Mix very short sentences with longer ones. AI tends to keep sentence length uniform.
       - **REAL SCENARIOS**: Use "I remember trying to set this up at 2 AM..." instead of "I have extensive experience in setup processes."`;

  try {
    // --- STEP 1: DEEP RESEARCH & MAPPING ---
    const analysisPrompt = `
      Perform professional SEO research based on the user's input:
      Topic: "${topic}"
      Primary Keyword (MAIN FOCUS): "${primaryKeyword}"
      Secondary Focus Keyword: "${focusKeyword}"
      Context: ${websiteContext} in ${countryString}.
      
      CRITICAL TASK: Do not just use the user's topic as the title. Analyze the topic and keyword to generate a HIGHLY OPTIMIZED, catchy, and SEO-friendly Title, Meta Description, and Tags. 
      
      THE PRIMARY KEYWORD "${primaryKeyword}" MUST BE THE ABSOLUTE FOCUS OF THE SEO ANALYSIS AND CONTENT STRATEGY.
      
      Identify current trends and 3-4 LSI Keywords.
      
      Task: Create a natural, non-robotic roadmap for a 3000-4000 word authority article.
      
      STRICT REQUIREMENTS:
      - **seoTitle**: Must be an IMPROVED, SEO-optimized version of the topic. Catchy, human-written style. Avoid "Ultimate Guide to [Topic] in 2026". Length should be 50-65 characters.
      - **metaDescription**: 140-160 characters. Optimized for CTR. No AI fluff.
      - **metaKeywords**: Generate a list of highly relevant, optimized keywords based on your analysis.
      - **websiteTags**: Generate relevant tags for the website.
      
      **SEO AUDIT (Perform these checks)**:
      1. Title length (50-65 chars)
      2. Power words in Title (e.g., "Proven", "Shocking", "Ultimate", "Secret")
      3. Keyword in Title
      4. Meta description length (140-160 chars)
      5. Keyword in Meta desc
      6. Keyword in URL Slug
      7. Keyword Density (Target 1-2%)
      8. KW in first paragraph
      9. Cannibalization Check (Ensure uniqueness)
     10. Readability audit (Flesch-Kincaid)
     11. Transition words usage
     12. Internal linking strategy
     13. External linking strategy
      
      RETURN ONLY A JSON OBJECT:
      {
        "seoTitle": "string",
        "seoSlug": "string",
        "metaDescription": "string",
        "metaKeywords": "string",
        "websiteTags": ["string"],
        "analysisSummary": "string",
        "articleOutline": "string",
        "lsiKeywords": ["string"],
        "seoAudit": {
          "titleLength": "string",
          "powerWords": "string",
          "keywordInTitle": "string",
          "metaDescLength": "string",
          "keywordInMeta": "string",
          "keywordInSlug": "string",
          "keywordDensity": "string",
          "keywordInFirstPara": "string",
          "cannibalizationCheck": "string",
          "readabilityAudit": "string",
          "transitionWords": "string",
          "internalLinking": "string",
          "externalLinking": "string"
        }
      }
    `;

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: analysisPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    if (!analysisResponse.text) throw new Error("Research engine failed.");
    const metadata = extractJson(analysisResponse.text);

    const groundingChunks = analysisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter(chunk => chunk.web?.uri && chunk.web?.title)
      .map(chunk => ({ uri: chunk.web!.uri!, title: chunk.web!.title! }));

    // --- STEP 2: GENERATING THE AUTHORITY ARTICLE ---
    const writingPrompt = `
      Write a Masterpiece Authority Article (MINIMUM 2500-4000 WORDS).
      
      Website: ${websiteContext}
      Topic: ${topic} 
      Primary Keyword (MAIN FOCUS): ${primaryKeyword}
      Secondary Focus Keyword: ${focusKeyword}
      LSI Keywords to include: ${metadata.lsiKeywords?.join(", ")}
      
      **SEO CONTENT RULES (অবশ্যই পালনীয়)**:
      1. **TITLE**: Use the exact optimized title: "${metadata.seoTitle}".
      2. **FIRST PARAGRAPH**: The primary keyword "${primaryKeyword}" MUST appear in the first 100 words (first paragraph).
      3. **KEYWORD DENSITY**: Maintain a natural keyword density of 1-2% for "${primaryKeyword}".
      4. **TRANSITION WORDS**: Use plenty of transition words (e.g., "However", "In addition", "Consequently", "এর ফলে", "তাছাড়াও") to improve readability.
      5. **INTERNAL/EXTERNAL LINKS**: Add placeholders for internal and external links where relevant. Example: <a href="#" class="internal-link">[Internal Link: Related Topic]</a>.
      6. **READABILITY**: Ensure high readability (Flesch-Kincaid style) with short sentences and clear headings.
      7. **POWER WORDS**: Use the power words identified in the SEO audit throughout the headers and sub-headers.
      
      ${designInstruction}
      ${languageStyleInstruction}
      
      ARTICLE STRUCTURE:
      1. <div class="icontent-article">
      2. <h1> ${metadata.seoTitle} </h1>
      3. <div class="lead-hook"><p><strong>Focus Keyword:</strong> ${primaryKeyword} - ${viralHook} </p></div>
      4. Long Narrative Introduction (<p> tags, 2-3 lines each). **Must include "${primaryKeyword}" here.**
      5. Massive <h2>, <h3>, <h4> sections based on: ${metadata.articleOutline}.
      6. Include <div class="expert-callout">, <div class="pro-tip">, and <table> where appropriate.
      7. Detailed FAQ Section (using <h3> and <p>).
      8. Conclusion.
      9. </div>
      
      IMPORTANT: 
      - The PRIMARY KEYWORD "${primaryKeyword}" must be naturally woven throughout the text as the main subject.
      - Talk about "${gapAnalysis}" in detail.
      - Use EEAT principles: add personal experience and expert analysis.
      - Ensure NO Markdown is used.
    `;

    const streamResult = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: writingPrompt,
      config: {
        maxOutputTokens: 8192,
      }
    });

    let fullArticleHtml = "";
    for await (const chunk of streamResult) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullArticleHtml += chunkText;
        const currentProgress = Math.min(99, (fullArticleHtml.length / TARGET_CHAR_COUNT) * 100);
        onProgress(fullArticleHtml, currentProgress);
      }
    }

    let cleanHtml = fullArticleHtml.replace(/```html/gi, '').replace(/```/g, '').trim();
    
    // Post-processing to ensure no Markdown hashtags remain
    cleanHtml = cleanHtml.replace(/^#\s+(.*)/gm, '<h1>$1</h1>');
    cleanHtml = cleanHtml.replace(/^##\s+(.*)/gm, '<h2>$1</h2>');
    cleanHtml = cleanHtml.replace(/^###\s+(.*)/gm, '<h3>$1</h3>');
    cleanHtml = cleanHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const finalResult: SeoResult = {
      ...metadata,
      articleContent: cleanHtml
    };

    return { 
      result: finalResult, 
      sources: Array.from(new Map(sources.map(s => [s.uri, s])).values()) 
    };

  } catch (error: any) {
    return { result: null, sources: [], error: error.message };
  }
};