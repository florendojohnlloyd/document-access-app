'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';
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
        setError('Invalid username or password. Please try again.');
      } else {
        router.push('/dashboard/files');
        router.refresh();
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username */}
      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-sm font-medium text-slate-300">
          Username
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-xl text-sm',
              'bg-white/5 border border-white/10 text-white',
              'placeholder-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-teal-primary/60 focus:border-teal-primary/60',
              'transition-all duration-200',
              'disabled:opacity-50'
            )}
            placeholder="Enter your username"
            disabled={loading}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="w-4 h-4 text-slate-500" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(
              'w-full pl-10 pr-12 py-3 rounded-xl text-sm',
              'bg-white/5 border border-white/10 text-white',
              'placeholder-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-teal-primary/60 focus:border-teal-primary/60',
              'transition-all duration-200',
              'disabled:opacity-50'
            )}
            placeholder="Enter your password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !username || !password}
        className={cn(
          'w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl mt-2',
          'bg-teal-primary hover:bg-teal-dark text-white font-semibold text-sm',
          'shadow-lg shadow-teal-primary/25 hover:shadow-teal-primary/40',
          'focus:outline-none focus:ring-2 focus:ring-teal-primary focus:ring-offset-2 focus:ring-offset-transparent',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
        )}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </>
        )}
      </button>
    </form>
  );
}
