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
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password, role }),
      });

      const data = await res.json() as Profile | { error: string };

      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error creating user.');
      } else {
        setSuccess(`User "${username}" created successfully! They can now log in.`);
        onCreated(data as Profile);
        setUsername('');
        setPassword('');
        setRole('user');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    'w-full px-3 py-2.5 rounded-lg border text-sm',
    'bg-white text-slate-900 border-slate-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'transition-colors'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="new-username" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Username
          </label>
          <input
            id="new-username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. john.doe"
            className={inputClass}
          />
          <p className="text-xs text-slate-400 mt-1">Lowercase only, no spaces</p>
        </div>

        <div>
          <label htmlFor="new-password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
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
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="new-role" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Role
          </label>
          <select
            id="new-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={inputClass}
          >
            <option value="user">User (View &amp; Upload)</option>
            <option value="admin">Admin (View Only)</option>
            <option value="super_admin">Super Admin (Full Access)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !username || !password}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
          'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
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
