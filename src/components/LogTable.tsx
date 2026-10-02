'use client';

import { ClipboardList } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { AuditLog, ActionType } from '@/types';

interface LogTableProps {
  logs: AuditLog[];
}

const ACTION_STYLES: Record<ActionType, { label: string; className: string }> = {
  LOGIN: {
    label: 'Login',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
  LOGOUT: {
    label: 'Logout',
    className: 'bg-slate-100 text-slate-500 ',
  },
  UPLOAD: {
    label: 'Upload',
    className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  FILE_DELETE: {
    label: 'File Deleted',
    className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  },
  FILE_RENAME: {
    label: 'File Renamed',
    className: 'bg-amber-500/15 dark:bg-yellow-900/30 text-amber-300 dark:text-yellow-300',
  },
  FOLDER_CREATE: {
    label: 'Folder Created',
    className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
  FOLDER_RENAME: {
    label: 'Folder Renamed',
    className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
  FOLDER_DELETE: {
    label: 'Folder Deleted',
    className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
  USER_CREATE: {
    label: 'User Created',
    className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  },
  USER_DELETE: {
    label: 'User Deleted',
    className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  },
  NAME_SET: {
    label: 'Name Set',
    className: 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400',
  },
  VIEW: {
    label: 'View',
    className: 'bg-slate-100 text-slate-500 ',
  },
};

function ActionBadge({ action }: { action: ActionType }) {
  const style = ACTION_STYLES[action] ?? {
    label: action,
    className: 'bg-slate-100 text-slate-500',
  };

  return (
    <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium', style.className)}>
      {style.label}
    </span>
  );
}

export function LogTable({ logs }: LogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="w-10 h-10 text-slate-500  mb-2" />
        <p className="text-slate-500 ">Walang logs pa.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-500">Timestamp</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500 hidden sm:table-cell">
              Actor
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Action</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500 hidden md:table-cell">
              Detail
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr
              key={log.id}
              className="hover:bg-slate-100/60 transition-colors"
            >
              <td className="py-3 px-4 text-xs text-slate-500  whitespace-nowrap">
                {formatDate(log.created_at)}
              </td>
              <td className="py-3 px-4 hidden sm:table-cell">
                <div>
                  <span className="font-medium text-slate-800 ">
                    {log.actor_name ?? '—'}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <ActionBadge action={log.action} />
              </td>
              <td className="py-3 px-4 hidden md:table-cell text-slate-500  text-xs">
                {log.detail ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



