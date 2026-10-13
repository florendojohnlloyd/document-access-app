'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── EDIT THIS to publish a new notice ───────────────────────────────────────
// Bump NOTICE_VERSION each release → every user sees the toast again.
const NOTICE_VERSION = '1.3.0';

const NOTICE = {
  title: 'DocuVault Updated',
  version: NOTICE_VERSION,
  items: [
    'Branch-based folder access — users see only their branch',
    'Manager has full access to all branches',
    'All English error messages',
    'New Folder button beside folder dropdown',
    'Simplified folder creation flow',
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = `docuvault_notice_v${NOTICE_VERSION}`;

export function UpdateNoticeBell() { return null; }

export function UpdateNoticeToast() {
  // Three states: 'hidden' | 'entering' | 'visible' | 'leaving'
  const [state, setState] = useState<'hidden' | 'entering' | 'visible' | 'leaving'>('hidden');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    // Delay before sliding in
    const t1 = setTimeout(() => setState('entering'), 600);
    // After CSS transition fires, mark as visible
    const t2 = setTimeout(() => setState('visible'), 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const dismiss = () => {
    setState('leaving');
    localStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => setState('hidden'), 350);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    localStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => window.location.reload(), 400);
  };

  if (state === 'hidden') return null;

  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 z-50 w-80',
        'transition-all duration-300 ease-out',
        state === 'entering' || state === 'leaving'
          ? 'translate-x-[110%] opacity-0'
          : 'translate-x-0 opacity-100'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{NOTICE.title} 🎉</p>
                <p className="text-xs text-slate-400">v{NOTICE.version}</p>
              </div>
            </div>
            <button onClick={dismiss} className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <ul className="space-y-1.5 mb-4">
            {NOTICE.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                <span className="text-xs text-slate-600">{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70 transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              {refreshing ? 'Refreshing...' : 'Refresh to update'}
            </button>
            <button onClick={dismiss} className="py-2 px-3 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
