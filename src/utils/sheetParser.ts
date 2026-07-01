/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VocabItem, GrammarPuzzle, WhiteboardTab, WhiteboardLine } from '../types';

/**
 * Extracts spreadsheet ID from any standard Google Sheet URL
 */
export function extractSpreadsheetId(url: string): string | null {
  const regExp = /\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

/**
 * Parses a standard CSV string into a 2D array of cells,
 * properly handling commas inside quotation marks.
 */
export function parseCSV(csvText: string): string[][] {
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

/**
 * Parses word segments string like "Xin chào:Hello|cô giáo:teacher" to WhiteboardWord objects
 */
export function parseWordsString(wordsStr: string): { id: string; vi: string; en: string }[] {
  if (!wordsStr || !wordsStr.trim()) return [];
  const items = wordsStr.split('|');
  return items.map((item, idx) => {
    const parts = item.split(':');
    return {
      id: `w-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      vi: parts[0]?.trim() || '',
      en: parts[1]?.trim() || ''
    };
  }).filter(w => w.vi);
}

/**
 * Serializes WhiteboardWord list to a single string like "vi:en|vi:en"
 */
export function serializeWordsToString(words: { vi: string; en: string }[]): string {
  if (!words || words.length === 0) return '';
  return words.map(w => `${w.vi}:${w.en}`).join('|');
}

/**
 * Fetches and parses Whiteboard tabs from Google Sheets CSV export.
 * Expected columns:
 * 1. Bài học (Lesson / Tab Title)
 * 2. Tiếng Việt (Vietnamese sentence)
 * 3. Dịch mượt (English translation)
 * 4. Dịch từng từ (Word by word, format: vi:en|vi:en)
 * 5. Ngữ pháp (Grammar/Notes)
 */
export async function fetchWhiteboardFromSheet(spreadsheetId: string, sheetNameOrId: string = '0'): Promise<WhiteboardTab[]> {
  const isGid = /^\d{8,25}$/.test(sheetNameOrId);
  let url = "";
  if (!sheetNameOrId || sheetNameOrId.trim() === "") {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
  } else if (isGid) {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetNameOrId}`;
  } else {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetNameOrId)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể kết nối với Google Sheet (Bảng trắng). Mã lỗi: ${response.status}`);
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error("Trang tính Bảng trắng trống hoặc không đúng định dạng.");
  }

  const tabMap: { [title: string]: WhiteboardLine[] } = {};
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2 || !row[0] || !row[1]) continue;

    const tabTitle = row[0].trim();
    const viText = row[1].trim();
    const fullEnText = row[2]?.trim() || '';
    const wordsStr = row[3]?.trim() || '';
    const grammar = row[4]?.trim() || undefined;

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

  return Object.keys(tabMap).map((title, idx) => ({
    id: `sheet-wb-tab-${idx}`,
    title,
    lines: tabMap[title]
  }));
}

/**
 * Fetches and parses Vocabulary from Google Sheets CSV export.
 * Expected columns:
 * 1. Tiếng Việt (Vietnamese word/phrase)
 * 2. Tiếng Anh (English translation)
 * 3. Chủ đề (Topic/Category)
 * 4. Ví dụ (Example sentence - optional)
 * 5. Dịch ví dụ (Example translation - optional)
 */
export async function fetchVocabFromSheet(spreadsheetId: string, sheetNameOrId: string = '0'): Promise<VocabItem[]> {
  const isGid = /^\d{8,25}$/.test(sheetNameOrId);
  let url = "";
  if (!sheetNameOrId || sheetNameOrId.trim() === "") {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
  } else if (isGid) {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetNameOrId}`;
  } else {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetNameOrId)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể kết nối với Google Sheet (Trang ${sheetNameOrId}). Mã lỗi: ${response.status}`);
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error("Tài liệu Google Sheet trống hoặc không đúng định dạng.");
  }

  // Skip header row
  const vocabItems: VocabItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2 || !row[0] || !row[1]) continue;

    vocabItems.push({
      id: `sheet-v-${i}`,
      vi: row[0],
      en: row[1],
      topic: row[2] || 'Chung',
      example: row[3] || undefined,
      exampleEn: row[4] || undefined,
      memorized: row[5] ? (row[5].trim().toUpperCase() === 'TRUE' || row[5].trim() === '1' || row[5].trim() === 'Đã thuộc') : false
    });
  }

  return vocabItems;
}

/**
 * Fetches and parses Grammar Puzzles from Google Sheets CSV export (Sheet 2).
 * Expected columns:
 * 1. Câu Tiếng Việt (Vietnamese Sentence)
 * 2. Nghĩa Tiếng Anh (English Translation)
 * 3. Bài / Trình độ (Lesson / Level)
 */
export async function fetchGrammarFromSheet(spreadsheetId: string, sheetNameOrId: string = '0'): Promise<GrammarPuzzle[]> {
  const isGid = /^\d{8,25}$/.test(sheetNameOrId);
  let url = "";
  if (!sheetNameOrId || sheetNameOrId.trim() === "") {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
  } else if (isGid) {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetNameOrId}`;
  } else {
    url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetNameOrId)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể kết nối với Google Sheet (Trang 2). Mã lỗi: ${response.status}`);
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error("Trang tính số 2 trống hoặc không đúng định dạng.");
  }

  const puzzles: GrammarPuzzle[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2 || !row[0] || !row[1]) continue;

    puzzles.push({
      id: `sheet-g-${i}`,
      viSentence: row[0],
      enSentence: row[1],
      lesson: row[2] || 'Bài tập chung'
    });
  }

  return puzzles;
}

// Sample published spreadsheet for demonstration and copying
export const SAMPLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1X-hUqF3-K6vYhC83Y7K_W0gY4_1Uq6EaL8_H-P_P8sY/edit?usp=sharing";
