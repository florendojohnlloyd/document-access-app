'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── EDIT THIS to publish a new notice ────────────────────────────────────────
// Bump the version string whenever you want a new popup to appear.
// Users who already dismissed this version won't see it again.
const NOTICE_VERSION = '1.1.0';

const NOTICE = {
  title: 'DocuVault Updated 🎉',
  version: NOTICE_VERSION,
  items: [
    'New role system: Super Admin, Admin, and User',
    'Folder dropdown with search',
    'Date range + keyword filter on Audit Logs',
    'Search bar on Users page',
    'Improved file preview for Office documents',
  ],
};
// ──────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = `docuvault_notice_dismissed_${NOTICE_VERSION}`;

export function UpdateNoticeModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{NOTICE.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Version {NOTICE.version}</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <p className="text-sm text-slate-500 mb-4">
            Narito ang mga bagong feature at improvement sa pinakabagong update:
          </p>
          <ul className="space-y-2.5">
            {NOTICE.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm text-slate-700">{item}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={dismiss}
            className={cn(
              'mt-6 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
            )}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
