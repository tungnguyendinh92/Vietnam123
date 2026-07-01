/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, RefreshCw, FileSpreadsheet, Globe, Download, Upload, Loader2, Check, AlertCircle, X } from 'lucide-react';

interface HeaderProps {
  sheetSynced: boolean;
  onOpenSyncModal: () => void;
  syncSource: 'preset' | 'sheet';
  onPull: () => void;
  onPush: () => void;
  syncLoading: 'pull' | 'push' | null;
  syncMessage: { type: 'success' | 'error'; text: string } | null;
  onClearMessage: () => void;
}

export default function Header({ 
  sheetSynced, 
  onOpenSyncModal, 
  syncSource,
  onPull,
  onPush,
  syncLoading,
  syncMessage,
  onClearMessage
}: HeaderProps) {
  return (
    <header className="bg-white border-b-4 border-yellow-400 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg text-white shrink-0">
            <span className="text-white font-black text-lg tracking-tighter">VN</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              HọcTiếngViệt <span className="text-orange-500">Pro</span>
              <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-100">
                Bilingual v2.5
              </span>
            </h1>
            <p className="text-[11px] font-bold text-slate-500 hidden sm:block">
              Phát triển ngôn ngữ cho Giáo viên & Học sinh Việt - Anh
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Status badge for source */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 ${
              syncSource === 'sheet' 
                ? 'bg-green-100 text-green-700 border-green-400' 
                : 'bg-yellow-50 text-amber-700 border-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${syncSource === 'sheet' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span>{syncSource === 'sheet' ? 'Google Sheet Connected' : 'Preset Lesson Data'}</span>
            </div>
          </div>

          {/* Pull Button */}
          <button
            onClick={onPull}
            disabled={syncLoading !== null}
            className="flex items-center space-x-1 sm:space-x-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
            title="Kéo toàn bộ dữ liệu từ Google Sheet xuống"
            id="pull-btn"
          >
            {syncLoading === 'pull' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Kéo Data Xuống</span>
          </button>

          {/* Push Button */}
          <button
            onClick={onPush}
            disabled={syncLoading !== null}
            className="flex items-center space-x-1 sm:space-x-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
            title="Đẩy toàn bộ dữ liệu hiện tại lên Google Sheet"
            id="push-btn"
          >
            {syncLoading === 'push' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Đẩy Data Lên</span>
          </button>

          {/* Sync Settings Button */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all duration-200 cursor-pointer active:scale-95"
            title="Cài đặt đồng bộ trang tính"
            id="sync-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cài đặt Sheet</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className={`border-t py-2 px-4 transition-all animate-fade-in flex items-center justify-between text-xs font-bold ${
          syncMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`} id="sync-message-banner">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2">
              {syncMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{syncMessage.text}</span>
            </div>
            <button 
              onClick={onClearMessage} 
              className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
