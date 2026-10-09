'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { UserTable } from '@/components/UserTable';
import { AddUserForm } from '@/components/AddUserForm';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

export default function UsersPage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchUsers = useCallback(async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json() as Profile[];
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    if (currentProfile && ['super_admin', 'admin'].includes(currentProfile.role)) {
      void fetchUsers();
    }
  }, [currentProfile, fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name ?? '').toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (!currentProfile || !['super_admin', 'admin'].includes(currentProfile.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const isSuperAdmin = currentProfile.role === 'super_admin';

  return (
    <div className="space-y-5">
      {/* Add User form — super_admin only */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Add New User</h2>
          <AddUserForm onCreated={(user) => setUsers((prev) => [user, ...prev])} />
        </div>
      )}

      {/* User table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">All Users</h2>
            {!isSuperAdmin && (
              <p className="text-xs text-slate-400 mt-0.5">View only — contact a Super Admin to make changes.</p>
            )}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-300 hover:text-slate-500 transition-colors text-xs"
                  aria-label="Clear search"
                >✕</button>
              )}
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {loading ? '...' : search
                ? `${filteredUsers.length} of ${users.length}`
                : `${users.length} user${users.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-lg h-12" />
            ))}
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            currentUserId={currentProfile.id}
            currentUserRole={currentProfile.role}
            currentUsername={currentProfile.username}
            onDeleted={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
          />
        )}
      </div>
    </div>
  );
}
