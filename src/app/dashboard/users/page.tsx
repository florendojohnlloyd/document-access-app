'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserTable } from '@/components/UserTable';
import { AddUserForm } from '@/components/AddUserForm';
import type { Profile } from '@/types';

export default function UsersPage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: Profile) => {
        setCurrentProfile(data);
        if (data.role !== 'manager') {
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
    if (currentProfile?.role === 'manager') {
      void fetchUsers();
    }
  }, [currentProfile, fetchUsers]);

  if (!currentProfile || currentProfile.role !== 'manager') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add User form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Add New User
        </h2>
        <AddUserForm
          onCreated={(user) => setUsers((prev) => [user, ...prev])}
        />
      </div>

      {/* User table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            All Users
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {loading ? '...' : `${users.length} user${users.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-700 rounded-lg h-12" />
            ))}
          </div>
        ) : (
          <UserTable
            users={users}
            currentUserId={currentProfile.id}
            onDeleted={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
          />
        )}
      </div>
    </div>
  );
}

