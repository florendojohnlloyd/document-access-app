'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditProfileModal } from './EditProfileModal';
import type { Profile } from '@/types';

interface HeaderProps {
  profile: Profile;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onProfileUpdated: (p: Profile) => void;
  title?: string;
}

export function Header({ profile, sidebarOpen, onToggleSidebar, onProfileUpdated, title }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const displayName = profile.full_name ?? profile.username;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-4 sticky top-0 z-10 flex-shrink-0">
        {/* Left — hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex flex-col justify-center gap-1.5 w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors p-2 flex-shrink-0"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <span className="block w-5 h-0.5 bg-slate-600 rounded-full" />
            <span className={cn('block h-0.5 bg-slate-600 rounded-full transition-all', sidebarOpen ? 'w-3' : 'w-4')} />
            <span className="block w-5 h-0.5 bg-slate-600 rounded-full" />
          </button>
          {title && <h1 className="text-sm font-semibold text-slate-700 hidden sm:block">{title}</h1>}
        </div>

        {/* Right — user + actions */}
        <div className="flex items-center gap-1">
          {/* Clickable user avatar — opens profile modal */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
            aria-label="Edit profile"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{displayName}</p>
              <p className={cn('text-xs font-medium',
                profile.role === 'super_admin' ? 'text-amber-500' :
                profile.role === 'admin' ? 'text-purple-500' :
                'text-slate-400'
              )}>
                {profile.role === 'super_admin' ? 'Super Admin' : profile.role === 'admin' ? 'Admin' : 'View Only'}
              </p>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 hidden sm:block transition-colors" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Sign out */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </header>

      {/* Profile modal */}
      {showProfile && (
        <EditProfileModal
          profile={profile}
          onSaved={(updated) => { onProfileUpdated(updated); setShowProfile(false); }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}
