'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Files, Users, ClipboardList, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Files', href: '/dashboard/files', icon: Files, roles: ['manager', 'user'] as const },
  { label: 'Users', href: '/dashboard/users', icon: Users, roles: ['manager'] as const },
  { label: 'Audit Logs', href: '/dashboard/logs', icon: ClipboardList, roles: ['manager'] as const },
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
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 z-30 flex flex-col',
        'bg-slate-900 border-r border-slate-800',
        'transition-transform duration-300 ease-in-out',
        // Desktop: push/pull via isOpen
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // On md+, always in flow but still controlled by isOpen
        'md:relative md:z-auto md:shrink-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 h-14 px-5 border-b border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-tight">DocuVault</p>
            <p className="text-slate-600 text-xs">Document System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close on mobile when nav item clicked
                  if (window.innerWidth < 768) onClose();
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-600/25'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-slate-600')} />
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold uppercase">
                {(profile.full_name ?? profile.username).charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {profile.full_name ?? profile.username}
              </p>
              <span className={cn(
                'text-xs font-semibold',
                profile.role === 'manager' ? 'text-amber-400' : 'text-blue-400'
              )}>
                {profile.role === 'manager' ? '⭐ Manager' : 'User'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
