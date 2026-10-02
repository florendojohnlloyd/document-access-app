'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Files, Users, ClipboardList, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    label: 'Files',
    href: '/dashboard/files',
    icon: Files,
    roles: ['manager', 'user'] as const,
  },
  {
    label: 'Users',
    href: '/dashboard/users',
    icon: Users,
    roles: ['manager'] as const,
  },
  {
    label: 'Audit Logs',
    href: '/dashboard/logs',
    icon: ClipboardList,
    roles: ['manager'] as const,
  },
];

export function Sidebar({ profile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(profile.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-30',
          'bg-teal-primary flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0 md:flex md:flex-shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-1.5">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-wide">Document Access</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-white/70 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="bg-white/10 rounded-lg px-3 py-3">
            <p className="text-white font-medium text-sm truncate">
              {profile.full_name ?? profile.username}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/60 truncate">@{profile.username}</span>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0',
                  profile.role === 'manager'
                    ? 'bg-yellow-400/20 text-yellow-200'
                    : 'bg-white/10 text-white/70'
                )}
              >
                {profile.role === 'manager' ? 'Manager' : 'User'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
