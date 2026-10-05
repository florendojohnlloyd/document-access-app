'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SetNameModal } from './SetNameModal';
import type { Profile } from '@/types';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/files': 'Files',
  '/dashboard/users': 'User Management',
  '/dashboard/logs': 'Audit Logs',
};

export function DashboardShell({ profile: initialProfile, children }: { profile: Profile; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState(initialProfile);
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Dashboard';
  const needsName = profile.role !== 'super_admin' && !profile.name_locked && !profile.full_name;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        profile={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          profile={profile}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          onProfileUpdated={setProfile}
          title={title}
        />
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6">
          {children}
        </main>
      </div>

      {needsName && <SetNameModal onSaved={(p) => setProfile(p)} />}
    </div>
  );
}
