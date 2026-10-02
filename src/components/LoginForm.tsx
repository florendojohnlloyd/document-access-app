'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? 'Invalid username or password.');
      } else {
        router.push('/dashboard/files');
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl text-sm',
    'bg-slate-50 border border-slate-200 text-slate-900',
    'placeholder-slate-400',
    'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
    'transition-all duration-200 disabled:opacity-50'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          placeholder="Enter username"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(inputClass, 'pr-12')}
            placeholder="Enter password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="h-px bg-slate-100 my-1" />

      <button
        type="submit"
        disabled={loading || !username || !password}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
          'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
          'text-white font-semibold text-sm',
          'shadow-md shadow-blue-600/20',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'group'
        )}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Signing in...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}
