'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Files, Users, ClipboardList, Layers, X } from 'lucide-react';
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
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 z-30 flex flex-col',
        'bg-slate-900 border-r border-slate-800',
        'transition-transform duration-300 ease-in-out',
        'md:relative md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">DocuVault</p>
              <p className="text-slate-500 text-xs">Document Management</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white p-1 transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">Menu</p>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-indigo-400' : 'text-slate-500')} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold uppercase">
                {(profile.full_name ?? profile.username).charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile.full_name ?? profile.username}</p>
              <span className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded-full',
                profile.role === 'manager'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-indigo-500/15 text-indigo-400'
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
