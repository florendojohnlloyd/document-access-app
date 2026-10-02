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
    className: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
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
    className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
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
    className: 'bg-teal-primary/10 text-teal-primary dark:text-teal-light',
  },
  VIEW: {
    label: 'View',
    className: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  },
};

function ActionBadge({ action }: { action: ActionType }) {
  const style = ACTION_STYLES[action] ?? {
    label: action,
    className: 'bg-gray-100 dark:bg-gray-700 text-gray-600',
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
        <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-gray-500 dark:text-gray-400">Walang logs pa.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Timestamp</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
              Actor
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Action</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">
              Detail
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {logs.map((log) => (
            <tr
              key={log.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatDate(log.created_at)}
              </td>
              <td className="py-3 px-4 hidden sm:table-cell">
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {log.actor_name ?? '—'}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <ActionBadge action={log.action} />
              </td>
              <td className="py-3 px-4 hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs">
                {log.detail ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
