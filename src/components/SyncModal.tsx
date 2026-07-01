/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, FileSpreadsheet, ExternalLink, HelpCircle, Check, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { extractSpreadsheetId, fetchVocabFromSheet, fetchGrammarFromSheet, fetchWhiteboardFromSheet, parseWordsString, SAMPLE_SHEET_URL } from '../utils/sheetParser';
import { VocabItem, GrammarPuzzle, WhiteboardTab, WhiteboardLine } from '../types';
import { AppLang } from '../utils/translations';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: (
    vocab: VocabItem[], 
    puzzles: GrammarPuzzle[], 
    whiteboard: WhiteboardTab[],
    sheetUrl: string, 
    vocabSheet: string, 
    grammarSheet: string,
    whiteboardSheet: string
  ) => void;
  currentSheetUrl: string;
  currentVocabSheetName?: string;
  currentGrammarSheetName?: string;
  currentWhiteboardSheetName?: string;
  scriptUrl?: string;
  appLang?: AppLang;
}

export default function SyncModal({ 
  isOpen, 
  onClose, 
  onSyncComplete, 
  currentSheetUrl, 
  currentVocabSheetName, 
  currentGrammarSheetName, 
  currentWhiteboardSheetName,
  scriptUrl,
  appLang
}: SyncModalProps) {
  const [sheetUrl, setSheetUrl] = useState(currentSheetUrl || SAMPLE_SHEET_URL);
  const [whiteboardSheetName, setWhiteboardSheetName] = useState(currentWhiteboardSheetName || '0'); // Whiteboard: sheet 0
  const [vocabSheetName, setVocabSheetName] = useState(currentVocabSheetName || '1'); // Vocabulary: sheet 1
  const [grammarSheetName, setGrammarSheetName] = useState(currentGrammarSheetName || '2'); // Sentence: sheet 2
  
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const activeLang = appLang || 'vi';
  const localT = {
    vi: {
      sync_title: "Đồng bộ đám mây Google Sheets",
      subtitle: "Học liệu song ngữ cá nhân",
      how_to: "Cách thiết lập trang tính:",
      step1: "Mở Google Sheets của bạn.",
      step2: "Nhấn Chia sẻ (Share) ở góc phải Google Sheets -> Đổi thành 'Bất kỳ ai có liên kết đều có thể xem' (Anyone with link can view). Sao chép link trình duyệt và dán vào ô dưới đây.",
      sample: "Nhấp vào đây để dùng thử trang tính mẫu có sẵn của chúng tôi",
      label_url: "Liên kết Google Sheet (Spreadsheet URL) *",
      label_wb: "Số thứ tự / GID / Tên Trang tính 1 (Whiteboard)",
      wb_desc: "Mặc định: 0 (Bảng viết/Giáo trình 4 dòng).",
      label_vocab: "Trang tính 2 (Từ vựng)",
      vocab_desc: "Mặc định: 1 (Kho từ vựng).",
      label_grammar: "Trang tính 3 (Ghép câu)",
      grammar_desc: "Mặc định: 2 (Ngữ pháp/Ghép câu).",
      success_msg: "Đồng bộ hóa thành công! Dữ liệu mới đã sẵn sàng.",
      cancel: "Hủy bỏ",
      btn_sync: "Cập nhật Đồng bộ",
      loading: "Đang tải và phân tích...",
    },
    en: {
      sync_title: "Google Sheets Cloud Sync",
      subtitle: "Personalized Bilingual Lessons",
      how_to: "How to configure spreadsheet:",
      step1: "Open your Google Sheets document.",
      step2: "Click 'Share' on the top-right -> Change permission to 'Anyone with the link can view'. Copy the browser URL and paste it below.",
      sample: "Click here to try out our pre-configured sample spreadsheet",
      label_url: "Google Sheet Connection (Spreadsheet URL) *",
      label_wb: "Index / GID / Tab Name 1 (Whiteboard)",
      wb_desc: "Default: 0 (Interactive Board / 4-line conversations).",
      label_vocab: "Tab 2 Name (Vocabulary)",
      vocab_desc: "Default: 1 (Vocabulary repository).",
      label_grammar: "Tab 3 Name (Sentence Puzzles)",
      grammar_desc: "Default: 2 (Grammar / Sentence Builder).",
      success_msg: "Sync completed successfully! Fresh data is ready.",
      cancel: "Cancel",
      btn_sync: "Update & Synchronize",
      loading: "Fetching and analyzing...",
    },
    cn: {
      sync_title: "谷歌表格云端同步",
      subtitle: "个性化双语教学课件",
      how_to: "如何配置谷歌表格:",
      step1: "打开您的谷歌电子表格。",
      step2: "点击右上角的 '分享' (Share) -> 将权限更改为 '任何拥有链接的人都可以查看' (Anyone with link can view)。复制浏览器地址栏的链接并粘贴到下方。",
      sample: "点击这里试用我们预先配置的示范表格",
      label_url: "谷歌表格链接 (Spreadsheet URL) *",
      label_wb: "表格 1 排序 / GID / 名称 (智能白板)",
      wb_desc: "默认值: 0 (互动白板 / 4行对话教案)。",
      label_vocab: "表格 2 名称 (词汇库)",
      vocab_desc: "默认值: 1 (词汇管理)。",
      label_grammar: "表格 3 名称 (语法拼图)",
      grammar_desc: "默认值: 2 (语法 / 拼句)。",
      success_msg: "同步已成功完成！新教学数据已准备就绪。",
      cancel: "取消",
      btn_sync: "更新并同步",
      loading: "正在下载并分析数据...",
    }
  }[activeLang];

  const handleUseSample = () => {
    setSheetUrl(SAMPLE_SHEET_URL);
    setWhiteboardSheetName('0');
    setVocabSheetName('1');
    setGrammarSheetName('2');
    setError(null);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;

    const id = extractSpreadsheetId(sheetUrl);
    if (!id) {
      setError(activeLang === 'vi' 
        ? "Đường dẫn Google Sheet không hợp lệ. Vui lòng kiểm tra lại cấu trúc URL." 
        : activeLang === 'en'
        ? "Invalid Google Sheet URL. Please verify the URL layout."
        : "谷歌表格链接格式不正确。请确认表格链接。");
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccess(false);

    try {
      let whiteboardItems: WhiteboardTab[] = [];
      let vocabItems: VocabItem[] = [];
      let grammarItems: GrammarPuzzle[] = [];

      let useClientFallback = false;
      let wbRes, vocabRes, grammarRes;

      console.log("SyncModal: Fetching whiteboard, vocabulary, and grammar data...");

      try {
        [wbRes, vocabRes, grammarRes] = await Promise.all([
          fetch('/api/fetch-from-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scriptUrl, spreadsheetId: id, sheetName: whiteboardSheetName })
          }),
          fetch('/api/fetch-from-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scriptUrl, spreadsheetId: id, sheetName: vocabSheetName })
          }),
          fetch('/api/fetch-from-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scriptUrl, spreadsheetId: id, sheetName: grammarSheetName })
          })
        ]);

        const contentTypeWb = wbRes.headers.get('content-type') || '';
        const contentTypeVocab = vocabRes.headers.get('content-type') || '';
        const contentTypeGrammar = grammarRes.headers.get('content-type') || '';

        if (
          wbRes.status === 404 || 
          vocabRes.status === 404 || 
          grammarRes.status === 404 ||
          !contentTypeWb.includes('application/json') ||
          !contentTypeVocab.includes('application/json') ||
          !contentTypeGrammar.includes('application/json')
        ) {
          console.warn("Express API endpoints not found or not returning JSON. Likely running on a static hosting environment like Vercel. Falling back to direct client-side CSV fetch.");
          useClientFallback = true;
        }
      } catch (err) {
        console.warn("Network error reaching Express server, falling back to direct client-side CSV fetch:", err);
        useClientFallback = true;
      }

      if (useClientFallback) {
        // Direct browser CSV fetch bypasses Express server
        console.log("Syncing directly from Google Sheets CSV export on the client...");
        const [wbData, vocabData, grammarData] = await Promise.all([
          fetchWhiteboardFromSheet(id, whiteboardSheetName),
          fetchVocabFromSheet(id, vocabSheetName),
          fetchGrammarFromSheet(id, grammarSheetName)
        ]);

        whiteboardItems = wbData;
        vocabItems = vocabData;
        grammarItems = grammarData;
      } else {
        if (!wbRes!.ok) {
          const errData = await wbRes!.json().catch(() => ({}));
          throw new Error(errData.error || `Lỗi tải dữ liệu Bảng Trắng (${wbRes!.status})`);
        }
        if (!vocabRes!.ok) {
          const errData = await vocabRes!.json().catch(() => ({}));
          throw new Error(errData.error || `Lỗi tải dữ liệu Từ vựng (${vocabRes!.status})`);
        }
        if (!grammarRes!.ok) {
          const errData = await grammarRes!.json().catch(() => ({}));
          throw new Error(errData.error || `Lỗi tải dữ liệu Ghép câu (${grammarRes!.status})`);
        }

        const wbResult = await wbRes!.json();
        const vocabResult = await vocabRes!.json();
        const grammarResult = await grammarRes!.json();

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

        whiteboardItems = Object.keys(tabMap).map((title, idx) => ({
          id: `sheet-wb-tab-${idx}`,
          title,
          lines: tabMap[title]
        }));

        // Parse Vocab rows
        const vocabRows = vocabResult.data;
        for (let i = 1; i < vocabRows.length; i++) {
          const row = vocabRows[i];
          if (row.length < 2 || !row[0] || !row[1]) continue;
          vocabItems.push({
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
      }

      // Make sure we actually retrieved some items so we don't wipe data accidentally
      if (whiteboardItems.length === 0 && vocabItems.length === 0 && grammarItems.length === 0) {
        throw new Error(activeLang === 'vi' 
          ? "Không lấy được dữ liệu nào từ Google Sheet. Vui lòng kiểm tra lại cấu hình và dữ liệu trong Sheet." 
          : "No data rows retrieved. Please check sheet configuration.");
      }

      onSyncComplete(vocabItems, grammarItems, whiteboardItems, sheetUrl, vocabSheetName, grammarSheetName, whiteboardSheetName);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đồng bộ hóa thất bại. Đảm bảo trang tính đã được Chia sẻ ở chế độ công khai (Bất kỳ ai có liên kết đều có thể xem).");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="sync-modal-container">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-500 rounded-2xl text-white shadow-md shadow-orange-500/10">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">{localT.sync_title}</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{localT.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSync} className="p-6 space-y-5 overflow-y-auto flex-grow">
          
          {/* Instructions */}
          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed border border-slate-100">
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-orange-500 shrink-0" />
              {localT.how_to}
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1">
              <li>{localT.step1}</li>
              <li>{localT.step2}</li>
            </ol>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleUseSample}
                className="text-[11px] font-black text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{localT.sample}</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{localT.label_url}</label>
              <input
                type="url"
                required
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Whiteboard Sheet Name/Index (Sheet 0) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{localT.label_wb}</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0 hoặc Sheet1"
                  value={whiteboardSheetName}
                  onChange={(e) => setWhiteboardSheetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">{localT.wb_desc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vocab Sheet Name/Index (Sheet 1) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{localT.label_vocab}</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 1 hoặc Sheet2"
                    value={vocabSheetName}
                    onChange={(e) => setVocabSheetName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">{localT.vocab_desc}</p>
                </div>

                {/* Grammar Sheet Name/Index (Sheet 2) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{localT.label_grammar}</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 2 hoặc Sheet3"
                    value={grammarSheetName}
                    onChange={(e) => setGrammarSheetName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">{localT.grammar_desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start space-x-2 text-rose-800 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center space-x-2 text-green-800 text-xs font-bold">
              <Check className="w-5 h-5 text-green-500 shrink-0" />
              <span>{localT.success_msg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
            >
              {localT.cancel}
            </button>
            <button
              type="submit"
              disabled={syncing}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/15 flex items-center space-x-1.5 cursor-pointer disabled:bg-slate-300 disabled:shadow-none"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{localT.loading}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{localT.btn_sync}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
