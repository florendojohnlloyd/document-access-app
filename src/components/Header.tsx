'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Menu, LogOut, Bell } from 'lucide-react';
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
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 px-4 md:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <div>
            <h1 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h1>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Notifications placeholder */}
        <button
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Dark mode */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-800 dark:text-white leading-tight">{displayName}</p>
            <p className={cn(
              'text-xs font-medium',
              profile.role === 'manager' ? 'text-amber-500 dark:text-amber-400' : 'text-teal-primary dark:text-teal-light'
            )}>
              {profile.role === 'manager' ? 'Manager' : 'User'}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-1',
            'text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400',
            'hover:bg-red-50 dark:hover:bg-red-500/10',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </header>
  );
}
