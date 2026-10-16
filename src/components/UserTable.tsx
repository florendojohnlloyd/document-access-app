'use client';

import { useState } from 'react';
import { Trash2, ShieldCheck, Shield, User, Pencil, X, Save } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Modal } from './Modal';
import { BRANCHES } from '@/types';
import type { Profile, Role, Branch } from '@/types';

interface UserTableProps {
  users: Profile[];
  currentUserId: string;
  currentUserRole: Role;
  currentUsername: string;
  onDeleted: (id: string) => void;
  onUpdated: (updated: Profile) => void;
}

function RoleBadge({ role }: { role: Role }) {
  if (role === 'super_admin') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600">
      <ShieldCheck className="w-3 h-3" />Super Admin
    </span>
  );
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
      <Shield className="w-3 h-3" />Admin
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
      <User className="w-3 h-3" />View Only
    </span>
  );
}

// ── Edit User Modal ───────────────────────────────────────────────────────────
function EditUserModal({ user, onSaved, onClose }: { user: Profile; onSaved: (u: Profile) => void; onClose: () => void }) {
  const [role, setRole] = useState<Role>(user.role);
  const [branch, setBranch] = useState<Branch | ''>(user.branch ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputClass = cn(
    'w-full px-3 py-2.5 rounded-lg border text-sm',
    'bg-white text-slate-900 border-slate-200',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!branch) { setError('Please select a branch.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, branch }),
      });
      const data = await res.json() as Profile | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error updating user.');
        return;
      }
      onSaved(data as Profile);
      onClose();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Edit User</h2>
            <p className="text-xs text-slate-400 mt-0.5">@{user.username}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold uppercase">{user.username.charAt(0)}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{user.full_name ?? <span className="italic text-slate-400">No name set</span>}</p>
              <p className="text-xs text-slate-400">@{user.username}</p>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
              <option value="user">User (View &amp; Upload)</option>
              <option value="admin">Admin (Upload &amp; Delete)</option>
              <option value="super_admin">Super Admin (Full Access)</option>
            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value as Branch)} className={inputClass} required>
              <option value="" disabled>— Select branch —</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !branch}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {loading
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export function UserTable({ users, currentUserId, currentUserRole, currentUsername, onDeleted, onUpdated }: UserTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  const canEdit = currentUserRole === 'super_admin';
  const canDelete = currentUserRole === 'super_admin';
  const canDeleteSuperAdmin = currentUserRole === 'super_admin' && currentUsername === 'manager';

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json() as { success: boolean } | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error deleting user.');
        return;
      }
      onDeleted(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setError('Network error.');
    }
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="w-10 h-10 text-slate-300 mb-2" />
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
              <th className="text-left py-3 px-4 font-medium text-slate-500 hidden sm:table-cell">Full Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 hidden sm:table-cell">Branch</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 hidden md:table-cell">Created At</th>
              {(canEdit || canDelete) && (
                <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className={cn('hover:bg-slate-50 transition-colors', user.id === currentUserId && 'bg-indigo-50/50')}>
                <td className="py-3 px-4">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                      <span className="text-xs font-semibold text-indigo-600">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800">{user.username}</span>
                        {user.id === currentUserId && <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">(you)</span>}
                      </div>
                      <div className="sm:hidden text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        {user.full_name && <span className="text-slate-600 font-medium">{user.full_name}</span>}
                        {user.branch && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px] font-medium">
                            {user.branch}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell text-slate-500">
                  {user.full_name ?? <span className="text-slate-400 italic text-xs">Not set</span>}
                </td>
                <td className="py-3 px-4"><RoleBadge role={user.role} /></td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  {user.branch
                    ? <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{user.branch}</span>
                    : <span className="text-slate-300 italic text-xs">—</span>}
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-slate-500 text-xs">{formatDate(user.created_at)}</td>
                {(canEdit || canDelete) && (
                  <td className="py-3 px-3 sm:px-4">
                    <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                      {/* Edit button — super_admin, not self */}
                      {canEdit && user.id !== currentUserId && (
                        <button
                          onClick={() => setEditTarget(user)}
                          className="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          aria-label={`Edit ${user.username}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {/* Delete button */}
                      {canDelete && user.id !== currentUserId && (user.role !== 'super_admin' || canDeleteSuperAdmin) && (
                        <button
                          onClick={() => { setDeleteTarget(user); setError(''); }}
                          className="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal
          title="Delete User"
          message={`Are you sure you want to delete "${deleteTarget.username}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => { setDeleteTarget(null); setError(''); }}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          onSaved={(updated) => { onUpdated(updated); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-xs text-red-400 underline mt-1">Dismiss</button>
        </div>
      )}
    </>
  );
}
