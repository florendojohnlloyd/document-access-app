'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Menu, LogOut } from 'lucide-react';
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

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className={cn(
            'md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-primary'
          )}
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-gray-800 dark:text-gray-200 hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Right: user info + controls */}
      <div className="flex items-center gap-2">
        {/* User badge */}
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
            {profile.full_name ?? profile.username}
          </span>
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5',
              profile.role === 'manager'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-teal-primary/10 text-teal-primary dark:text-teal-light'
            )}
          >
            {profile.role === 'manager' ? 'Manager' : 'User'}
          </span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-lg transition-colors',
            'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-primary'
          )}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
            'hover:bg-red-50 dark:hover:bg-red-900/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
}
