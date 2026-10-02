'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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
        setError(data.error ?? 'Hindi makapag-login. Subukan muli.');
      } else {
        router.push('/dashboard/files');
        router.refresh();
      }
    } catch {
      setError('Network error. Subukan muli.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border text-sm',
            'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
            'border-gray-300 dark:border-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-teal-primary focus:border-transparent',
            'transition-colors placeholder-gray-400 dark:placeholder-gray-500'
          )}
          placeholder="Ilagay ang username"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
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
            className={cn(
              'w-full px-4 py-2.5 pr-10 rounded-lg border text-sm',
              'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
              'border-gray-300 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-teal-primary focus:border-transparent',
              'transition-colors placeholder-gray-400 dark:placeholder-gray-500'
            )}
            placeholder="Ilagay ang password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={showPassword ? 'Itago ang password' : 'Ipakita ang password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !username || !password}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
          'bg-teal-primary hover:bg-teal-dark text-white font-medium text-sm',
          'focus:outline-none focus:ring-2 focus:ring-teal-primary focus:ring-offset-2',
          'transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Naglo-login...</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>Mag-login</span>
          </>
        )}
      </button>
    </form>
  );
}
