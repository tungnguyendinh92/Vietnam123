/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppLang = 'vi' | 'en' | 'cn';

export const TRANSLATIONS: Record<AppLang, Record<string, string>> = {
  vi: {
    app_desc: "Phát triển ngôn ngữ cho Giáo viên & Học sinh Việt - Anh",
    pull_data: "Kéo Data Xuống",
    push_data: "Đẩy Data Lên",
    sheet_settings: "Cài đặt Sheet",
    sheet_connected: "Google Sheet đã kết nối",
    preset_data: "Dữ liệu bài học mẫu",
    pull_title: "Kéo toàn bộ dữ liệu từ Google Sheet xuống",
    push_title: "Đẩy toàn bộ dữ liệu hiện tại lên Google Sheet",
    settings_title: "Cài đặt đồng bộ trang tính",
    
    // Tabs
    tab_vocab: "1. Kho Từ Vựng",
    tab_grammar: "2. Ghép từ Ngữ pháp",
    tab_whiteboard: "3. Bảng trắng dịch",
    tab_chat: "4. Chat cùng AI",
    
    // VocabModule
    vocab_title: "Kho Từ Vựng Song Ngữ",
    vocab_subtitle: "Quản lý từ vựng nâng cao, ôn tập flashcard tương tác, hỗ trợ phát âm chuẩn.",
    search_placeholder: "Tìm kiếm từ vựng (Tiếng Việt hoặc Tiếng Anh)...",
    all_topics: "Tất cả chủ đề",
    topic_label: "Chủ đề:",
    add_word: "Thêm từ mới",
    filter_memorized: "Đã học",
    filter_unmemorized: "Chưa học",
    practice_flashcard: "Luyện Flashcard",
    pronounce_hint: "Nhấp để nghe phát âm",
    no_vocab: "Chưa có từ vựng nào trong danh sách. Hãy thêm từ mới hoặc kết nối Google Sheet!",
    example_label: "Ví dụ:",
    vietnamese: "Tiếng Việt",
    english: "Tiếng Anh",
    topic: "Chủ đề",
    actions: "Hành động",
    
    // GrammarModule
    grammar_title: "Ghép câu Ngữ pháp",
    grammar_subtitle: "Kéo thả hoặc nhấn vào các mảnh ghép từ để hoàn thành câu Tiếng Việt chính xác.",
    lessons: "Danh sách bài học",
    congrats: "Chúc mừng! Bạn đã ghép chính xác câu tiếng Việt.",
    reset: "Làm lại",
    view_explanation: "Xem giải thích chi tiết",
    next_puzzle: "Câu tiếp theo",
    score: "Điểm số:",
    streak: "Chuỗi:",
    
    // WhiteboardModule
    whiteboard_title: "Bảng trắng tương dịch song ngữ",
    whiteboard_subtitle: "Giảng dạy hiệu quả với các câu hội thoại mẫu, phân tách từ ngữ và dịch tự động thời gian thực.",
    add_line: "Thêm câu hội thoại mới",
    placeholder_vi_line: "Nhập câu Tiếng Việt để thông dịch...",
    translate: "Dịch nhanh",
    explaining: "Đang phân tích...",
    word_breakdown: "Giải nghĩa chi tiết:",
    
    // ChatModule
    chat_title: "Trợ lý AI biên dịch đồng hành",
    chat_subtitle: "Hỏi đáp, luyện nói bối cảnh hội thoại tự do, hỗ trợ dịch tự động hai chiều Việt-Anh.",
    chat_placeholder: "Nhập câu hỏi hoặc luyện giao tiếp ở đây...",
    clear_chat: "Xóa lịch sử",
    ai_typing: "AI đang suy nghĩ...",
    
    // SyncModal
    sync_modal_title: "Cấu hình Đồng bộ Google Sheets",
    sync_modal_subtitle: "Liên kết ứng dụng với bảng tính Google Sheets công khai để chỉnh sửa nội dung dễ dàng.",
    spreadsheet_url: "Đường dẫn Google Spreadsheet URL",
    advanced_settings: "Cài đặt nâng cao (Đẩy dữ liệu)",
    sync_now: "Đồng bộ ngay",
    cancel: "Hủy bỏ",

    // Footer
    footer_text: "Thiết kế riêng cho mô hình học tập song ngữ cao cấp.",
    footer_tech: "Tận dụng sức mạnh của Google Gemini-3.5-flash & Web Speech API để phát triển phản xạ tự nhiên."
  },
  en: {
    app_desc: "Language development for Vietnamese - English Teachers & Students",
    pull_data: "Pull Data",
    push_data: "Push Data",
    sheet_settings: "Sheet Settings",
    sheet_connected: "Google Sheet Connected",
    preset_data: "Preset Lesson Data",
    pull_title: "Pull all data from Google Sheet",
    push_title: "Push current app data to Google Sheet",
    settings_title: "Configure spreadsheet synchronization",

    // Tabs
    tab_vocab: "1. Vocabulary Lab",
    tab_grammar: "2. Grammar Puzzle",
    tab_whiteboard: "3. Interactive Board",
    tab_chat: "4. AI Companion",

    // VocabModule
    vocab_title: "Bilingual Vocabulary Lab",
    vocab_subtitle: "Advanced vocabulary management, interactive flashcards, and native voice pronunciation.",
    search_placeholder: "Search vocabulary (Vietnamese or English)...",
    all_topics: "All Topics",
    topic_label: "Topic:",
    add_word: "Add New Word",
    filter_memorized: "Memorized",
    filter_unmemorized: "Not Memorized",
    practice_flashcard: "Flashcard Session",
    pronounce_hint: "Click to hear pronunciation",
    no_vocab: "No vocabulary items yet. Add words or sync with a Google Sheet!",
    example_label: "Example:",
    vietnamese: "Vietnamese",
    english: "English",
    topic: "Topic",
    actions: "Actions",

    // GrammarModule
    grammar_title: "Grammar & Sentence Builder",
    grammar_subtitle: "Drag-and-drop or click the scrambled word cards to assemble the correct Vietnamese sentence.",
    lessons: "Available Lessons",
    congrats: "Awesome! You have successfully built the sentence.",
    reset: "Reset",
    view_explanation: "Detailed Explanation",
    next_puzzle: "Next Sentence",
    score: "Score:",
    streak: "Streak:",

    // WhiteboardModule
    whiteboard_title: "Bilingual Interactive Whiteboard",
    whiteboard_subtitle: "Teach effectively with conversation scripts, word-by-word breakdowns, and instant AI explanations.",
    add_line: "Add Conversation Line",
    placeholder_vi_line: "Enter a Vietnamese sentence to interpret...",
    translate: "Interpret",
    explaining: "Analyzing...",
    word_breakdown: "Word Breakdown:",

    // ChatModule
    chat_title: "Companion AI Translation Assistant",
    chat_subtitle: "Ask questions, practice speaking, and get automatic real-time English-Vietnamese translations.",
    chat_placeholder: "Type your query or practice conversation here...",
    clear_chat: "Clear History",
    ai_typing: "AI is writing...",

    // SyncModal
    sync_modal_title: "Google Sheets Sync Setup",
    sync_modal_subtitle: "Link your application with a public Google Spreadsheet to edit learning content easily.",
    spreadsheet_url: "Google Spreadsheet URL",
    advanced_settings: "Advanced Writeback Settings (Push)",
    sync_now: "Sync Now",
    cancel: "Cancel",

    // Footer
    footer_text: "Exclusively designed for premium bilingual language learning.",
    footer_tech: "Powered by Google Gemini-3.5-flash & Web Speech API for natural reflexes."
  },
  cn: {
    app_desc: "面向越南语-英语教师与学生的双语语言开发平台",
    pull_data: "拉取数据",
    push_data: "推送数据",
    sheet_settings: "表格设置",
    sheet_connected: "谷歌表格已连接",
    preset_data: "使用预设课程数据",
    pull_title: "从谷歌表格拉取全部最新数据",
    push_title: "将当前应用数据推送至谷歌表格",
    settings_title: "配置谷歌电子表格同步设置",

    // Tabs
    tab_vocab: "1. 词汇库",
    tab_grammar: "2. 语法拼图",
    tab_whiteboard: "3. 智能白板",
    tab_chat: "4. AI 助手",

    // VocabModule
    vocab_title: "双语词汇实验室",
    vocab_subtitle: "高效词汇管理、互动卡片记忆，结合原生语音发音支持。",
    search_placeholder: "搜索词汇（越南语或英语）...",
    all_topics: "所有主题",
    topic_label: "主题:",
    add_word: "添加新单词",
    filter_memorized: "已掌握",
    filter_unmemorized: "学习中",
    practice_flashcard: "卡片复习",
    pronounce_hint: "点击听发音",
    no_vocab: "暂无单词数据。请手动添加或同步谷歌表格数据！",
    example_label: "例句:",
    vietnamese: "越南语",
    english: "英语",
    topic: "主题",
    actions: "操作",

    // GrammarModule
    grammar_title: "语法与句子构建器",
    grammar_subtitle: "拖拽或点击打乱顺序的词汇卡片，来拼写正确的越南语子。",
    lessons: "可用课程",
    congrats: "太棒了！您已成功拼写该句子。",
    reset: "重置",
    view_explanation: "查看详细解析",
    next_puzzle: "下一句",
    score: "得分:",
    streak: "连胜:",

    // WhiteboardModule
    whiteboard_title: "双语智能互动白板",
    whiteboard_subtitle: "通过对话教案、逐词拆解以及实时 AI 解读，进行高效的互动教学。",
    add_line: "添加对话句子",
    placeholder_vi_line: "输入要翻译的越南语句子...",
    translate: "快速翻译",
    explaining: "解析中...",
    word_breakdown: "逐词释义:",

    // ChatModule
    chat_title: "AI 智能翻译伴读助手",
    chat_subtitle: "提问、在自由情景中练习口语，并获取实时的越英双向自动翻译。",
    chat_placeholder: "在此输入您的问题或练习对话...",
    clear_chat: "清空历史",
    ai_typing: "AI 正在思考...",

    // SyncModal
    sync_modal_title: "谷歌表格同步设置",
    sync_modal_subtitle: "将您的应用程序与公开的谷歌电子表格进行链接，以便轻松管理课程内容。",
    spreadsheet_url: "谷歌表格 (Spreadsheet) URL",
    advanced_settings: "高级回写设置 (推送)",
    sync_now: "立即同步",
    cancel: "取消",

    // Footer
    footer_text: "专为高端双语语言学习模式设计。",
    footer_tech: "结合 Google Gemini-3.5-flash 与 Web 语音 API 驱动，培养自然的语言条件反射。"
  }
};
