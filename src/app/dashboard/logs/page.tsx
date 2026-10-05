'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Search, X } from 'lucide-react';
import { LogTable } from '@/components/LogTable';
import { cn } from '@/lib/utils';
import type { AuditLog, Profile } from '@/types';

export default function LogsPage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

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
      const interval = setInterval(() => void fetchLogs(), 30000);
      return () => clearInterval(interval);
    }
  }, [currentProfile, fetchLogs]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    // Date range filter
    if (fromDate) {
      const from = new Date(fromDate + 'T00:00:00').getTime();
      result = result.filter((l) => new Date(l.created_at).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate + 'T23:59:59').getTime();
      result = result.filter((l) => new Date(l.created_at).getTime() <= to);
    }

    // Text search — actor, action, detail
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (l) =>
          (l.actor_name ?? '').toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.detail ?? '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, fromDate, toDate, search]);

  const hasFilter = fromDate || toDate || search;

  const clearAll = () => { setFromDate(''); setToDate(''); setSearch(''); };

  if (!currentProfile || !['super_admin', 'admin'].includes(currentProfile.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const inputClass = cn(
    'px-3 py-2 rounded-lg border text-sm bg-white text-slate-900 border-slate-200',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Audit Logs</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lastRefreshed.toLocaleTimeString('en-PH')} · auto-refresh 30s
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {loading ? '...' : hasFilter
                ? `${filteredLogs.length} of ${logs.length}`
                : `${logs.length} log${logs.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={() => void fetchLogs()}
              disabled={loading}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, action, detail..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500 text-xs">✕</button>
            )}
          </div>

          {/* From date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={toDate || undefined}
              className={inputClass}
            />
          </div>

          {/* To date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || undefined}
              className={inputClass}
            />
          </div>

          {/* Clear all */}
          {hasFilter && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Table */}
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
