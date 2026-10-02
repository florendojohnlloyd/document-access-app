'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface HeaderProps {
  profile: Profile;
  onMenuClick: () => void;
  title?: string;
}

export function Header({ profile, onMenuClick, title }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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
    <header className="bg-slate-900 border-b border-slate-800 px-4 h-14 flex items-center justify-between gap-4 sticky top-0 z-10">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-800 transition-colors group"
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 bg-slate-400 group-hover:bg-slate-900 transition-colors rounded-full" />
          <span className="block w-4 h-0.5 bg-slate-400 group-hover:bg-slate-900 transition-colors rounded-full" />
          <span className="block w-5 h-0.5 bg-slate-400 group-hover:bg-slate-900 transition-colors rounded-full" />
        </button>
        {title && (
          <h1 className="text-sm font-semibold text-slate-200 hidden sm:block">{title}</h1>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-px h-5 bg-slate-800 mx-1" />

        {/* User avatar + name */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">{displayName}</p>
            <p className={cn('text-xs',
              profile.role === 'manager' ? 'text-amber-400' : 'text-blue-400'
            )}>
              {profile.role === 'manager' ? 'Manager' : 'User'}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 ml-1"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </span>
        </button>
      </div>
    </header>
  );
}

