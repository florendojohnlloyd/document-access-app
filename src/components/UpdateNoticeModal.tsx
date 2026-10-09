'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── EDIT THIS to publish a new notice ────────────────────────────────────────
// Bump NOTICE_VERSION whenever you want users to see the dot again.
const NOTICE_VERSION = '1.1.0';

const NOTICE = {
  title: 'DocuVault Updated 🎉',
  version: NOTICE_VERSION,
  date: 'October 2026',
  items: [
    'New role system: Super Admin, Admin, and User',
    'Folder dropdown with search',
    'Admin can now create and delete folders',
    'Date range + keyword filter on Audit Logs',
    'Search bar on Users page',
    'Improved file preview for Office documents',
  ],
};
// ──────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = `docuvault_notice_read_${NOTICE_VERSION}`;

export function UpdateNoticeBell() {
  const [read, setRead] = useState(true); // default true to avoid flash
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isRead = localStorage.getItem(STORAGE_KEY);
    if (!isRead) setRead(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!read) {
      setRead(true);
      localStorage.setItem(STORAGE_KEY, '1');
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          open && 'bg-indigo-50 text-indigo-600'
        )}
        aria-label="Updates"
      >
        <Bell className="w-4 h-4" />
        {/* Unread dot */}
        {!read && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{NOTICE.title}</p>
                <p className="text-xs text-slate-400">v{NOTICE.version} · {NOTICE.date}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Items */}
          <ul className="px-4 py-3 space-y-2.5">
            {NOTICE.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-xs text-slate-600">{item}</span>
              </li>
            ))}
          </ul>

          <div className="px-4 pb-3">
            <p className="text-xs text-slate-400 text-center">
              You're on the latest version
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
