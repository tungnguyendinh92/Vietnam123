/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VocabModule from './components/VocabModule';
import GrammarModule from './components/GrammarModule';
import WhiteboardModule from './components/WhiteboardModule';
import ChatModule from './components/ChatModule';
import SyncModal from './components/SyncModal';

import { VocabItem, GrammarPuzzle, WhiteboardTab, ChatMessage, WhiteboardLine } from './types';
import { DEFAULT_VOCAB_ITEMS, DEFAULT_GRAMMAR_PUZZLES } from './presets';
import { AppLang, TRANSLATIONS } from './utils/translations';
import { 
  extractSpreadsheetId, 
  fetchWhiteboardFromSheet, 
  fetchVocabFromSheet, 
  fetchGrammarFromSheet, 
  parseWordsString, 
  serializeWordsToString 
} from './utils/sheetParser';
import { 
  BookOpen, Sparkles, MessageSquare, FileText, RefreshCw, HelpCircle, 
  Settings, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation: 'vocab' | 'grammar' | 'whiteboard' | 'chat'
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar' | 'whiteboard' | 'chat'>('vocab');

  // App Language: 'vi' | 'en' | 'cn'
  const [appLang, setAppLang] = useState<AppLang>('vi');

  // Modal control
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Global State (persisted in localStorage)
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
  const [puzzles, setPuzzles] = useState<GrammarPuzzle[]>([]);
  const [whiteboardTabs, setWhiteboardTabs] = useState<WhiteboardTab[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncSource, setSyncSource] = useState<'preset' | 'sheet'>('preset');
  const [vocabSheetName, setVocabSheetName] = useState('1');
  const [grammarSheetName, setGrammarSheetName] = useState('2');
  const [whiteboardSheetName, setWhiteboardSheetName] = useState('0');
  const [scriptUrl, setScriptUrl] = useState('');

  // Load initial data
  useEffect(() => {
    // 0. Language
    const cachedLang = localStorage.getItem('vietlearn_app_lang');
    if (cachedLang === 'vi' || cachedLang === 'en' || cachedLang === 'cn') {
      setAppLang(cachedLang);
    }

    // 1. Vocabulary
    const cachedVocab = localStorage.getItem('vietlearn_vocab');
    if (cachedVocab) {
      setVocabItems(JSON.parse(cachedVocab));
    } else {
      setVocabItems(DEFAULT_VOCAB_ITEMS);
    }

    // 2. Grammar Puzzles
    const cachedPuzzles = localStorage.getItem('vietlearn_puzzles');
    if (cachedPuzzles) {
      setPuzzles(JSON.parse(cachedPuzzles));
    } else {
      setPuzzles(DEFAULT_GRAMMAR_PUZZLES);
    }

    // 3. Whiteboard Notebook Pages
    const cachedWhiteboard = localStorage.getItem('vietlearn_whiteboard');
    if (cachedWhiteboard) {
      setWhiteboardTabs(JSON.parse(cachedWhiteboard));
    } else {
      // Default sample notebook tabs
      setWhiteboardTabs([
        {
          id: 'tab-1',
          title: 'Bài học 1: Chào hỏi',
          lines: [
            {
              id: 'l1',
              viText: 'Xin chào cô giáo, em tên là David.',
              fullEnText: 'Hello teacher, my name is David.',
              words: [
                { id: 'w1_1', vi: 'Xin chào', en: 'Hello' },
                { id: 'w1_2', vi: 'cô giáo', en: 'teacher' },
                { id: 'w1_3', vi: 'em', en: 'I (student)' },
                { id: 'w1_4', vi: 'tên là', en: 'named as' },
                { id: 'w1_5', vi: 'David', en: 'David' }
              ]
            },
            {
              id: 'l2',
              viText: 'Tôi rất vui được gặp bạn.',
              fullEnText: 'I am very happy to meet you.',
              words: [
                { id: 'w2_1', vi: 'Tôi', en: 'I' },
                { id: 'w2_2', vi: 'rất vui', en: 'very glad' },
                { id: 'w2_3', vi: 'được gặp', en: 'to get to meet' },
                { id: 'w2_4', vi: 'bạn', en: 'you' }
              ]
            }
          ]
        },
        {
          id: 'tab-2',
          title: 'Bài học 2: Ẩm thực',
          lines: [
            {
              id: 'l3',
              viText: 'Tôi muốn ăn một bát phở bò chín.',
              fullEnText: 'I want to eat a bowl of well-done beef Pho.',
              words: [
                { id: 'w3_1', vi: 'Tôi', en: 'I' },
                { id: 'w3_2', vi: 'muốn ăn', en: 'want to eat' },
                { id: 'w3_3', vi: 'một bát', en: 'a bowl of' },
                { id: 'w3_4', vi: 'phở bò', en: 'beef Pho' },
                { id: 'w3_5', vi: 'chín', en: 'cooked / well-done' }
              ]
            }
          ]
        }
      ]);
    }

    // 4. Chat history
    const cachedChat = localStorage.getItem('vietlearn_chat');
    if (cachedChat) {
      setChatMessages(JSON.parse(cachedChat));
    }

    // 5. Configs
    const cachedUrl = localStorage.getItem('vietlearn_sheet_url') || '';
    setSheetUrl(cachedUrl);
    setSyncSource(cachedUrl ? 'sheet' : 'preset');
    setVocabSheetName(localStorage.getItem('vietlearn_vocab_sheet_name') || '1');
    setGrammarSheetName(localStorage.getItem('vietlearn_grammar_sheet_name') || '2');
    setWhiteboardSheetName(localStorage.getItem('vietlearn_whiteboard_sheet_name') || '0');
    setScriptUrl(localStorage.getItem('vietlearn_script_url') || '');
  }, []);

  // Sync callbacks to state and LocalStorage
  const handleUpdateVocab = (updated: VocabItem[]) => {
    setVocabItems(updated);
    localStorage.setItem('vietlearn_vocab', JSON.stringify(updated));
  };

  const handleUpdatePuzzles = (updated: GrammarPuzzle[]) => {
    setPuzzles(updated);
    localStorage.setItem('vietlearn_puzzles', JSON.stringify(updated));
  };

  const handleUpdateWhiteboard = (updated: WhiteboardTab[]) => {
    setWhiteboardTabs(updated);
    localStorage.setItem('vietlearn_whiteboard', JSON.stringify(updated));
  };

  const handleAddChatMessage = (msg: ChatMessage) => {
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    localStorage.setItem('vietlearn_chat', JSON.stringify(updated));
  };

  const handleUpdateChatMessage = (id: string, updatedFields: Partial<ChatMessage>) => {
    setChatMessages(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updatedFields } : m);
      localStorage.setItem('vietlearn_chat', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearChatHistory = () => {
    setChatMessages([]);
    localStorage.removeItem('vietlearn_chat');
  };

  const handleSyncComplete = (
    newVocab: VocabItem[], 
    newPuzzles: GrammarPuzzle[], 
    newWhiteboard: WhiteboardTab[],
    newSheetUrl: string, 
    newVocabSheet: string, 
    newGrammarSheet: string,
    newWhiteboardSheet: string
  ) => {
    setVocabItems(newVocab);
    setPuzzles(newPuzzles.length > 0 ? newPuzzles : DEFAULT_GRAMMAR_PUZZLES);
    if (newWhiteboard.length > 0) {
      setWhiteboardTabs(newWhiteboard);
    }
    setSheetUrl(newSheetUrl);
    setSyncSource('sheet');
    setVocabSheetName(newVocabSheet);
    setGrammarSheetName(newGrammarSheet);
    setWhiteboardSheetName(newWhiteboardSheet);

    localStorage.setItem('vietlearn_vocab', JSON.stringify(newVocab));
    if (newPuzzles.length > 0) {
      localStorage.setItem('vietlearn_puzzles', JSON.stringify(newPuzzles));
    }
    if (newWhiteboard.length > 0) {
      localStorage.setItem('vietlearn_whiteboard', JSON.stringify(newWhiteboard));
    }
    localStorage.setItem('vietlearn_sheet_url', newSheetUrl);
    localStorage.setItem('vietlearn_vocab_sheet_name', newVocabSheet);
    localStorage.setItem('vietlearn_grammar_sheet_name', newGrammarSheet);
    localStorage.setItem('vietlearn_whiteboard_sheet_name', newWhiteboardSheet);
  };

  const [syncLoading, setSyncLoading] = useState<'pull' | 'push' | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePullFromHeader = async () => {
    if (!sheetUrl) {
      setSyncMessage({ type: 'error', text: "Chưa liên kết Google Sheet. Vui lòng nhấn 'Cài đặt Sheet' để liên kết trước." });
      setIsSyncModalOpen(true);
      return;
    }

    const id = extractSpreadsheetId(sheetUrl);
    if (!id) {
      setSyncMessage({ type: 'error', text: "Đường dẫn Google Sheet không hợp lệ." });
      return;
    }

    setSyncLoading('pull');
    setSyncMessage(null);

    try {
      console.log("Header pull: Fetching whiteboard, vocabulary, and grammar data via server API...");
      
      const [wbRes, vocabRes, grammarRes] = await Promise.all([
        fetch('/api/fetch-from-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptUrl, spreadsheetId: id, sheetName: whiteboardSheetName || '0' })
        }),
        fetch('/api/fetch-from-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptUrl, spreadsheetId: id, sheetName: vocabSheetName || '1' })
        }),
        fetch('/api/fetch-from-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptUrl, spreadsheetId: id, sheetName: grammarSheetName || '2' })
        })
      ]);

      if (!wbRes.ok) {
        const errData = await wbRes.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi tải dữ liệu Bảng Trắng (${wbRes.status})`);
      }
      if (!vocabRes.ok) {
        const errData = await vocabRes.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi tải dữ liệu Từ vựng (${vocabRes.status})`);
      }
      if (!grammarRes.ok) {
        const errData = await grammarRes.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi tải dữ liệu Ghép câu (${grammarRes.status})`);
      }

      const wbResult = await wbRes.json();
      const vocabResult = await vocabRes.json();
      const grammarResult = await grammarRes.json();

      if (wbResult.status !== 'success' || !Array.isArray(wbResult.data)) {
        throw new Error(wbResult.error || "Dữ liệu Bảng Trắng không đúng định dạng JSON.");
      }
      if (vocabResult.status !== 'success' || !Array.isArray(vocabResult.data)) {
        throw new Error(vocabResult.error || "Dữ liệu Từ Vựng không đúng định dạng JSON.");
      }
      if (grammarResult.status !== 'success' || !Array.isArray(grammarResult.data)) {
        throw new Error(grammarResult.error || "Dữ liệu Ghép Câu không đúng định dạng JSON.");
      }

      // Parse Whiteboard rows
      const wbRows = wbResult.data;
      const tabMap: { [title: string]: WhiteboardLine[] } = {};
      for (let i = 1; i < wbRows.length; i++) {
        const row = wbRows[i];
        if (row.length < 2 || !row[0] || !row[1]) continue;

        const tabTitle = String(row[0]).trim();
        const viText = String(row[1]).trim();
        const fullEnText = row[2] ? String(row[2]).trim() : '';
        const wordsStr = row[3] ? String(row[3]).trim() : '';
        const grammar = row[4] ? String(row[4]).trim() : undefined;

        const line: WhiteboardLine = {
          id: `sheet-wb-l-${i}`,
          viText,
          fullEnText,
          words: parseWordsString(wordsStr),
          grammar
        };

        if (!tabMap[tabTitle]) {
          tabMap[tabTitle] = [];
        }
        tabMap[tabTitle].push(line);
      }

      const whiteboardItems = Object.keys(tabMap).map((title, idx) => ({
        id: `sheet-wb-tab-${idx}`,
        title,
        lines: tabMap[title]
      }));

      // Parse Vocab rows
      const vocabRows = vocabResult.data;
      const vocabItemsData: VocabItem[] = [];
      for (let i = 1; i < vocabRows.length; i++) {
        const row = vocabRows[i];
        if (row.length < 2 || !row[0] || !row[1]) continue;
        vocabItemsData.push({
          id: `sheet-v-${i}`,
          vi: String(row[0]),
          en: String(row[1]),
          topic: String(row[2] || 'Chung'),
          example: row[3] ? String(row[3]) : undefined,
          exampleEn: row[4] ? String(row[4]) : undefined,
          memorized: row[5] ? (String(row[5]).trim().toUpperCase() === 'TRUE' || String(row[5]).trim() === '1' || String(row[5]).trim() === 'Đã thuộc') : false
        });
      }

      // Parse Grammar rows
      const grammarRows = grammarResult.data;
      const grammarItems: GrammarPuzzle[] = [];
      for (let i = 1; i < grammarRows.length; i++) {
        const row = grammarRows[i];
        if (row.length < 2 || !row[0] || !row[1]) continue;
        grammarItems.push({
          id: `sheet-g-${i}`,
          viSentence: String(row[0]),
          enSentence: String(row[1]),
          lesson: String(row[2] || 'Bài tập chung')
        });
      }

      // Make sure we actually retrieved some items so we don't wipe data accidentally
      if (whiteboardItems.length === 0 && vocabItemsData.length === 0 && grammarItems.length === 0) {
        throw new Error("Không lấy được dữ liệu nào từ Google Sheet. Vui lòng kiểm tra lại cấu hình và dữ liệu trong Sheet.");
      }

      handleSyncComplete(vocabItemsData, grammarItems, whiteboardItems, sheetUrl, vocabSheetName || '1', grammarSheetName || '2', whiteboardSheetName || '0');
      setSyncMessage({ type: 'success', text: "Kéo dữ liệu từ Google Sheets thành công!" });
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setSyncMessage({ type: 'error', text: `Kéo dữ liệu thất bại: ${err.message || err}` });
    } finally {
      setSyncLoading(null);
    }
  };

  const handlePushFromHeader = async () => {
    if (!sheetUrl) {
      setSyncMessage({ type: 'error', text: "Chưa liên kết Google Sheet. Vui lòng nhấn 'Cài đặt Sheet' để liên kết trước." });
      setIsSyncModalOpen(true);
      return;
    }
    if (!scriptUrl) {
      setSyncMessage({ type: 'error', text: "Chưa cấu hình Google Apps Script Web App URL. Hãy thiết lập trong tab 'Kho Từ Vựng' -> Cài đặt nâng cao." });
      setActiveTab('vocab');
      return;
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      setSyncMessage({ type: 'error', text: "Đường dẫn Google Sheet không hợp lệ." });
      return;
    }

    setSyncLoading('push');
    setSyncMessage(null);

    try {
      // 1. Whiteboard
      const wbRows: string[][] = [];
      whiteboardTabs.forEach(tab => {
        tab.lines.forEach(line => {
          wbRows.push([
            tab.title,
            line.viText,
            line.fullEnText,
            serializeWordsToString(line.words),
            line.grammar || ''
          ]);
        });
      });

      // 2. Vocabulary
      const vocabRows = vocabItems.map(item => [
        item.vi,
        item.en,
        item.topic,
        item.example || '',
        item.exampleEn || '',
        item.memorized ? 'TRUE' : 'FALSE'
      ]);

      // 3. Sentence / Grammar
      const grammarRows = puzzles.map(item => [
        item.viSentence,
        item.enSentence,
        item.lesson
      ]);

      // Step 1: Push Whiteboard
      const resWb = await fetch('/api/push-to-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptUrl,
          spreadsheetId,
          sheetName: whiteboardSheetName || '0',
          data: wbRows
        })
      });
      if (!resWb.ok) {
        const errorData = await resWb.json();
        throw new Error(`Đẩy dữ liệu Whiteboard thất bại: ${errorData.error || 'Yêu cầu thất bại.'}`);
      }

      // Step 2: Push Vocabulary
      const resVocab = await fetch('/api/push-to-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptUrl,
          spreadsheetId,
          sheetName: vocabSheetName || '1',
          data: vocabRows
        })
      });
      if (!resVocab.ok) {
        const errorData = await resVocab.json();
        throw new Error(`Đẩy dữ liệu Từ vựng thất bại: ${errorData.error || 'Yêu cầu thất bại.'}`);
      }

      // Step 3: Push Sentence
      const resGrammar = await fetch('/api/push-to-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptUrl,
          spreadsheetId,
          sheetName: grammarSheetName || '2',
          data: grammarRows
        })
      });
      if (!resGrammar.ok) {
        const errorData = await resGrammar.json();
        throw new Error(`Đẩy dữ liệu Ghép câu thất bại: ${errorData.error || 'Yêu cầu thất bại.'}`);
      }

      setSyncMessage({ type: 'success', text: "Đẩy dữ liệu lên Google Sheets thành công!" });
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setSyncMessage({ type: 'error', text: `Đẩy dữ liệu thất bại: ${err.message || err}` });
    } finally {
      setSyncLoading(null);
    }
  };

  const handleSetAppLang = (lang: AppLang) => {
    setAppLang(lang);
    localStorage.setItem('vietlearn_app_lang', lang);
  };

  const t = TRANSLATIONS[appLang];

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col font-sans" id="app-root">
      {/* 1. Universal Top Header */}
      <Header 
        sheetSynced={!!sheetUrl} 
        onOpenSyncModal={() => setIsSyncModalOpen(true)} 
        syncSource={syncSource}
        onPull={handlePullFromHeader}
        onPush={handlePushFromHeader}
        syncLoading={syncLoading}
        syncMessage={syncMessage}
        onClearMessage={() => setSyncMessage(null)}
        appLang={appLang}
        onSetAppLang={handleSetAppLang}
      />

      {/* 2. Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col">
        {/* Navigation Tabs for Modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center justify-center space-x-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'vocab'
                ? 'bg-white text-slate-900 border-yellow-400 shadow-md font-black'
                : 'bg-white/60 hover:bg-white text-slate-500 border-transparent hover:text-slate-800 font-semibold'
            }`}
            id="tab-vocab"
          >
            <BookOpen className={`w-5 h-5 ${activeTab === 'vocab' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs">{t.tab_vocab}</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center justify-center space-x-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'grammar'
                ? 'bg-white text-slate-900 border-yellow-400 shadow-md font-black'
                : 'bg-white/60 hover:bg-white text-slate-500 border-transparent hover:text-slate-800 font-semibold'
            }`}
            id="tab-grammar"
          >
            <Sparkles className={`w-5 h-5 ${activeTab === 'grammar' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs">{t.tab_grammar}</span>
          </button>

          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`flex items-center justify-center space-x-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'whiteboard'
                ? 'bg-white text-slate-900 border-yellow-400 shadow-md font-black'
                : 'bg-white/60 hover:bg-white text-slate-500 border-transparent hover:text-slate-800 font-semibold'
            }`}
            id="tab-whiteboard"
          >
            <FileText className={`w-5 h-5 ${activeTab === 'whiteboard' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs">{t.tab_whiteboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center space-x-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-slate-900 border-yellow-400 shadow-md font-black'
                : 'bg-white/60 hover:bg-white text-slate-500 border-transparent hover:text-slate-800 font-semibold'
            }`}
            id="tab-chat"
          >
            <MessageSquare className={`w-5 h-5 ${activeTab === 'chat' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs">{t.tab_chat}</span>
          </button>
        </div>

        {/* Modular Content Display with Fade animations */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {activeTab === 'vocab' && (
                <VocabModule 
                  vocabItems={vocabItems} 
                  onUpdateVocab={handleUpdateVocab} 
                  onOpenSyncModal={() => setIsSyncModalOpen(true)}
                  sheetUrl={sheetUrl}
                  vocabSheetName={vocabSheetName}
                  grammarSheetName={grammarSheetName}
                  whiteboardSheetName={whiteboardSheetName}
                  whiteboardTabs={whiteboardTabs}
                  puzzles={puzzles}
                  scriptUrl={scriptUrl}
                  onUpdateScriptUrl={(url) => {
                    setScriptUrl(url);
                    localStorage.setItem('vietlearn_script_url', url);
                  }}
                  appLang={appLang}
                />
              )}

              {activeTab === 'grammar' && (
                <GrammarModule 
                  puzzles={puzzles}
                  appLang={appLang}
                />
              )}

              {activeTab === 'whiteboard' && (
                <WhiteboardModule 
                  tabs={whiteboardTabs} 
                  onUpdateTabs={handleUpdateWhiteboard}
                  appLang={appLang}
                />
              )}

              {activeTab === 'chat' && (
                <ChatModule 
                  messages={chatMessages} 
                  onAddMessage={handleAddChatMessage}
                  onUpdateMessage={handleUpdateChatMessage}
                  onClearHistory={handleClearChatHistory}
                  appLang={appLang}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3. Global Spreadsheet Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={handleSyncComplete}
        currentSheetUrl={sheetUrl}
        currentVocabSheetName={vocabSheetName}
        currentGrammarSheetName={grammarSheetName}
        currentWhiteboardSheetName={whiteboardSheetName}
        scriptUrl={scriptUrl}
        appLang={appLang}
      />

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 select-none print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-[11px] font-medium space-y-1">
          <p>© 2026 Vietnamese Learning Studio. {t.footer_text}</p>
          <p>{t.footer_tech}</p>
        </div>
      </footer>
    </div>
  );
}
