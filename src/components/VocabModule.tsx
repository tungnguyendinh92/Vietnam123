/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { VocabItem, GrammarPuzzle, WhiteboardTab } from '../types';
import { 
  Volume2, CheckCircle2, RotateCcw, Plus, Search, Edit2, Check, X, Trash2, 
  BookOpen, Eye, Play, Sparkles, AlertCircle, FileSpreadsheet, Settings2,
  UploadCloud, Copy, ExternalLink, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractSpreadsheetId, serializeWordsToString } from '../utils/sheetParser';
import { AppLang } from '../utils/translations';

interface VocabModuleProps {
  vocabItems: VocabItem[];
  onUpdateVocab: (updated: VocabItem[]) => void;
  onOpenSyncModal: () => void;
  sheetUrl: string;
  vocabSheetName: string;
  grammarSheetName: string;
  whiteboardSheetName: string;
  whiteboardTabs: WhiteboardTab[];
  puzzles: GrammarPuzzle[];
  scriptUrl: string;
  onUpdateScriptUrl: (url: string) => void;
  appLang?: AppLang;
}

export default function VocabModule({ 
  vocabItems, 
  onUpdateVocab, 
  onOpenSyncModal,
  sheetUrl,
  vocabSheetName,
  grammarSheetName,
  whiteboardSheetName,
  whiteboardTabs,
  puzzles,
  scriptUrl,
  onUpdateScriptUrl,
  appLang
}: VocabModuleProps) {
  // Views: 'flashcard' or 'list'
  const [viewMode, setViewMode] = useState<'flashcard' | 'list'>('flashcard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [hideMemorized, setHideMemorized] = useState(false);

  // Flashcard state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoTts, setAutoTts] = useState(true);
  const [ttsLanguage, setTtsLanguage] = useState<'vi' | 'en'>('vi');

  // New customizable Flashcard options
  const [frontLanguage, setFrontLanguage] = useState<'vi' | 'en'>('vi');
  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<VocabItem[]>([]);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlaySeconds, setAutoPlaySeconds] = useState<number>(4);

  // TTS Voice state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');

  // Editing state (Inline list editing)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVi, setEditVi] = useState('');
  const [editEn, setEditEn] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editExampleEn, setEditExampleEn] = useState('');

  // Add new word state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVi, setNewVi] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newExampleEn, setNewExampleEn] = useState('');

  // Google Apps Script state & handlers
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(false);

  const scriptCode = `function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var spreadsheetId = params.spreadsheetId;
    var sheetName = params.sheetName;
    var data = params.data;
    
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet;
    
    if (/^\\d+$/.test(sheetName)) {
      var num = parseInt(sheetName, 10);
      var sheets = ss.getSheets();
      
      // Ưu tiên hiểu là Số thứ tự (Index: 0, 1, 2) nếu số nhỏ hơn tổng số trang tính
      if (num >= 0 && num < sheets.length) {
        sheet = sheets[num];
      } else {
        // Nếu không, tìm theo GID
        for (var i = 0; i < sheets.length; i++) {
          if (sheets[i].getSheetId() === num) {
            sheet = sheets[i];
            break;
          }
        }
      }
    }
    
    if (!sheet && sheetName) {
      sheet = ss.getSheetByName(sheetName);
    }
    
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 6)).clearContent();
    }
    
    // Auto-create 6th column header if it doesn't exist
    var headerRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 6));
    var headers = headerRange.getValues()[0];
    if (headers.length < 6 || !headers[5]) {
      sheet.getRange(1, 6).setValue("Đã thuộc");
    }
    
    if (data && data.length > 0) {
      var maxCols = 6;
      data.forEach(function(row) {
        if (row.length > maxCols) maxCols = row.length;
      });
      
      var formattedData = data.map(function(row) {
        while (row.length < maxCols) {
          row.push("");
        }
        return row;
      });
      
      sheet.getRange(2, 1, formattedData.length, maxCols).setValues(formattedData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var spreadsheetId = e.parameter.spreadsheetId;
    var sheetName = e.parameter.sheetName;
    
    if (!spreadsheetId) {
      return ContentService.createTextOutput("VietLearn Sync Script is active! Use POST to sync or GET with spreadsheetId & sheetName to fetch data.")
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet;
    
    if (/^\\d+$/.test(sheetName)) {
      var num = parseInt(sheetName, 10);
      var sheets = ss.getSheets();
      
      // Ưu tiên hiểu là Số thứ tự (Index: 0, 1, 2) nếu số nhỏ hơn tổng số trang tính
      if (num >= 0 && num < sheets.length) {
        sheet = sheets[num];
      } else {
        // Nếu không, tìm theo GID
        for (var i = 0; i < sheets.length; i++) {
          if (sheets[i].getSheetId() === num) {
            sheet = sheets[i];
            break;
          }
        }
      }
    }
    
    if (!sheet && sheetName) {
      sheet = ss.getSheetByName(sheetName);
    }
    
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }
    
    var values = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: values }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScriptCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handlePushToSheet = async () => {
    if (!sheetUrl) {
      setPushError("Chưa liên kết Google Sheet. Vui lòng bấm 'Liên kết Google Sheet' trước.");
      return;
    }
    if (!scriptUrl) {
      setPushError("Vui lòng điền Đường dẫn Apps Script Web App để thực hiện đẩy dữ liệu.");
      setShowScriptGuide(true);
      return;
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      setPushError("Đường dẫn Google Sheet không hợp lệ.");
      return;
    }

    setPushing(true);
    setPushError(null);
    setPushSuccess(false);

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

      const pushDataToSheet = async (sheetName: string, data: any[][]) => {
        let useDirectPush = false;
        try {
          const res = await fetch('/api/push-to-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scriptUrl,
              spreadsheetId,
              sheetName,
              data
            })
          });
          const contentType = res.headers.get('content-type') || '';
          if (res.status === 404 || !contentType.includes('application/json')) {
            useDirectPush = true;
          } else {
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.error || `Yêu cầu thất bại (${res.status}).`);
            }
            return await res.json();
          }
        } catch (err) {
          console.warn("Express server push failed or not found, falling back to direct browser post:", err);
          useDirectPush = true;
        }

        if (useDirectPush) {
          const res = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
              spreadsheetId,
              sheetName,
              data
            })
          });
          if (!res.ok) {
            throw new Error(`Google Apps Script trả về lỗi: ${res.status}`);
          }
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.status === 'error') {
              throw new Error(json.message || "Lỗi lưu dữ liệu trong Apps Script.");
            }
            return json;
          } catch {
            return { status: "success", raw: text };
          }
        }
      };

      // Step 1: Push Whiteboard
      await pushDataToSheet(whiteboardSheetName || '0', wbRows);

      // Step 2: Push Vocabulary
      await pushDataToSheet(vocabSheetName || '1', vocabRows);

      // Step 3: Push Sentence
      await pushDataToSheet(grammarSheetName || '2', grammarRows);

      setPushSuccess(true);
      setTimeout(() => setPushSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setPushError(err.message || 'Lỗi bất ngờ xảy ra khi kết nối tới Apps Script.');
    } finally {
      setPushing(false);
    }
  };

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Set default Vietnamese or English voice if available
        if (availableVoices.length > 0 && !selectedVoiceUri) {
          const defaultViVoice = availableVoices.find(v => v.lang.startsWith('vi'));
          const defaultEnVoice = availableVoices.find(v => v.lang.startsWith('en'));
          if (defaultViVoice) {
            setSelectedVoiceUri(defaultViVoice.voiceURI);
          } else if (defaultEnVoice) {
            setSelectedVoiceUri(defaultEnVoice.voiceURI);
          } else {
            setSelectedVoiceUri(availableVoices[0].voiceURI);
          }
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceUri]);

  // Handle auto speech on card show or flip
  const speakText = (text: string, lang: 'vi' | 'en') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop current reading

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find if the chosen/configured voice matches the requested language
    const chosenVoice = voices.find(v => v.voiceURI === selectedVoiceUri);
    if (chosenVoice && chosenVoice.lang.toLowerCase().startsWith(lang)) {
      utterance.voice = chosenVoice;
    } else {
      // Dynamic lookup: Find the first available voice in the system that matches the requested language
      const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = 0.9; // Slightly slower for clear learning pronunciation
    window.speechSynthesis.speak(utterance);
  };

  // Speak both Vietnamese and English in sequence, starting with the specified one
  const speakBoth = (vi: string, en: string, startWith: 'vi' | 'en') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // cancel any active speech

    const firstText = startWith === 'vi' ? vi : en;
    const firstLang = startWith === 'vi' ? 'vi' : 'en';
    const secondText = startWith === 'vi' ? en : vi;
    const secondLang = startWith === 'vi' ? 'en' : 'vi';

    const firstUtterance = new SpeechSynthesisUtterance(firstText);
    const chosenVoice1 = voices.find(v => v.voiceURI === selectedVoiceUri);
    if (chosenVoice1 && chosenVoice1.lang.toLowerCase().startsWith(firstLang)) {
      firstUtterance.voice = chosenVoice1;
    } else {
      const matchingVoice1 = voices.find(v => v.lang.toLowerCase().startsWith(firstLang));
      if (matchingVoice1) {
        firstUtterance.voice = matchingVoice1;
      }
    }
    firstUtterance.lang = firstLang === 'vi' ? 'vi-VN' : 'en-US';
    firstUtterance.rate = 0.9;

    firstUtterance.onend = () => {
      // Wait slightly, then speak the other language
      setTimeout(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        const secondUtterance = new SpeechSynthesisUtterance(secondText);
        const chosenVoice2 = voices.find(v => v.voiceURI === selectedVoiceUri);
        if (chosenVoice2 && chosenVoice2.lang.toLowerCase().startsWith(secondLang)) {
          secondUtterance.voice = chosenVoice2;
        } else {
          const matchingVoice2 = voices.find(v => v.lang.toLowerCase().startsWith(secondLang));
          if (matchingVoice2) {
            secondUtterance.voice = matchingVoice2;
          }
        }
        secondUtterance.lang = secondLang === 'vi' ? 'vi-VN' : 'en-US';
        secondUtterance.rate = 0.9;
        window.speechSynthesis.speak(secondUtterance);
      }, 400);
    };

    window.speechSynthesis.speak(firstUtterance);
  };

  // Get distinct topics for filter dropdown
  const topics = ['All', ...Array.from(new Set(vocabItems.map(item => item.topic)))];

  // Filtered vocabulary list
  const filteredItems = vocabItems.filter(item => {
    const matchesSearch = item.vi.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.en.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'All' || item.topic === selectedTopic;
    const matchesMemorized = !hideMemorized || !item.memorized;
    return matchesSearch && matchesTopic && matchesMemorized;
  });

  // Track and update shuffled items
  useEffect(() => {
    if (isShuffle) {
      const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
      setShuffledItems(shuffled);
    } else {
      setShuffledItems([]);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [isShuffle, filteredItems.length, selectedTopic, searchQuery, hideMemorized]);

  // Determine active flashcards sequence
  const activeFlashcards = isShuffle ? shuffledItems : filteredItems;

  // Handle auto-flip / slideshow timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoPlay && activeFlashcards.length > 0 && viewMode === 'flashcard') {
      timer = setInterval(() => {
        setIsFlipped(prev => {
          if (!prev) {
            // Flip to back side
            return true;
          } else {
            // Advance to next card and reset to front side
            setCurrentIndex(idx => (idx + 1) % activeFlashcards.length);
            return false;
          }
        });
      }, autoPlaySeconds * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoPlay, autoPlaySeconds, activeFlashcards.length, viewMode]);

  // Automatically speak when card index changes or card is flipped (only 1 face at a time)
  useEffect(() => {
    if (activeFlashcards.length > 0 && autoTts && viewMode === 'flashcard') {
      const currentItem = activeFlashcards[currentIndex];
      if (currentItem) {
        // Detect visible language on card
        const visibleLang = isFlipped 
          ? (frontLanguage === 'vi' ? 'en' : 'vi') 
          : frontLanguage;
        
        const textToSpeak = visibleLang === 'vi' ? currentItem.vi : currentItem.en;
        speakText(textToSpeak, visibleLang);
      }
    }
  }, [currentIndex, isFlipped, viewMode, activeFlashcards.length, frontLanguage, autoTts]);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeFlashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeFlashcards.length) % activeFlashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleToggleMemorized = (id: string) => {
    const updated = vocabItems.map(item => {
      if (item.id === id) {
        return { ...item, memorized: !item.memorized };
      }
      return item;
    });
    onUpdateVocab(updated);
  };

  // Inline Editing
  const startEdit = (item: VocabItem) => {
    setEditingId(item.id);
    setEditVi(item.vi);
    setEditEn(item.en);
    setEditTopic(item.topic);
    setEditExample(item.example || '');
    setEditExampleEn(item.exampleEn || '');
  };

  const saveEdit = (id: string) => {
    const updated = vocabItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          vi: editVi,
          en: editEn,
          topic: editTopic || 'Chung',
          example: editExample || undefined,
          exampleEn: editExampleEn || undefined
        };
      }
      return item;
    });
    onUpdateVocab(updated);
    setEditingId(null);
  };

  // Delete Item
  const handleDelete = (id: string) => {
    const updated = vocabItems.filter(item => item.id !== id);
    onUpdateVocab(updated);
    // Adjust index if out of bounds
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  // Add Item
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVi || !newEn) return;

    const newItem: VocabItem = {
      id: `custom-v-${Date.now()}`,
      vi: newVi,
      en: newEn,
      topic: newTopic || 'Chung',
      example: newExample || undefined,
      exampleEn: newExampleEn || undefined,
      memorized: false
    };

    onUpdateVocab([newItem, ...vocabItems]);
    setNewVi('');
    setNewEn('');
    setNewTopic('');
    setNewExample('');
    setNewExampleEn('');
    setShowAddForm(false);
    // Reset index to newly added card
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentItem = activeFlashcards[currentIndex];

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Mode switch button */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode('flashcard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                viewMode === 'flashcard' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Thẻ Flashcard
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Danh sách từ
            </button>
          </div>

          {/* Add Word Toggle */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm từ mới</span>
          </button>

          {/* Quick Push to Sheet */}
          <button
            onClick={handlePushToSheet}
            disabled={pushing}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all duration-200 cursor-pointer disabled:shadow-none"
            title="Đẩy dữ liệu hiện tại lên đúng Google Sheet của tab này"
          >
            {pushing ? (
              <span className="flex items-center space-x-1">
                <span className="animate-spin mr-1">⌛</span>
                <span>Đang đẩy...</span>
              </span>
            ) : (
              <>
                <UploadCloud className="w-4.5 h-4.5" />
                <span>Đẩy lên Sheet</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm từ vựng..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          {/* Topic filter dropdown */}
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setCurrentIndex(0);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-600 font-medium"
          >
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic === 'All' ? 'Tất cả chủ đề' : topic}</option>
            ))}
          </select>

          {/* Hide memorized words toggle */}
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={hideMemorized}
              onChange={(e) => {
                setHideMemorized(e.target.checked);
                setCurrentIndex(0);
              }}
              className="rounded-md border-slate-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Ẩn từ đã thuộc</span>
          </label>
        </div>
      </div>

      {/* Add form overlay / accordion */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddNew}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-orange-500" />
                Thêm từ vựng mới vào kho lưu trữ
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cụm từ tiếng Việt *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xin chào"
                  value={newVi}
                  onChange={(e) => setNewVi(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nghĩa tiếng Anh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hello"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chủ đề / Nhóm từ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chào hỏi, Gia đình, Ăn uống..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Câu ví dụ bằng Tiếng Việt (Không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xin chào bạn khỏe không?"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dịch nghĩa câu ví dụ (Không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hello, how are you?"
                  value={newExampleEn}
                  onChange={(e) => setNewExampleEn(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition-all duration-200 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer"
              >
                Thêm vào dữ liệu
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Spreadsheet & Script Synchronization Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2 text-slate-800 text-xs font-bold">
            <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
            <span>ĐỒNG BỘ NGƯỢC LÊN GOOGLE SHEET:</span>
            {sheetUrl ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-600 font-extrabold border border-emerald-100">
                Đã liên kết ({vocabSheetName ? `Sheet: ${vocabSheetName}` : 'Trang 1'})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500 font-extrabold border border-slate-200">
                Chưa có liên kết Sheet
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowScriptGuide(!showScriptGuide)}
            className="text-xs text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showScriptGuide ? 'Ẩn Hướng dẫn Triển khai' : 'Xem Hướng dẫn & Lấy mã Script'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Đường dẫn Google Apps Script Web App (URL) *
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={scriptUrl}
              onChange={(e) => onUpdateScriptUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handlePushToSheet}
              disabled={pushing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/10 flex items-center justify-center space-x-1.5 cursor-pointer disabled:shadow-none"
            >
              {pushing ? (
                <>
                  <span className="animate-spin mr-1">⌛</span>
                  <span>Đang đẩy dữ liệu...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Đẩy dữ liệu lên Google Sheet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {pushError && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start space-x-2 text-rose-800 text-[11px] leading-relaxed animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{pushError}</span>
          </div>
        )}

        {pushSuccess && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center space-x-2 text-green-800 text-[11px] font-bold animate-fade-in">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span>Đẩy dữ liệu thành công! Trạng thái cột thuộc đã đồng bộ ngược lên Google Sheet (Cột thứ 6).</span>
          </div>
        )}

        <AnimatePresence>
          {showScriptGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100 pt-4 mt-2 space-y-3 overflow-hidden text-xs text-slate-600"
            >
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Cách thiết lập Google Apps Script để đẩy dữ liệu lên trang tính:
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-600">
                  <li>
                    Mở Google Sheet của bạn. Chọn <strong>Tiện ích mở rộng (Extensions)</strong> {"->"} <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Xóa sạch các dòng mã có sẵn, sao chép đoạn mã script dưới đây và dán vào:
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={copyScriptCode}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-3xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedScript ? 'Đã sao chép thành công!' : 'Sao chép đoạn mã Script này'}</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    Nhấn nút <strong>Triển khai (Deploy)</strong> ở góc trên bên phải {"->"} Chọn <strong>Triển khai mới (New deployment)</strong>.
                  </li>
                  <li>
                    Chọn loại cấu hình là <strong>Ứng dụng web (Web app)</strong> (nhấn icon bánh răng nếu không thấy).
                  </li>
                  <li>
                    Tại mục "Thực thi dưới dạng" (Execute as), chọn <strong>Tôi (Me)</strong>. Tại mục "Ai có quyền truy cập" (Who has access), chọn <strong>Bất kỳ ai (Anyone)</strong>.
                  </li>
                  <li>
                    Nhấn <strong>Triển khai (Deploy)</strong>, chọn <strong>Ủy quyền truy cập (Authorize access)</strong> và cấp quyền cho ứng dụng.
                  </li>
                  <li>
                    Sao chép đường dẫn <strong>URL Ứng dụng web (Web app URL)</strong> nhận được dán vào ô nhập liệu ở trên!
                  </li>
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice configuration panel */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-3 text-slate-700 text-xs font-semibold">
          <Settings2 className="w-4 h-4 text-slate-500" />
          <span>Cấu hình giọng đọc (TTS Browser):</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={selectedVoiceUri}
            onChange={(e) => setSelectedVoiceUri(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl text-xs px-3.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-600 max-w-xs"
          >
            {voices.length === 0 ? (
              <option value="">Đang tải giọng đọc hệ thống...</option>
            ) : (
              voices.map(voice => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))
            )}
          </select>

          <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoTts}
              onChange={(e) => setAutoTts(e.target.checked)}
              className="rounded-md border-slate-300 text-orange-500 focus:ring-orange-500"
            />
            <span>Đọc tự động khi lật thẻ</span>
          </label>
        </div>
      </div>

      {/* Main learning layout */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-50 rounded-3xl border border-slate-200 py-16 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-700 mb-1">Không tìm thấy từ vựng nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Thử thay đổi bộ lọc chủ đề hoặc tìm kiếm cụm từ khác. Bạn cũng có thể liên kết thêm tài liệu từ Google Sheet.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTopic('All');
                setHideMemorized(false);
              }}
              className="px-4 py-2 border border-slate-200 hover:bg-white rounded-xl text-xs font-semibold text-slate-600 transition-all cursor-pointer"
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={onOpenSyncModal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Liên kết Google Sheet
            </button>
          </div>
        </div>
      ) : viewMode === 'flashcard' ? (
        /* FLASHCARD VIEW */
        <div className="flex flex-col items-center py-6 w-full max-w-2xl mx-auto space-y-6">
          {/* Flashcard Customizing Toolbar */}
          <div className="w-full bg-orange-50/40 border border-orange-100 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700 shadow-3xs">
            {/* Front Language Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Mặt trước của thẻ:</span>
              <div className="grid grid-cols-2 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setFrontLanguage('vi');
                    setIsFlipped(false);
                  }}
                  className={`py-1.5 rounded-lg text-center font-bold text-[11px] cursor-pointer transition-all ${
                    frontLanguage === 'vi' ? 'bg-orange-500 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFrontLanguage('en');
                    setIsFlipped(false);
                  }}
                  className={`py-1.5 rounded-lg text-center font-bold text-[11px] cursor-pointer transition-all ${
                    frontLanguage === 'en' ? 'bg-orange-500 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tiếng Anh
                </button>
              </div>
            </div>

            {/* Shuffle Order Switcher */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Thứ tự hiển thị:</span>
              <div className="grid grid-cols-2 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setIsShuffle(false)}
                  className={`py-1.5 rounded-lg text-center font-bold text-[11px] cursor-pointer transition-all ${
                    !isShuffle ? 'bg-orange-500 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Theo thứ tự
                </button>
                <button
                  type="button"
                  onClick={() => setIsShuffle(true)}
                  className={`py-1.5 rounded-lg text-center font-bold text-[11px] cursor-pointer transition-all ${
                    isShuffle ? 'bg-orange-500 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Ngẫu nhiên (Xáo)
                </button>
              </div>
            </div>

            {/* Auto Flip / Slideshow Controls */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tự động lật mặt thẻ:</span>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                    isAutoPlay 
                      ? 'bg-rose-500 border-rose-600 text-white animate-pulse shadow-rose-500/10 shadow-sm' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {isAutoPlay ? '⏹ Dừng phát' : '▶ Tự động lật'}
                </button>

                {isAutoPlay && (
                  <div className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50 flex-grow">
                    {[3, 4, 5].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setAutoPlaySeconds(sec)}
                        className={`flex-grow py-1 rounded-lg text-center font-black text-[10px] cursor-pointer transition-all ${
                          autoPlaySeconds === sec ? 'bg-rose-500 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Card Frame */}
          <div className="w-full max-w-md h-80 relative perspective group select-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentItem.id}-${isFlipped}`}
                initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={handleFlip}
                className={`w-full h-full rounded-3xl cursor-pointer p-8 flex flex-col justify-between shadow-xl relative border-0 overflow-hidden ${
                  isFlipped 
                    ? 'bg-gradient-to-br from-slate-800 to-slate-950 text-white' 
                    : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                }`}
              >
                {/* Visual background circle decors */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full pointer-events-none"></div>

                {/* Topic / Status indicator */}
                <div className="flex justify-between items-center relative z-10">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    isFlipped 
                      ? 'bg-white/10 text-yellow-300' 
                      : 'bg-white/20 text-white'
                  }`}>
                    Topic: {currentItem.topic}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMemorized(currentItem.id);
                    }}
                    className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                      currentItem.memorized
                        ? 'text-yellow-300'
                        : 'text-white/40 hover:text-white/80'
                    }`}
                    title={currentItem.memorized ? 'Đã thuộc từ này' : 'Đánh dấu đã thuộc'}
                  >
                    <CheckCircle2 className="w-5 h-5 fill-current" />
                  </button>
                </div>

                {/* Central Term and audio trigger */}
                <div className="text-center space-y-3 my-auto relative z-10">
                  <div className="relative inline-block">
                    <h2 className="text-3xl font-black tracking-wide uppercase px-4 leading-normal text-white">
                      {isFlipped 
                        ? (frontLanguage === 'vi' ? currentItem.en : currentItem.vi) 
                        : (frontLanguage === 'vi' ? currentItem.vi : currentItem.en)
                      }
                    </h2>
                  </div>

                  <div className="h-0.5 w-12 bg-white/30 mx-auto my-3"></div>

                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentLang = isFlipped 
                          ? (frontLanguage === 'vi' ? 'en' : 'vi') 
                          : frontLanguage;
                        const textToSpeak = currentLang === 'vi' ? currentItem.vi : currentItem.en;
                        speakText(textToSpeak, currentLang);
                      }}
                      className="p-2.5 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all duration-200 cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Examples */}
                <div className="border-t border-white/25 pt-4 text-center relative z-10">
                  {currentItem.example && (
                    <p className="text-xs text-white/90 italic line-clamp-2">
                      {isFlipped 
                        ? (frontLanguage === 'vi' ? (currentItem.exampleEn || 'Example sentence in translation') : currentItem.example)
                        : (frontLanguage === 'vi' ? currentItem.example : (currentItem.exampleEn || 'Example sentence in translation'))
                      }
                    </p>
                  )}
                  <p className="text-[10px] mt-2 text-white/60 font-semibold tracking-wider uppercase">
                    {isFlipped 
                      ? `Nhấp để lật mặt trước (${frontLanguage === 'vi' ? 'Việt' : 'Anh'})` 
                      : `Nhấp để lật mặt sau (${frontLanguage === 'vi' ? 'Anh' : 'Việt'})`
                    }
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center space-x-6 mt-6">
            <button
              onClick={handlePrev}
              className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5 rotate-180" />
            </button>

            <span className="text-xs font-bold text-slate-500">
              Từ {currentIndex + 1} / {activeFlashcards.length}
            </span>

            <button
              onClick={handleNext}
              className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* GRID / LIST VIEW WITH INTEGRATED EDITING */
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Thuộc</th>
                  <th className="py-3 px-4 w-1/4">Tiếng Việt</th>
                  <th className="py-3 px-4 w-1/4">Tiếng Anh</th>
                  <th className="py-3 px-4 w-1/5">Chủ đề</th>
                  <th className="py-3 px-4 hidden md:table-cell">Ví dụ tham khảo</th>
                  <th className="py-3 px-4 w-28 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/50 transition-colors ${
                      item.memorized ? 'bg-orange-50/10 text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    {/* Memorized Status */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleMemorized(item.id)}
                        className={`cursor-pointer transition-colors ${
                          item.memorized ? 'text-orange-500' : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 fill-current mx-auto" />
                      </button>
                    </td>

                    {/* Edit mode vs Read mode columns */}
                    {editingId === item.id ? (
                      <>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editVi}
                            onChange={(e) => setEditVi(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editEn}
                            onChange={(e) => setEditEn(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editTopic}
                            onChange={(e) => setEditTopic(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none"
                          />
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editExample}
                              onChange={(e) => setEditExample(e.target.value)}
                              placeholder="Câu ví dụ Việt..."
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none text-[11px]"
                            />
                            <input
                              type="text"
                              value={editExampleEn}
                              onChange={(e) => setEditExampleEn(e.target.value)}
                              placeholder="Dịch ví dụ Anh..."
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none text-[11px]"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg cursor-pointer"
                              title="Lưu thay đổi"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer"
                              title="Hủy bỏ"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className={`font-bold ${item.memorized ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {item.vi}
                            </span>
                            <button
                              onClick={() => speakText(item.vi, 'vi')}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              title="Phát âm tiếng Việt"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          <div className="flex items-center space-x-1.5">
                            <span className={item.memorized ? 'line-through text-slate-400' : ''}>
                              {item.en}
                            </span>
                            <button
                              onClick={() => speakText(item.en, 'en')}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              title="Phát âm tiếng Anh"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] text-slate-500 font-semibold uppercase">
                            {item.topic}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic hidden md:table-cell max-w-xs truncate">
                          {item.example ? (
                            <div>
                              <p className="text-slate-700">{item.example}</p>
                              {item.exampleEn && <p className="text-slate-400 text-[11px]">{item.exampleEn}</p>}
                            </div>
                          ) : (
                            <span className="text-slate-300">Không có</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="Sửa từ vựng"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Xóa từ vựng"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
