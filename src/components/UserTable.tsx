'use client';

import { useState } from 'react';
import { Trash2, ShieldCheck, Shield, User } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Modal } from './Modal';
import type { Profile, Role } from '@/types';

interface UserTableProps {
  users: Profile[];
  currentUserId: string;
  currentUserRole: Role;
  onDeleted: (id: string) => void;
}

function RoleBadge({ role }: { role: Role }) {
  if (role === 'super_admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-yellow-300">
        <ShieldCheck className="w-3 h-3" />
        Super Admin
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600/10 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
      <User className="w-3 h-3" />
      User
    </span>
  );
}

export function UserTable({ users, currentUserId, currentUserRole, onDeleted }: UserTableProps) {
  const [target, setTarget] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  const canDelete = currentUserRole === 'super_admin';

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
        <User className="w-10 h-10 text-slate-500 mb-2" />
        <p className="text-slate-500">No users found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-500">Username</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 hidden sm:table-cell">
                Full Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 hidden md:table-cell">
                Created At
              </th>
              {canDelete && (
                <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr
                key={user.id}
                className={cn(
                  'hover:bg-slate-100/60 transition-colors',
                  user.id === currentUserId && 'bg-indigo-600/5 dark:bg-indigo-600/10'
                )}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-indigo-600">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-slate-800">{user.username}</span>
                    {user.id === currentUserId && (
                      <span className="text-xs text-slate-400">(you)</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell text-slate-500">
                  {user.full_name ?? (
                    <span className="text-slate-400 italic text-xs">Not set</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-slate-500 text-xs">
                  {formatDate(user.created_at)}
                </td>
                {canDelete && (
                  <td className="py-3 px-4">
                    <div className="flex justify-end">
                      {user.id !== currentUserId && user.role !== 'super_admin' && (
                        <button
                          onClick={() => { setTarget(user); setError(''); }}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
                          )}
                          aria-label={`Delete ${user.username}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {target && (
        <Modal
          title="Delete User"
          message={`Are you sure you want to delete user "${target.username}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => { setTarget(null); setError(''); }}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 shadow-lg">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-xs text-red-400 underline mt-1">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
