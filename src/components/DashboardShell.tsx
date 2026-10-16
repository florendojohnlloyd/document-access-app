'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SetNameModal } from './SetNameModal';
import { UpdateNoticeToast } from './UpdateNoticeModal';
import type { Profile } from '@/types';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/files': 'Files',
  '/dashboard/users': 'User Management',
  '/dashboard/logs': 'Audit Logs',
};

export function DashboardShell({ profile: initialProfile, children }: { profile: Profile; children: React.ReactNode }) {
  // Mobile: closed by default so overlay doesn't block screen. Desktop: open by default.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Dashboard';
  const needsName = profile.role !== 'super_admin' && !profile.name_locked && !profile.full_name;

  // On mount: open sidebar on desktop screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  // On route change: automatically close on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
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
      <UpdateNoticeToast />
    </div>
  );
}
