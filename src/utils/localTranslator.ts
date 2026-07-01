/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 100% Reliable Local Backup Dictionary for Vietnamese vocabulary
export const LOCAL_DICT: Record<string, string> = {
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
export function cleanWord(word: string): string {
  return word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim().toLowerCase();
}

// Client-side translation fallback
export function localWhiteboardTranslate(text: string) {
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

// Client-side chatbot fallback response logic
export function localChatResponse(userMessage: string) {
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
    content = `Cảm ơn bạn đã hỏi về "${userMessage.trim()}". Hiện tại dịch vụ đám mây AI đang bận hoặc chạy tĩnh trên Vercel, tôi đang tự động kích hoạt bộ dịch dự phòng để luôn đồng hành cùng bạn học tập tốt nhất!`;
    translation = `Thank you for asking about "${userMessage.trim()}". The cloud AI service is offline or running statically on Vercel, so I am automatically using the offline backup dictionary engine to ensure your study is fully supported!`;
  }

  return { content, translation };
}

// Client-side grammar log explainer fallback
export function localExplainGrammar(viSentence: string, enSentence?: string) {
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
  explanation += `\n\n*(Lưu ý: Giải thích này được tạo tự động bởi công cụ dự phòng cục bộ trên trình duyệt)*`;

  return { explanation };
}
