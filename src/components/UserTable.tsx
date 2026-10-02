'use client';

import { useState } from 'react';
import { Trash2, Shield, User } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Modal } from './Modal';
import type { Profile } from '@/types';

interface UserTableProps {
  users: Profile[];
  currentUserId: string;
  onDeleted: (id: string) => void;
}

export function UserTable({ users, currentUserId, onDeleted }: UserTableProps) {
  const [target, setTarget] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!target) return;
    setError('');
    try {
      const res = await fetch(`/api/users/${target.id}`, { method: 'DELETE' });
      const data = await res.json() as { success: boolean } | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error deleting user.');
        return;
      }
      onDeleted(target.id);
      setTarget(null);
    } catch {
      setError('Network error.');
    }
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-gray-500 dark:text-gray-400">Walang users na natagpuan.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Username</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                Full Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">
                Created At
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {users.map((user) => (
              <tr
                key={user.id}
                className={cn(
                  'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors',
                  user.id === currentUserId && 'bg-teal-primary/5 dark:bg-teal-primary/10'
                )}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-teal-primary">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{user.username}</span>
                    {user.id === currentUserId && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">(ikaw)</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                  {user.full_name ?? (
                    <span className="text-gray-400 dark:text-gray-500 italic text-xs">Hindi pa naset</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                      user.role === 'manager'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {user.role === 'manager' ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    {user.role === 'manager' ? 'Manager' : 'User'}
                  </span>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs">
                  {formatDate(user.created_at)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end">
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => { setTarget(user); setError(''); }}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
                        )}
                        aria-label={`Delete ${user.username}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {target && (
        <Modal
          title="Delete User"
          message={`Sigurado ka bang gusto mong burahin ang user na "${target.username}"? Hindi ito mababawi at mabubura ang lahat ng kanyang data.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => { setTarget(null); setError(''); }}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 shadow-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-xs text-red-400 underline mt-1">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
