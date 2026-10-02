'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Files, Users, ClipboardList, Layers, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { label: 'Files', href: '/dashboard/files', icon: Files, roles: ['manager', 'user'] as const },
  { label: 'Users', href: '/dashboard/users', icon: Users, roles: ['manager'] as const },
  { label: 'Audit Logs', href: '/dashboard/logs', icon: ClipboardList, roles: ['manager'] as const },
];

export function Sidebar({ profile, isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(profile.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full z-30 flex flex-col',
        'bg-slate-900 border-r border-slate-800',
        'transition-all duration-300 ease-in-out',
        'md:relative md:translate-x-0',
        collapsed ? 'md:w-16' : 'md:w-64',
        isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Logo */}
        <div className={cn(
          'flex items-center border-b border-slate-800 h-14 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">DocuVault</p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          {/* Collapse toggle — desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-md text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Close — mobile */}
          <button
            onClick={onClose}
            className="md:hidden flex items-center justify-center w-6 h-6 rounded-md text-slate-500 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">Menu</p>
          )}
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-xl text-sm font-medium transition-all duration-150',
                  collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                )}
              >
                <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4', isActive ? 'text-indigo-400' : 'text-slate-500')} />
                {!collapsed && (
                  <>
                    {item.label}
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {!collapsed && (
          <div className="px-3 py-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold uppercase">
                  {(profile.full_name ?? profile.username).charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{profile.full_name ?? profile.username}</p>
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded-full',
                  profile.role === 'manager' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'
                )}>
                  {profile.role === 'manager' ? '⭐ Manager' : 'User'}
                </span>
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="px-2 py-4 border-t border-slate-800 flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold uppercase">
                {(profile.full_name ?? profile.username).charAt(0)}
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
