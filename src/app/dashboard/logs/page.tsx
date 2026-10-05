'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Filter, X } from 'lucide-react';
import { LogTable } from '@/components/LogTable';
import { cn } from '@/lib/utils';
import type { AuditLog, Profile } from '@/types';

export default function LogsPage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Date/time filter state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: Profile) => {
        setCurrentProfile(data);
        if (!['super_admin', 'admin'].includes(data.role)) {
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
    if (currentProfile && ['super_admin', 'admin'].includes(currentProfile.role)) {
      void fetchLogs();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        void fetchLogs();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentProfile, fetchLogs]);

  // Client-side date filtering
  const filteredLogs = useMemo(() => {
    if (!fromDate && !toDate) return logs;

    return logs.filter((log) => {
      const ts = new Date(log.created_at).getTime();

      if (fromDate) {
        const from = new Date(fromDate + 'T00:00:00').getTime();
        if (ts < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate + 'T23:59:59').getTime();
        if (ts > to) return false;
      }

      return true;
    });
  }, [logs, fromDate, toDate]);

  const hasFilter = fromDate || toDate;

  const clearFilter = () => {
    setFromDate('');
    setToDate('');
  };

  if (!currentProfile || !['super_admin', 'admin'].includes(currentProfile.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Audit Logs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Last updated: {lastRefreshed.toLocaleTimeString('en-PH')} · Auto-refreshes every 30s
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {loading
                ? '...'
                : hasFilter
                ? `Showing ${filteredLogs.length} of ${logs.length} log${logs.length !== 1 ? 's' : ''}`
                : `${logs.length} log${logs.length !== 1 ? 's' : ''}`}
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

        {/* Date/time filter */}
        <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 mb-2.5" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={toDate || undefined}
              className={cn(
                'px-3 py-2 rounded-lg border text-sm bg-white text-slate-900 border-slate-200',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                'transition-colors'
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || undefined}
              className={cn(
                'px-3 py-2 rounded-lg border text-sm bg-white text-slate-900 border-slate-200',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                'transition-colors'
              )}
            />
          </div>
          {hasFilter && (
            <button
              onClick={clearFilter}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 bg-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
              )}
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {loading && logs.length === 0 ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-lg h-10" />
            ))}
          </div>
        ) : (
          <LogTable logs={filteredLogs} />
        )}
      </div>
    </div>
  );
}
