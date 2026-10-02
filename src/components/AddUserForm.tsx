'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, Role } from '@/types';

interface AddUserFormProps {
  onCreated: (user: Profile) => void;
}

export function AddUserForm({ onCreated }: AddUserFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Ang password ay dapat hindi bababa sa 6 na karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json() as Profile | { error: string };

      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error creating user.');
      } else {
        setSuccess(`User "${username}" na-create na!`);
        onCreated(data as Profile);
        setUsername('');
        setPassword('');
        setRole('user');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="new-username"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Username
          </label>
          <input
            id="new-username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. juan.delacruz"
            className={cn(
              'w-full px-3 py-2.5 rounded-lg border text-sm',
              'bg-slate-950 dark:bg-slate-700 text-slate-100 dark:text-gray-100',
              'border-slate-700 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
            )}
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className={cn(
              'w-full px-3 py-2.5 rounded-lg border text-sm',
              'bg-slate-950 dark:bg-slate-700 text-slate-100 dark:text-gray-100',
              'border-slate-700 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
            )}
          />
        </div>

        <div>
          <label
            htmlFor="new-role"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Role
          </label>
          <select
            id="new-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg border text-sm',
              'bg-slate-950 dark:bg-slate-700 text-slate-100 dark:text-gray-100',
              'border-slate-700 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
            )}
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
          <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !username || !password}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
          'bg-indigo-600 hover:bg-indigo-700 text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Creating...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Add User
          </>
        )}
      </button>
    </form>
  );
}


