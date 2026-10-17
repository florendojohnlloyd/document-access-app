'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS:
//   The client polls /api/version every 60 seconds.
//   When the server returns a version different from what the user last saw,
//   the toast slides in from the right.
//   "Refresh to update" reloads the page.
//   "Later" dismisses and remembers the new version so it won't show again
//   until the NEXT version bump.
//
// TO PUBLISH A NEW NOTICE:
//   1. Change APP_VERSION in src/app/api/version/route.ts
//   2. Update NOTICE.items below
//   3. Deploy — the toast will auto-show on next poll (within 60s)
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || null;
const DISMISSED_KEY_PREFIX = 'docuvault_dismissed_';
const POLL_INTERVAL_MS = 10_000; // Check every 10 seconds

export function UpdateNoticeBell() { return null; }

export function UpdateNoticeToast() {
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadedVersionRef = useRef<string | null>(CLIENT_BUILD_ID);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/api/version?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (!res.ok) return;
        const data = await res.json() as { version: string };
        if (cancelled || !data?.version) return;

        // If this tab didn't have an initial version yet, lock it to the first fetched version
        if (!loadedVersionRef.current) {
          loadedVersionRef.current = data.version;
          return;
        }

        // Check if server version is different from what this client loaded with
        if (data.version !== loadedVersionRef.current) {
          const dismissed = localStorage.getItem(`${DISMISSED_KEY_PREFIX}${data.version}`);
          if (!dismissed) {
            setNewVersion(data.version);
            setHiding(false);
            setVisible(true);
          }
        }
      } catch {
        // network error / offline — ignore
      }
    };

    // Initial check after 2 seconds, then poll every 10 seconds
    const initialTimer = setTimeout(() => void check(), 2000);
    const interval = setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const dismiss = () => {
    if (newVersion) {
      localStorage.setItem(`${DISMISSED_KEY_PREFIX}${newVersion}`, '1');
    }
    setHiding(true);
    setTimeout(() => {
      setVisible(false);
      setNewVersion(null);
    }, 350);
  };

  const handleRefresh = () => {
    if (newVersion) {
      localStorage.setItem(`${DISMISSED_KEY_PREFIX}${newVersion}`, '1');
    }
    setRefreshing(true);
    setTimeout(() => window.location.reload(), 300);
  };

  if (!visible || !newVersion) return null;

  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 z-50 w-auto max-w-sm',
        'transition-all duration-300 ease-out',
        hiding ? 'translate-x-[110%] opacity-0' : 'translate-x-0 opacity-100'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-xs shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 whitespace-nowrap">New Version</p>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded-full border border-indigo-100">
                  {newVersion.length > 8 ? 'Update' : `v${newVersion}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Reload to apply update</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-70 transition-all shadow-xs"
            >
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
              <span>{refreshing ? 'Reloading...' : 'Reload'}</span>
            </button>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Dismiss"
              title="Later"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
