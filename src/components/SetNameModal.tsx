'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface SetNameModalProps {
  onSaved: (profile: Profile) => void;
}

export function SetNameModal({ onSaved }: SetNameModalProps) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      const data = await res.json() as Profile | { error: string };

      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error saving name.');
      } else {
        onSaved(data as Profile);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="setname-title"
    >
      <div className="bg-white  border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 rounded-full p-3">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 id="setname-title" className="text-lg font-bold text-white">
            Welcome! Set Your Name
          </h2>
          <p className="text-indigo-200/80 text-sm mt-1">
            Please enter your full name to get started.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <label
              htmlFor="full-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              autoFocus
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Lloyd Santos"
              className={cn(
                'w-full px-4 py-2.5 rounded-lg border text-sm',
                'bg-slate-50  text-slate-900 dark:text-gray-100',
                'border-slate-200 dark:border-white/10',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              )}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              ⚠️ This name cannot be changed after saving.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !fullName.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
              'transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Name</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

