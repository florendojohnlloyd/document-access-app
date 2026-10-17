'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Files, Users, ClipboardList, BarChart3, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, Role } from '@/types';

interface SidebarProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Files', href: '/dashboard/files', icon: Files, roles: ['super_admin', 'admin', 'user'] as Role[] },
  { label: 'Users', href: '/dashboard/users', icon: Users, roles: ['super_admin', 'admin'] as Role[] },
  { label: 'Audit Logs', href: '/dashboard/logs', icon: ClipboardList, roles: ['super_admin', 'admin'] as Role[] },
];

function RoleLabel({ role }: { role: Role }) {
  if (role === 'super_admin') return <span className="text-xs font-semibold text-amber-500">⭐ Super Admin</span>;
  if (role === 'admin') return <span className="text-xs font-semibold text-purple-500">🛡 Admin</span>;
  return <span className="text-xs font-semibold text-blue-500">User</span>;
}

export function Sidebar({ profile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter(item => item.roles.includes(profile.role));

  return (
    <>
      <aside className={cn(
        'flex-shrink-0 flex flex-col bg-white border-r border-slate-200 h-full',
        'transition-[width,transform] duration-200 ease-in-out overflow-hidden shadow-lg md:shadow-none will-change-[width,transform]',
        // Desktop: icon-only when closed (w-16), full when open (w-64)
        isOpen ? 'md:w-64' : 'md:w-16',
        // Mobile: fixed overlay drawer above backdrop (z-40)
        'fixed top-0 left-0 z-40 md:relative md:z-auto',
        isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'
      )}>
        {/* Logo & mobile close button */}
        <div className="flex items-center justify-between h-14 px-3.5 border-b border-slate-200 flex-shrink-0 overflow-hidden">
          <div className="flex items-center min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs shadow-blue-500/20">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div className={cn(
              'overflow-hidden transition-[max-width,opacity,margin] duration-200 ease-in-out whitespace-nowrap min-w-0',
              isOpen ? 'max-w-44 opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0 pointer-events-none'
            )}>
              <p className="text-slate-900 font-bold text-sm tracking-tight">DocuVault</p>
              <p className="text-slate-400 text-xs">Document System</p>
            </div>
          </div>
          {/* Close button on mobile */}
          {isOpen && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-auto flex-shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <div className={cn(
            'overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-in-out',
            isOpen ? 'max-h-6 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0 pointer-events-none'
          )}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3 whitespace-nowrap">
              Navigation
            </p>
          </div>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { if (window.innerWidth < 768) onClose(); }}
                title={!isOpen ? item.label : undefined}
                className={cn(
                  'flex items-center h-11 px-3 rounded-xl text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <Icon className={cn('w-4.5 h-4.5 transition-colors', isActive ? 'text-blue-600' : 'text-slate-400')} />
                </div>
                <div className={cn(
                  'overflow-hidden transition-[max-width,opacity,margin] duration-200 ease-in-out whitespace-nowrap flex items-center flex-1 min-w-0',
                  isOpen ? 'max-w-40 opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                )}>
                  <span className="truncate">{item.label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-2 border-t border-slate-200 flex-shrink-0 overflow-hidden">
          <div className="flex items-center h-12 px-2 rounded-xl bg-slate-50 border border-slate-100">
            <div
              className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"
              title={profile.full_name ?? profile.username}
            >
              <span className="text-white text-xs font-bold uppercase">
                {(profile.full_name ?? profile.username).charAt(0)}
              </span>
            </div>
            <div className={cn(
              'overflow-hidden transition-[max-width,opacity,margin] duration-200 ease-in-out whitespace-nowrap min-w-0',
              isOpen ? 'max-w-44 opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0 pointer-events-none'
            )}>
              <p className="text-slate-900 text-sm font-medium truncate">
                {profile.full_name ?? profile.username}
              </p>
              <RoleLabel role={profile.role} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
