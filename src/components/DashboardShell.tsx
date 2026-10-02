'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SetNameModal } from './SetNameModal';
import type { Profile } from '@/types';

interface DashboardShellProps {
  profile: Profile;
  children: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/files': 'Files',
  '/dashboard/users': 'Users',
  '/dashboard/logs': 'Audit Logs',
};

export function DashboardShell({ profile: initialProfile, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const pathname = usePathname();

  const title = PAGE_TITLES[pathname] ?? 'Dashboard';
  const needsName =
    profile.role === 'user' && !profile.name_locked && !profile.full_name;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        profile={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
          {children}
        </main>
      </div>

      {needsName && (
        <SetNameModal
          onSaved={(updatedProfile) => setProfile(updatedProfile)}
        />
      )}
    </div>
  );
}
