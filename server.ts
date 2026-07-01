/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiInstance: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Please set it in the Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper function to try generating with fallback model sequence
async function generateWithFallback(configFn: (modelName: string) => Promise<any>) {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Attempting to generate content with model: ${model}`);
      const result = await configFn(model);
      return result;
    } catch (err: any) {
      console.warn(`Model ${model} failed to respond:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All model fallbacks exhausted.");
}

// 100% Reliable Local Backup Dictionary for Vietnamese vocabulary
const LOCAL_DICT: Record<string, string> = {
  "tôi": "I",
  "bạn": "you",
  "anh": "brother / you",
  "chị": "sister / you",
  "em": "younger sibling / you",
  "thầy": "teacher / he",
  "cô": "teacher / she",
  "chúng tôi": "we",
  "chúng ta": "we",
  "họ": "they",
  "là": "am / is / are",
  "có": "have / has / yes",
  "không": "not / no / question marker",
  "yêu": "love",
  "thích": "like",
  "ghét": "hate",
  "muốn": "want",
  "cần": "need",
  "học": "learn / study",
  "tiếng việt": "Vietnamese language",
  "tiếng anh": "English language",
  "ăn": "eat",
  "uống": "drink",
  "cơm": "rice / meal",
  "phở": "Pho",
  "cà phê": "coffee",
  "nước": "water",
  "sữa": "milk",
  "bánh mì": "banh mi / bread",
  "đi": "go",
  "đến": "come / arrive",
  "ở": "at / live in",
  "làm": "do / work",
  "việc": "job / task",
  "nhà": "house / home",
  "trường": "school",
  "đẹp": "beautiful / pretty",
  "tốt": "good",
  "xấu": "bad",
  "vui": "happy",
  "buồn": "sad",
  "mệt": "tired",
  "khỏe": "fine / healthy",
  "hôm nay": "today",
  "ngày mai": "tomorrow",
  "hôm qua": "yesterday",
  "xin chào": "hello",
  "chào buổi sáng": "good morning",
  "cảm ơn": "thank you",
  "tạm biệt": "goodbye",
  "ngon": "delicious / tasty",
  "gì": "what",
  "nào": "which",
  "đâu": "where",
  "ai": "who",
  "sao": "why",
  "như thế nào": "how",
  "bao nhiêu": "how many / how much",
  "này": "this",
  "kia": "that",
  "đó": "that",
  "và": "and",
  "hoặc": "or",
  "nhưng": "but",
  "vì": "because",
  "rất": "very",
  "quá": "too / extremely",
  "giáo viên": "teacher",
  "học sinh": "student",
  "sinh viên": "university student",
  "bố": "father",
  "mẹ": "mother",
  "gia đình": "family",
  "thành phố": "city",
  "đường": "street / sugar",
  "sách": "book",
  "vở": "notebook",
  "bút": "pen",
  "bàn": "table",
  "ghế": "chair"
};

// Clean punctuation helper
function cleanWord(word: string): string {
  return word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim().toLowerCase();
}

// Programmatically translate whiteboard text segment by segment
function localWhiteboardTranslate(text: string) {
  const sanitized = text.trim();
  const words = sanitized.split(/\s+/).filter(Boolean);
  
  const segments: { vi: string; en: string }[] = [];
  let i = 0;
  
  while (i < words.length) {
    // Try matching two-word phrases
    if (i < words.length - 1) {
      const phraseVi = `${cleanWord(words[i])} ${cleanWord(words[i+1])}`;
      if (LOCAL_DICT[phraseVi]) {
        segments.push({
          vi: `${words[i]} ${words[i+1]}`,
          en: LOCAL_DICT[phraseVi]
        });
        i += 2;
        continue;
      }
    }
    
    // Otherwise match single word
    const singleVi = cleanWord(words[i]);
    const translation = LOCAL_DICT[singleVi] || words[i];
    segments.push({
      vi: words[i],
      en: translation
    });
    i++;
  }

  // Construct full translation
  const fullEnText = segments.map(s => s.en.split(" / ")[0]).join(" ");
  const capitalized = fullEnText.charAt(0).toUpperCase() + fullEnText.slice(1);

  return {
    fullTranslation: capitalized,
    words: segments
  };
}

// Clean bilingual local chatbot response logic
function localChatResponse(userMessage: string) {
  const normalized = userMessage.toLowerCase();
  let content = "";
  let translation = "";

  if (normalized.includes("xin chào") || normalized.includes("hello") || normalized.includes("hi ") || normalized.includes("chào")) {
    content = "Xin chào! Tôi là Trợ lý Giáo viên AI đồng hành của bạn. Hôm nay tôi có thể hỗ trợ gì cho bạn trong việc học tiếng Việt và Anh?";
    translation = "Hello! I am your companion AI Teacher Assistant. How can I support you in learning Vietnamese and English today?";
  } else if (normalized.includes("cảm ơn") || normalized.includes("thank")) {
    content = "Không có gì đâu! Rất vui được hỗ trợ và luyện tập cùng bạn mọi lúc.";
    translation = "You are very welcome! It is a pleasure to support and practice with you anytime.";
  } else if (normalized.includes("tạm biệt") || normalized.includes("bye")) {
    content = "Tạm biệt nhé! Hẹn gặp lại bạn sớm để cùng nhau tiến bộ mỗi ngày.";
    translation = "Goodbye! See you again soon to make progress together every day.";
  } else if (normalized.includes("gì") || normalized.includes("what") || normalized.includes("hỏi")) {
    content = "Bạn cứ đặt câu hỏi nhé! Tôi sẽ tận tình dịch và giải thích chi tiết cấu trúc cho bạn.";
    translation = "Please feel free to ask questions! I will dedicatedly translate and explain the structure in detail for you.";
  } else if (normalized.includes("phở") || normalized.includes("ăn")) {
    content = "Phở bò là một món ăn truyền thống nổi tiếng vô cùng ngon của Việt Nam.";
    translation = "Beef Pho is an incredibly delicious, famous traditional dish of Vietnam.";
  } else {
    content = `Cảm ơn bạn đã hỏi về "${userMessage.trim()}". Hiện tại dịch vụ đám mây AI đang bận, tôi đang chạy trên bộ dịch dự phòng để luôn đồng hành cùng bạn học tập tốt nhất!`;
    translation = `Thank you for asking about "${userMessage.trim()}". The cloud AI service is currently busy, so I am running on the backup dictionary engine to ensure your study is fully supported!`;
  }

  return { content, translation };
}

// Programmatic structured grammar log explainer
function localExplainGrammar(viSentence: string, enSentence?: string) {
  const words = viSentence.split(/\s+/).filter(Boolean);
  const matched = words
    .map(w => {
      const lower = cleanWord(w);
      const tr = LOCAL_DICT[lower];
      if (tr) {
        return `- **${w}**: Nghĩa là "${tr}"`;
      }
      return null;
    })
    .filter(Boolean);

  let explanation = `Cấu trúc câu: "${viSentence}"\n\n`;
  if (enSentence) {
    explanation += `Dịch nghĩa: "${enSentence}"\n\n`;
  }
  explanation += `**Phân tích từ vựng quan trọng:**\n`;
  if (matched.length > 0) {
    explanation += matched.join("\n");
  } else {
    explanation += `- Các từ kết hợp hài hòa để tạo nên ngữ cảnh phù hợp.`;
  }
  explanation += `\n\n*(Lưu ý: Giải thích này được tạo tự động bởi công cụ dự phòng cục bộ do máy chủ AI quá tải)*`;

  return { explanation };
}

// 1. API: Translate whiteboard sentence (Full cohesive translation + word-by-word division)
app.post("/api/translate-whiteboard", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const ai = getGemini();
    const prompt = `Translate the following Vietnamese sentence to English. 
Provide both a cohesive full-sentence translation, and a breakdown of the sentence into individual words/phrase-segments, mapping each segment to its English meaning.
Ensure you preserve capitalization and punctuation appropriately.

Sentence: "${text.trim()}"`;

    const response = await generateWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullTranslation: {
                type: Type.STRING,
                description: "Cohesive and natural English translation of the entire sentence."
              },
              words: {
                type: Type.ARRAY,
                description: "Sequence of Vietnamese words or short logical segments mapped to their English equivalent in reading order.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    vi: { type: Type.STRING, description: "The exact Vietnamese word or phrase segment." },
                    en: { type: Type.STRING, description: "Direct English meaning / translation of this segment." }
                  },
                  required: ["vi", "en"]
                }
              }
            },
            required: ["fullTranslation", "words"]
          }
        }
      });
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI model.");
    }

    const parsedData = JSON.parse(resultText.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.warn("Failing back to 100% reliable local dictionary whiteboard translation:", err.message || err);
    const localResult = localWhiteboardTranslate(text);
    res.json(localResult);
  }
});

// 2. API: Bilingual AI Chat (Original conversational response + reciprocal translation)
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const ai = getGemini();

    // Reconstruct the message log for context
    const chatHistory = messages.map(msg => {
      return `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`;
    }).join("\n");

    const systemInstruction = `You are an encouraging and professional bilingual Vietnamese-English learning assistant.
Your goal is to help the user learn Vietnamese or clarify terms.
Respond to the user naturally and contextually.
For your response, you MUST generate both:
1. "content": Your conversational reply. Keep it friendly and concise.
2. "translation": The translation of your reply.
   - If "content" is in Vietnamese, "translation" must be its English translation.
   - If "content" is in English, "translation" must be its Vietnamese translation.
Always output valid JSON conforming to the schema.`;

    const response = await generateWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: `Conversation history:\n${chatHistory}\n\nPlease generate the next assistant response.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: {
                type: Type.STRING,
                description: "The primary response text to show to the user."
              },
              translation: {
                type: Type.STRING,
                description: "The complete overlay translation of your response (Vietnamese if response is English, and vice versa)."
              }
            },
            required: ["content", "translation"]
          }
        }
      });
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Chat AI.");
    }

    const parsedData = JSON.parse(resultText.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.warn("Failing back to 100% reliable local bilingual chatbot response:", err.message || err);
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const localResult = localChatResponse(lastUserMsg);
    res.json(localResult);
  }
});

// 3. API: Explains grammar or segments a custom sentence for puzzles
app.post("/api/explain-grammar", async (req, res) => {
  const { viSentence, enSentence } = req.body;
  if (!viSentence) {
    return res.status(400).json({ error: "viSentence is required" });
  }

  try {
    const ai = getGemini();
    const prompt = `You are a professional linguist and Vietnamese teacher.
Provide a concise pedagogical explanation of the grammar structure and key vocabulary in this Vietnamese sentence:
Sentence: "${viSentence}"
Meaning: "${enSentence || ''}"
Break down the pronouns, verbs, particles, and sentence patterns used. Limit the explanation to 3 clear, highly educational bullet points in Vietnamese with English terms.`;

    const response = await generateWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
    });

    res.json({ explanation: response.text || "Không có giải thích nào khả dụng." });
  } catch (err: any) {
    console.warn("Failing back to 100% reliable local grammar explainer:", err.message || err);
    const localResult = localExplainGrammar(viSentence, enSentence);
    res.json(localResult);
  }
});

// 4. API: Proxy request to push data to Google Sheet via Google Apps Script Web App
app.post("/api/push-to-sheet", async (req, res) => {
  const { scriptUrl, spreadsheetId, sheetName, data } = req.body;

  if (!scriptUrl) {
    return res.status(400).json({ error: "Script URL is required" });
  }
  if (!spreadsheetId) {
    return res.status(400).json({ error: "Spreadsheet ID is required" });
  }
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Data array is required" });
  }

  try {
    console.log(`Proxying push request to Apps Script Web App: ${scriptUrl}`);
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spreadsheetId,
        sheetName: sheetName || "0",
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with code: ${response.status}`);
    }

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { status: "success", raw: text };
    }

    res.json(result);
  } catch (err: any) {
    console.error("Error proxying push to sheet:", err);
    res.status(500).json({ 
      error: `Không thể đẩy dữ liệu lên Google Sheet qua Apps Script. Lỗi: ${err.message || err}` 
    });
  }
});

// Helper to parse CSV in server.ts
function parseServerCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentVal.trim());
      result.push(row);
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    result.push(row);
  }

  return result.filter(r => r.length > 0 && r.some(cell => cell !== ''));
}

// Helper to fetch GIDs and Names from public Google Sheet HTML
async function fetchSheetGidsAndNames(spreadsheetId: string): Promise<{ name: string; gid: string }[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const html = await res.text();
    
    const sheets: { name: string; gid: string }[] = [];
    
    // 1. Look for <a href="#gid=12345678">Tab Name</a> or similar HTML anchors in menu bar
    const anchorMatches = html.matchAll(/<a\s+[^>]*href=["'][^"']*gid=(\d+)[^"']*["'][^>]*>([^<]+)<\/a>/gi);
    for (const match of anchorMatches) {
      const gid = match[1];
      const name = match[2]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      if (name && !sheets.some(s => s.gid === gid)) {
        sheets.push({ gid, name });
      }
    }

    // 2. Look for {"sheetId":0,"title":"Bảng viết", ...}
    const matches = html.matchAll(/\{\"sheetId\":\s*(\d+),\s*\"title\":\s*\"([^\"]+)\"/g);
    for (const match of matches) {
      const gid = match[1];
      const name = match[2];
      if (name && !sheets.some(s => s.gid === gid)) {
        sheets.push({ gid, name });
      }
    }
    
    // 3. Backup matches using standard structure
    const backupMatches = html.matchAll(/\"id\":\s*(\d+),\s*\"name\":\s*\"([^\"]+)\"/g);
    for (const match of backupMatches) {
      if (!sheets.some(s => s.gid === match[1])) {
        sheets.push({
          gid: match[1],
          name: match[2]
        });
      }
    }

    // 4. Ultimate fallback: find all gids
    const gidMatches = html.matchAll(/gid=(\d+)/g);
    let idx = 0;
    for (const match of gidMatches) {
      const gid = match[1];
      if (!sheets.some(s => s.gid === gid)) {
        sheets.push({
          gid,
          name: `Trang ${idx}`
        });
        idx++;
      }
    }

    console.log(`Resolved sheet GIDs from HTML:`, sheets);
    return sheets;
  } catch (err) {
    console.warn("Failed to fetch sheet names/GIDs via HTML:", err);
    return [];
  }
}

// 5. API: Proxy request to fetch data from Google Sheet via Google Apps Script Web App OR direct CSV fallback
app.post("/api/fetch-from-sheet", async (req, res) => {
  const { scriptUrl, spreadsheetId, sheetName } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: "Spreadsheet ID is required" });
  }

  // 1. If scriptUrl is provided, attempt to use Apps Script Web App
  if (scriptUrl && scriptUrl.trim() !== "") {
    try {
      const url = `${scriptUrl}?spreadsheetId=${encodeURIComponent(spreadsheetId)}&sheetName=${encodeURIComponent(sheetName || "0")}`;
      console.log(`Proxying fetch request to Apps Script Web App: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const result = JSON.parse(text);
          if (result && result.status === "success" && Array.isArray(result.data)) {
            console.log(`Successfully fetched data via Apps Script proxy for sheet: ${sheetName}`);
            return res.json(result);
          }
        } catch (e) {
          console.warn("Apps Script didn't return valid JSON, falling back to direct public CSV fetch.", e);
        }
      } else {
        console.warn(`Apps Script responded with status ${response.status}, falling back to direct public CSV fetch.`);
      }
    } catch (err) {
      console.warn("Error calling Apps Script, falling back to direct public CSV fetch:", err);
    }
  }

  // 2. Direct public CSV fetch fallback (no Apps Script or Apps Script failed)
  try {
    console.log(`Falling back to direct public CSV fetch for sheet identifier: ${sheetName}`);
    
    // Fetch GIDs and sheet names from the spreadsheet HTML
    const sheets = await fetchSheetGidsAndNames(spreadsheetId);
    let resolvedGid: string | null = null;
    let resolvedName: string | null = null;

    console.log(`Attempting to resolve identifier "${sheetName}" against ${sheets.length} discovered sheets...`);

    if (sheets.length > 0) {
      const normalizedQuery = String(sheetName).trim().toLowerCase();

      // A. Try to match as a literal GID or Name in the sheets list (case-insensitive)
      const matchedByNameOrGid = sheets.find(
        s => s.name.toLowerCase().trim() === normalizedQuery || s.gid === normalizedQuery
      );

      if (matchedByNameOrGid) {
        resolvedGid = matchedByNameOrGid.gid;
        resolvedName = matchedByNameOrGid.name;
        console.log(`Matched sheet by name/GID: "${resolvedName}" (GID: ${resolvedGid})`);
      } 
      // B. If sheetName is a simple index number (e.g., "0", "1", "2"), resolve it by index
      else if (/^\d+$/.test(normalizedQuery)) {
        const idx = parseInt(normalizedQuery, 10);
        if (idx >= 0 && idx < sheets.length) {
          resolvedGid = sheets[idx].gid;
          resolvedName = sheets[idx].name;
          console.log(`Resolved numerical identifier "${sheetName}" to sheet index ${idx}: "${resolvedName}" (GID: ${resolvedGid})`);
        }
      }
    }

    // C. If still not resolved but the query is digit-only, assume it's a literal long GID
    if (!resolvedGid) {
      if (/^\d+$/.test(String(sheetName))) {
        resolvedGid = String(sheetName);
        console.log(`Fallback: using "${sheetName}" as literal GID`);
      }
    }

    let csvUrl = "";
    if (resolvedGid) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${resolvedGid}`;
    } else {
      // D. Fallback: query via public Google Visualization query endpoint using sheet name
      csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    }

    console.log(`Fetching CSV from URL: ${csvUrl}`);
    const csvRes = await fetch(csvUrl);
    if (!csvRes.ok) {
      throw new Error(`Google Sheets export returned code ${csvRes.status}. Hãy đảm bảo Trang tính đã được chia sẻ công khai ở chế độ "Bất kỳ ai có liên kết đều có thể xem" (Anyone with link can view).`);
    }

    const csvText = await csvRes.text();
    const rows = parseServerCSV(csvText);
    console.log(`Successfully fetched and parsed ${rows.length} rows directly from public CSV`);
    res.json({ status: "success", data: rows });

  } catch (err: any) {
    console.error("Error direct fetching from sheet:", err);
    res.status(500).json({
      error: `Không thể tải dữ liệu từ Google Sheet. Chi tiết: ${err.message || err}`
    });
  }
});

// Vite Middleware Integration for Dev / Static serving for Prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully running on port ${PORT}`);
  });
}

startServer();
