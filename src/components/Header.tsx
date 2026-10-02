'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface HeaderProps {
  profile: Profile;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  title?: string;
}

export function Header({ profile, sidebarOpen, onToggleSidebar, title }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <header className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-4 sticky top-0 z-10 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Hamburger button */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col justify-center gap-1.5 w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors p-2 flex-shrink-0"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <span className={cn('block h-0.5 bg-slate-600 rounded-full transition-all duration-200', sidebarOpen ? 'w-5' : 'w-5')} />
          <span className={cn('block h-0.5 bg-slate-600 rounded-full transition-all duration-200', sidebarOpen ? 'w-3' : 'w-4')} />
          <span className={cn('block h-0.5 bg-slate-600 rounded-full transition-all duration-200', sidebarOpen ? 'w-5' : 'w-5')} />
        </button>

        {title && (
          <h1 className="text-sm font-semibold text-slate-600 hidden sm:block">{title}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* User info */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{displayName}</p>
            <p className={cn('text-xs font-medium',
              profile.role === 'manager' ? 'text-amber-500' : 'text-blue-500'
            )}>
              {profile.role === 'manager' ? 'Manager' : 'User'}
            </p>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Sign out button */}
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
  );
}
