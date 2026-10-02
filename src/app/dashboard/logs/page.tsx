'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { LogTable } from '@/components/LogTable';
import { cn } from '@/lib/utils';
import type { AuditLog, Profile } from '@/types';

export default function LogsPage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: Profile) => {
        setCurrentProfile(data);
        if (data.role !== 'manager') {
          router.replace('/dashboard/files');
        }
      })
      .catch(() => router.replace('/dashboard/files'));
  }, [router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json() as AuditLog[];
      setLogs(data);
      setLastRefreshed(new Date());
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentProfile?.role === 'manager') {
      void fetchLogs();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        void fetchLogs();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentProfile, fetchLogs]);

  if (!currentProfile || currentProfile.role !== 'manager') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Audit Logs</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Last updated: {lastRefreshed.toLocaleTimeString('en-PH')} · Auto-refreshes every 30s
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {loading ? '...' : `${logs.length} log${logs.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={() => void fetchLogs()}
              disabled={loading}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'text-slate-400 hover:text-indigo-600 hover:bg-indigo-600/10',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="Refresh logs"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-700 rounded-lg h-10" />
            ))}
          </div>
        ) : (
          <LogTable logs={logs} />
        )}
      </div>
    </div>
  );
}

