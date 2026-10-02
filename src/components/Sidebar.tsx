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
  const visibleItems = navItems.filter(item =>
    (item.roles as readonly string[]).includes(profile.role)
  );

  return (
    <aside className={cn(
      'flex-shrink-0 flex flex-col bg-white border-r border-slate-200 h-full',
      'transition-all duration-300 ease-in-out overflow-hidden',
      // Desktop: push layout — show/hide via width
      isOpen ? 'w-64' : 'w-0 border-r-0',
      // Mobile: fixed overlay
      'fixed top-0 left-0 z-30 md:relative md:z-auto',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    )}>
      <div className="w-64 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 h-14 px-5 border-b border-slate-200 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-slate-900 font-bold text-sm tracking-tight">DocuVault</p>
            <p className="text-slate-400 text-xs">Document System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { if (window.innerWidth < 768) onClose(); }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-slate-400')} />
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold uppercase">
                {(profile.full_name ?? profile.username).charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 text-sm font-medium truncate">
                {profile.full_name ?? profile.username}
              </p>
              <span className={cn(
                'text-xs font-semibold',
                profile.role === 'manager' ? 'text-amber-500' : 'text-blue-500'
              )}>
                {profile.role === 'manager' ? '⭐ Manager' : 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
