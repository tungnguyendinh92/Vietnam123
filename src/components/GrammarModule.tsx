/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GrammarPuzzle } from '../types';
import { 
  Sparkles, CheckCircle2, AlertTriangle, RefreshCw, ChevronRight, HelpCircle, 
  Trophy, Flame, Volume2, Award, ArrowRight, Lightbulb,
  Edit2, Trash2, Plus, Search, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLang } from '../utils/translations';

const LOCAL_WORD_DICT: Record<string, string> = {
  'tôi': 'I',
  'là': 'am',
  'giáo viên': 'teacher',
  'tiếng việt': 'Vietnamese',
  'hôm nay': 'today',
  'bạn': 'you',
  'có': 'do/have',
  'khỏe': 'healthy / fine',
  'không': 'question marker',
  'rất': 'very',
  'thích': 'like',
  'ăn': 'eat',
  'phở bò': 'beef Pho',
  'phở': 'Pho (Vietnamese noodle soup)',
  'bò': 'beef',
  'uống': 'drink',
  'muốn': 'want',
  'cà phê': 'coffee',
  'sữa đá': 'iced milk coffee',
  'sữa': 'milk',
  'đá': 'ice / iced',
  'nhà': 'house / home',
  'của': 'of / belong to',
  'ở': 'in / at',
  'thành phố': 'city',
  'hồ chí minh': 'Ho Chi Minh',
  'thời tiết': 'weather',
  'ngày': 'day',
  'đẹp': 'beautiful',
  'và': 'and',
  'mát mẻ': 'cool',
  'ngày mai': 'tomorrow',
  'sẽ': 'will',
  'đi': 'go',
  'du lịch': 'travel',
  'hà nội': 'Hanoi',
  'giáo': 'teaching',
  'viên': 'member',
  'hôm': 'day',
  'nay': 'now/today',
  'cà': 'eggplant/coffee',
  'phê': 'feel high/coffee',
  'thành': 'become/city',
  'phố': 'street/city',
  'hồ': 'lake',
  'chí': 'will',
  'minh': 'bright',
  'thời': 'time',
  'tiết': 'saving/weather',
  'mát': 'cool',
  'mẻ': 'batch/cool',
  'mai': 'tomorrow',
  'du': 'travel',
  'lịch': 'calendar/history',
  'hà': 'river',
  'nội': 'inner'
};

function tokenizeVietnamese(sentence: string): string[] {
  // Clean basic punctuation but keep spaces and letter/number chars
  const cleanSentence = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
  
  // Extract compound words from LOCAL_WORD_DICT (keys with spaces)
  // Sort by length descending to match longest phrase segments first
  const compounds = Object.keys(LOCAL_WORD_DICT)
    .filter(k => k.includes(' '))
    .sort((a, b) => b.length - a.length);

  // Split sentence into raw syllables
  const syllables = cleanSentence.split(/\s+/).filter(Boolean);
  
  const tokens: string[] = [];
  let i = 0;
  while (i < syllables.length) {
    let matched = false;
    for (const compound of compounds) {
      const compoundSyllables = compound.split(' ');
      const len = compoundSyllables.length;
      if (i + len <= syllables.length) {
        const segment = syllables.slice(i, i + len).join(' ');
        if (segment.toLowerCase() === compound.toLowerCase()) {
          tokens.push(syllables.slice(i, i + len).join(' '));
          i += len;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      tokens.push(syllables[i]);
      i++;
    }
  }
  return tokens;
}


interface GrammarModuleProps {
  puzzles: GrammarPuzzle[];
  onUpdatePuzzles?: (updated: GrammarPuzzle[]) => void;
  appLang?: AppLang;
}

export default function GrammarModule({ puzzles, onUpdatePuzzles, appLang }: GrammarModuleProps) {
  // Level / Lesson selection state
  const [availableLessons, setAvailableLessons] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<string>('');

  // Active puzzle state
  const [currentPuzzle, setCurrentPuzzle] = useState<GrammarPuzzle | null>(null);
  const [scrambledWords, setScrambledWords] = useState<{ id: string; text: string }[]>([]);
  const [selectedWords, setSelectedWords] = useState<{ id: string; text: string }[]>([]);
  const [apiSegments, setApiSegments] = useState<Record<string, string>>({});
  
  // Game state
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // AI Explaining state
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');

  // View mode
  const [viewMode, setViewMode] = useState<'practice' | 'manage'>('practice');

  // Search & Filter for management view
  const [manageSearchQuery, setManageSearchQuery] = useState('');
  const [manageLessonFilter, setManageLessonFilter] = useState('All');

  // Editing state
  const [editingPuzzle, setEditingPuzzle] = useState<GrammarPuzzle | null>(null);
  const [editViSentence, setEditViSentence] = useState('');
  const [editEnSentence, setEditEnSentence] = useState('');
  const [editPuzzleLesson, setEditPuzzleLesson] = useState('');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // Add state
  const [isAddingPuzzle, setIsAddingPuzzle] = useState(false);
  const [newViSentence, setNewViSentence] = useState('');
  const [newEnSentence, setNewEnSentence] = useState('');
  const [newPuzzleLesson, setNewPuzzleLesson] = useState('');

  const handleSavePuzzle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingPuzzle || !onUpdatePuzzles) return;

    const updated = puzzles.map(p => {
      if (p.id === editingPuzzle.id) {
        return {
          ...p,
          viSentence: editViSentence,
          enSentence: editEnSentence,
          lesson: editPuzzleLesson || 'Bài tập chung'
        };
      }
      return p;
    });

    onUpdatePuzzles(updated);
    setIsEditingModalOpen(false);
    setEditingPuzzle(null);

    // If currently active puzzle was edited, refresh its scrambled words
    if (currentPuzzle && currentPuzzle.id === editingPuzzle.id) {
      const updatedItem = updated.find(p => p.id === editingPuzzle.id);
      if (updatedItem) {
        initPuzzle(updatedItem);
      }
    }
  };

  const handleAddPuzzle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViSentence || !newEnSentence || !onUpdatePuzzles) return;

    const newPuzzle: GrammarPuzzle = {
      id: `custom-g-${Date.now()}`,
      viSentence: newViSentence,
      enSentence: newEnSentence,
      lesson: newPuzzleLesson || 'Bài tập chung'
    };

    const updated = [...puzzles, newPuzzle];
    onUpdatePuzzles(updated);
    setIsAddingPuzzle(false);
    setNewViSentence('');
    setNewEnSentence('');
    setNewPuzzleLesson('');

    // Select this lesson if it is new
    if (newPuzzleLesson && !availableLessons.includes(newPuzzleLesson)) {
      setSelectedLesson(newPuzzleLesson);
    }
  };

  const handleDeletePuzzle = (id: string) => {
    if (!onUpdatePuzzles) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu này không?")) return;

    const updated = puzzles.filter(p => p.id !== id);
    onUpdatePuzzles(updated);

    // If the active puzzle was deleted, select another one or clear it
    if (currentPuzzle && currentPuzzle.id === id) {
      if (updated.length > 0) {
        const lessonPuzzles = updated.filter(p => p.lesson === selectedLesson);
        if (lessonPuzzles.length > 0) {
          initPuzzle(lessonPuzzles[0]);
        } else {
          initPuzzle(updated[0]);
        }
      } else {
        setCurrentPuzzle(null);
      }
    }
  };

  // Extract available lessons/levels
  useEffect(() => {
    if (puzzles.length > 0) {
      const lessons = Array.from(new Set(puzzles.map(p => p.lesson)));
      setAvailableLessons(lessons);
      if (!selectedLesson || !lessons.includes(selectedLesson)) {
        setSelectedLesson(lessons[0]);
      }
    }
  }, [puzzles]);

  // Load a random or next puzzle for the selected lesson
  useEffect(() => {
    if (selectedLesson && puzzles.length > 0) {
      const lessonPuzzles = puzzles.filter(p => p.lesson === selectedLesson);
      if (lessonPuzzles.length > 0) {
        // Pick random
        const randomIndex = Math.floor(Math.random() * lessonPuzzles.length);
        initPuzzle(lessonPuzzles[randomIndex]);
      } else {
        setCurrentPuzzle(null);
      }
    }
  }, [selectedLesson, puzzles]);

  // Fetch missing segment translations from AI API
  useEffect(() => {
    if (!currentPuzzle) return;
    
    const rawWords = currentPuzzle.viSentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/).filter(Boolean);
    const hasMissing = rawWords.some(w => !LOCAL_WORD_DICT[w.toLowerCase()]);
    
    if (hasMissing) {
      const fetchSegments = async () => {
        try {
          const response = await fetch('/api/translate-whiteboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: currentPuzzle.viSentence })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.words && Array.isArray(data.words)) {
              const newDict: Record<string, string> = {};
              data.words.forEach((item: { vi: string; en: string }) => {
                newDict[item.vi.toLowerCase()] = item.en;
              });
              setApiSegments(newDict);
            }
          }
        } catch (err) {
          console.error("Lỗi lấy nghĩa từ từ AI:", err);
        }
      };
      fetchSegments();
    } else {
      setApiSegments({});
    }
  }, [currentPuzzle]);

  // Scramble and prepare words for an exercise
  const initPuzzle = (puzzle: GrammarPuzzle) => {
    setCurrentPuzzle(puzzle);
    setSelectedWords([]);
    setChecked(false);
    setIsCorrect(false);
    setAiExplanation('');

    // Tokenize using our smart Vietnamese compound-preserving tokenizer
    const tokens = tokenizeVietnamese(puzzle.viSentence);
    const cleanedWords = tokens.map((w, index) => {
      return {
        id: `word-${index}-${Date.now()}`,
        text: w
      };
    }).filter(w => w.text !== '');

    // Scramble the array
    const scrambled = [...cleanedWords].sort(() => Math.random() - 0.5);
    setScrambledWords(scrambled);
  };

  const handleWordSelect = (word: { id: string; text: string }) => {
    if (checked) return;
    // Add to selected, remove from scrambled
    setSelectedWords([...selectedWords, word]);
    setScrambledWords(scrambledWords.filter(w => w.id !== word.id));
  };

  const handleWordDeselect = (word: { id: string; text: string }) => {
    if (checked) return;
    // Add back to scrambled, remove from selected
    setScrambledWords([...scrambledWords, word]);
    setSelectedWords(selectedWords.filter(w => w.id !== word.id));
  };

  const checkAnswer = () => {
    if (!currentPuzzle) return;

    // Standardize comparison: join selected words, strip spaces/punc
    const userAnswer = selectedWords.map(w => w.text.toLowerCase()).join(' ');
    const correctAnswer = currentPuzzle.viSentence.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();

    const correct = userAnswer === correctAnswer;
    setIsCorrect(correct);
    setChecked(true);

    if (correct) {
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const resetActive = () => {
    if (!currentPuzzle) return;
    initPuzzle(currentPuzzle);
  };

  const handleNextPuzzle = () => {
    if (!selectedLesson || puzzles.length === 0) return;
    const lessonPuzzles = puzzles.filter(p => p.lesson === selectedLesson);
    if (lessonPuzzles.length > 0) {
      // Pick a different random puzzle if possible
      let nextPuzzle = lessonPuzzles[Math.floor(Math.random() * lessonPuzzles.length)];
      if (lessonPuzzles.length > 1 && currentPuzzle && nextPuzzle.id === currentPuzzle.id) {
        const filtered = lessonPuzzles.filter(p => p.id !== currentPuzzle.id);
        nextPuzzle = filtered[Math.floor(Math.random() * filtered.length)];
      }
      initPuzzle(nextPuzzle);
    }
  };

  // Speaks the sentence using SpeechSynthesis
  const speakSentence = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Queries Gemini to explain the sentence
  const askAiForExplanation = async () => {
    if (!currentPuzzle) return;
    setLoadingAi(true);
    setAiExplanation('');

    try {
      const response = await fetch('/api/explain-grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viSentence: currentPuzzle.viSentence,
          enSentence: currentPuzzle.enSentence
        })
      });

      if (!response.ok) throw new Error("Yêu cầu giải thích ngữ pháp thất bại.");
      const data = await response.json();
      setAiExplanation(data.explanation);
    } catch (err: any) {
      console.error(err);
      setAiExplanation("Không thể tải giải thích của AI vào lúc này. Vui lòng thử lại!");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Tab Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Mode switch button */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setViewMode('practice')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                viewMode === 'practice' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Luyện tập ngữ pháp
            </button>
            <button
              type="button"
              onClick={() => setViewMode('manage')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                viewMode === 'manage' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quản lý câu hỏi ({puzzles.length})
            </button>
          </div>
        </div>

        {viewMode === 'manage' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsAddingPuzzle(true)}
              className="w-full md:w-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm câu mới
            </button>
          </div>
        )}
      </div>

      {viewMode === 'practice' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Lesson Selector & Scores */}
          <div className="space-y-6">
            {/* Lesson List */}
            <div className="bg-white rounded-2xl border-2 border-yellow-400/60 p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-orange-500" />
                Chọn Bài học & Trình độ
              </h3>
          
          <div className="space-y-2">
            {availableLessons.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Đang tải danh sách bài học...</p>
            ) : (
              availableLessons.map((lesson) => {
                const isActive = lesson === selectedLesson;
                const lessonPuzzles = puzzles.filter(p => p.lesson === lesson);
                return (
                  <button
                    key={lesson}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isActive 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/15' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{lesson}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-orange-700 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {lessonPuzzles.length} câu
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Scores & Streak */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white flex justify-between items-center relative overflow-hidden shadow-md border-b-4 border-orange-500">
          {/* Ambient light ornament */}
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl"></div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Điểm tích lũy</p>
                <p className="text-2xl font-black text-white">{score} điểm</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chuỗi trả lời đúng</p>
                <p className="text-2xl font-black text-white">{streak} 🔥</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 font-bold">CẤP ĐỘ</p>
            <p className="text-3xl font-extrabold text-yellow-400 mt-1">
              {Math.floor(score / 50) + 1}
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Scramble Game Canvas */}
      <div className="lg:col-span-2 space-y-6">
        {currentPuzzle ? (
          <div className="bg-white rounded-3xl border-2 border-yellow-400 p-6 md:p-8 shadow-sm space-y-8">
            {/* Exercise Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-orange-100">
                  {currentPuzzle.lesson}
                </span>
                <h4 className="text-xs text-slate-500 font-medium">Sắp xếp các khối từ sau để tạo thành câu hoàn chỉnh phù hợp với nghĩa tiếng Anh:</h4>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPuzzle(currentPuzzle);
                    setEditViSentence(currentPuzzle.viSentence);
                    setEditEnSentence(currentPuzzle.enSentence);
                    setEditPuzzleLesson(currentPuzzle.lesson);
                    setIsEditingModalOpen(true);
                  }}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  title="Sửa câu này"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={handleNextPuzzle}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  title="Bỏ qua câu này"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Target English Phrase */}
            <div className="bg-orange-50 border border-orange-100/60 rounded-2xl p-5 text-center">
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Nghĩa tiếng Anh (Target Translation)</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1.5">
                "{currentPuzzle.enSentence}"
              </p>
            </div>

            {/* Answer Slots - Where words are assembled */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Câu trả lời của bạn</span>
              <div className="min-h-[70px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-wrap gap-2.5 items-center justify-center transition-all">
                {selectedWords.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">Nhấp vào từ ở dưới để ráp câu...</span>
                ) : (
                  <AnimatePresence>
                    {selectedWords.map((word) => (
                      <motion.button
                        key={word.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={() => handleWordDeselect(word)}
                        className="bg-orange-500 text-white font-extrabold text-sm px-4 py-2 rounded-xl border border-orange-600 shadow-sm hover:bg-orange-600 transition-colors cursor-pointer"
                      >
                        {word.text}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Scrambled Pool - Words available to select */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kho từ ghép</span>
              <div className="min-h-[80px] bg-slate-100/50 border border-slate-200 rounded-2xl p-5 flex flex-wrap gap-2.5 items-center justify-center">
                {scrambledWords.length === 0 && selectedWords.length > 0 ? (
                  <p className="text-[10px] text-slate-400 font-semibold italic">Đã dùng hết khối từ! Nhấp Kiểm Tra để nộp bài.</p>
                ) : scrambledWords.length === 0 ? (
                  <p className="text-xs text-slate-400">Không có khối từ khả dụng.</p>
                ) : (
                  scrambledWords.map((word) => (
                    <button
                      key={word.id}
                      onClick={() => handleWordSelect(word)}
                      className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm px-4 py-2 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      {word.text}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Connection Mapping Board directly under Your Answer */}
            {selectedWords.length > 0 && (
              <div className="bg-linear-to-b from-orange-50/40 to-amber-50/20 border border-orange-100 rounded-3xl p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-orange-100/50 pb-2.5">
                  <span className="text-xs text-orange-700 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                    Sơ đồ cấu trúc & Kết nối từ vựng (Structure Map)
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">Đối chiếu trực diện nghĩa song ngữ</span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="flex flex-row justify-center gap-4 min-w-max px-2">
                    {selectedWords.map((word, index) => {
                      const lower = word.text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
                      const englishMeaning = LOCAL_WORD_DICT[lower] || apiSegments[lower] || "Meaning";

                      return (
                        <div key={`col-${word.id}`} className="flex flex-col items-center bg-white/60 border border-orange-100/40 rounded-2xl p-4 shadow-2xs min-w-[100px] transition-all">
                          {/* Dòng 1: Target Translation (Nghĩa Tiếng Anh) */}
                          <div className="flex flex-col items-center text-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Dòng 1: Target</span>
                            <span className="bg-orange-500 text-white font-black text-xs px-3 py-2 rounded-xl border border-orange-600 shadow-xs max-w-[110px] truncate" title={englishMeaning}>
                              {englishMeaning}
                            </span>
                          </div>

                          {/* Mũi tên nối dọc (Vertical arrow pointer) */}
                          <div className="my-3 text-orange-400 flex flex-col items-center">
                            <div className="w-0.5 h-7 bg-orange-300 relative">
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 border-b-2 border-r-2 border-orange-400 rotate-45"></div>
                            </div>
                          </div>

                          {/* Dòng 2: Câu trả lời (Vietnamese Word block) */}
                          <div className="flex flex-col items-center text-center">
                            <span className="bg-slate-900 text-white font-black text-xs px-3 py-2 rounded-xl border border-slate-950 shadow-xs max-w-[110px] truncate" title={word.text}>
                              {word.text}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Dòng 2: Câu trả lời</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Grading / Results feedback */}
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`rounded-2xl p-5 border flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden ${
                    isCorrect 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-10 h-10 text-green-500 fill-current" />
                    ) : (
                      <AlertTriangle className="w-10 h-10 text-rose-500 fill-current" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm">
                        {isCorrect ? 'Tuyệt vời! Bạn làm đúng rồi.' : 'Ồ không, câu sắp xếp chưa chính xác.'}
                      </h4>
                      <p className="text-xs opacity-90 mt-1">
                        Đáp án đúng: <strong className="font-extrabold text-slate-900">{currentPuzzle.viSentence}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => speakSentence(currentPuzzle.viSentence)}
                      className="p-2.5 bg-white rounded-xl shadow-xs text-slate-600 hover:text-slate-800 cursor-pointer border border-slate-200"
                      title="Nghe phát âm chuẩn"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={askAiForExplanation}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span>AI Trợ giúp</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Explanation Accordion */}
            {aiExplanation && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-yellow-500 animate-pulse" />
                  Đại lý AI giảng giải ngữ pháp:
                </h4>
                <div className="text-xs text-slate-600 space-y-1 text-justify leading-relaxed whitespace-pre-wrap">
                  {aiExplanation}
                </div>
              </div>
            )}

            {/* Interaction Row (Submit / Reset / Next) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetActive}
                className="flex items-center space-x-1 px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ráp lại từ đầu</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {!checked ? (
                  <button
                    type="button"
                    onClick={checkAnswer}
                    disabled={selectedWords.length === 0}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                      selectedWords.length === 0
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Nộp câu trả lời
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextPuzzle}
                    className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/15 cursor-pointer"
                  >
                    <span>Làm câu tiếp theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-bold">Không có bài tập nào được tìm thấy trong cấp độ này.</p>
          </div>
        )}
      </div>
    </div>
      ) : (
        /* MANAGE SENTENCES VIEW */
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={manageSearchQuery}
                onChange={(e) => setManageSearchQuery(e.target.value)}
                placeholder="Tìm kiếm câu..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none text-xs text-slate-800 transition-all font-semibold"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Lọc bài học:</span>
              <select
                value={manageLessonFilter}
                onChange={(e) => setManageLessonFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-orange-500 outline-none text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="All">Tất cả bài học</option>
                {availableLessons.map(lesson => (
                  <option key={lesson} value={lesson}>{lesson}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sentences Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Bài học</th>
                  <th className="py-3 px-4">Câu tiếng Anh</th>
                  <th className="py-3 px-4">Câu tiếng Việt</th>
                  <th className="py-3 px-4 text-center">Chức năng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium text-left">
                {puzzles
                  .filter(p => {
                    const matchesSearch = p.enSentence.toLowerCase().includes(manageSearchQuery.toLowerCase()) || 
                                          p.viSentence.toLowerCase().includes(manageSearchQuery.toLowerCase());
                    const matchesFilter = manageLessonFilter === 'All' || p.lesson === manageLessonFilter;
                    return matchesSearch && matchesFilter;
                  })
                  .map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-500">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-600">
                          {p.lesson}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.enSentence}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{p.viSentence}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPuzzle(p);
                              setEditViSentence(p.viSentence);
                              setEditEnSentence(p.enSentence);
                              setEditPuzzleLesson(p.lesson);
                              setIsEditingModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Sửa câu này"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePuzzle(p.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa câu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {puzzles.filter(p => {
                  const matchesSearch = p.enSentence.toLowerCase().includes(manageSearchQuery.toLowerCase()) || 
                                        p.viSentence.toLowerCase().includes(manageSearchQuery.toLowerCase());
                  const matchesFilter = manageLessonFilter === 'All' || p.lesson === manageLessonFilter;
                  return matchesSearch && matchesFilter;
                }).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy câu nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Puzzle Modal */}
      <AnimatePresence>
        {isEditingModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border-2 border-yellow-400 p-6 md:p-8 w-full max-w-lg shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-orange-500" />
                  Sửa Câu Ngữ Pháp
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePuzzle} className="space-y-4 text-left">
                {/* Lesson */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bài học / Trình độ</label>
                  <input
                    type="text"
                    value={editPuzzleLesson}
                    onChange={(e) => setEditPuzzleLesson(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                    placeholder="Ví dụ: A1: Giao tiếp cơ bản"
                    required
                  />
                </div>

                {/* English sentence */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Câu Tiếng Anh (Nguồn)</label>
                  <input
                    type="text"
                    value={editEnSentence}
                    onChange={(e) => setEditEnSentence(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                    placeholder="Ví dụ: Hello, how are you?"
                    required
                  />
                </div>

                {/* Vietnamese sentence */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Câu Tiếng Việt (Đáp án ghép câu)</label>
                  <input
                    type="text"
                    value={editViSentence}
                    onChange={(e) => setEditViSentence(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                    placeholder="Ví dụ: Xin chào, bạn khỏe không?"
                    required
                  />
                  <p className="text-[10px] text-slate-400 italic">Lưu ý: Các từ sẽ được tách tự động dựa trên khoảng trắng để người học lắp ghép câu.</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 transition-all cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Puzzle Modal */}
      <AnimatePresence>
        {isAddingPuzzle && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border-2 border-yellow-400 p-6 md:p-8 w-full max-w-lg shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-orange-500" />
                  Thêm Câu Ngữ Pháp Mới
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingPuzzle(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPuzzle} className="space-y-4 text-left">
                {/* Lesson */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bài học / Trình độ</label>
                  <input
                    type="text"
                    value={newPuzzleLesson}
                    onChange={(e) => setNewPuzzleLesson(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                    placeholder="Ví dụ: A1: Giao tiếp cơ bản"
                    required
                  />
                </div>

                {/* English sentence */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Câu Tiếng Anh (Nguồn)</label>
                  <input
                    type="text"
                    value={newEnSentence}
                    onChange={(e) => setNewEnSentence(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                    placeholder="Ví dụ: Hello, how are you?"
                    required
                  />
                </div>

                {/* Vietnamese sentence */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Câu Tiếng Việt (Đáp án ghép câu)</label>
                  <input
                    type="text"
                    value={newViSentence}
                    onChange={(e) => setNewViSentence(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none text-xs font-semibold text-slate-800 transition-all"
                    placeholder="Ví dụ: Xin chào, bạn khỏe không?"
                    required
                  />
                  <p className="text-[10px] text-slate-400 italic">Lưu ý: Các từ sẽ được tách tự động dựa trên khoảng trắng để người học lắp ghép câu.</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingPuzzle(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 transition-all cursor-pointer"
                  >
                    Thêm câu mới
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
