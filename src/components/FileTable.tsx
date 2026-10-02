'use client';

import { useState } from 'react';
import {
  Eye, Pencil, Trash2, FileText, FileImage, FileSpreadsheet, File,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Modal } from './Modal';
import { FileViewModal } from './FileViewModal';
import type { FileRecord } from '@/types';

interface FileTableProps {
  files: FileRecord[];
  isManager: boolean;
  onFileRenamed: (file: FileRecord) => void;
  onFileDeleted: (id: string) => void;
  isLoading?: boolean;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
  if (['png', 'jpg', 'jpeg'].includes(ext)) return <FileImage className="w-4 h-4 text-blue-500" />;
  if (['xls', 'xlsx'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
  if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-600" />;
  return <File className="w-4 h-4 text-gray-400" />;
}

type ModalMode = 'rename' | 'delete' | null;

export function FileTable({
  files,
  isManager,
  onFileRenamed,
  onFileDeleted,
  isLoading,
}: FileTableProps) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [targetFile, setTargetFile] = useState<FileRecord | null>(null);
  const [viewFileId, setViewFileId] = useState<string | null>(null);
  const [viewFileName, setViewFileName] = useState<string>('');
  const [error, setError] = useState('');

  const handleRename = async (name?: string) => {
    if (!name?.trim() || !targetFile) return;
    setError('');
    try {
      const res = await fetch(`/api/files?id=${targetFile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json() as FileRecord | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error renaming file.');
        return;
      }
      onFileRenamed(data as FileRecord);
      setModalMode(null);
      setTargetFile(null);
    } catch {
      setError('Network error.');
    }
  };

  const handleDelete = async () => {
    if (!targetFile) return;
    setError('');
    try {
      const res = await fetch(`/api/files?id=${targetFile.id}`, { method: 'DELETE' });
      const data = await res.json() as { success: boolean } | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error deleting file.');
        return;
      }
      onFileDeleted(targetFile.id);
      setModalMode(null);
      setTargetFile(null);
    } catch {
      setError('Network error.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-800 rounded-lg h-12" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">No files found</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
          Upload a file to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 font-medium text-slate-500">
                Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 hidden sm:table-cell">
                Folder
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 hidden md:table-cell">
                Uploaded By
              </th>
              <th className="text-left py-3 px-4 font-medium text-slate-500 hidden lg:table-cell">
                Date
              </th>
              <th className="text-right py-3 px-4 font-medium text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {files.map((file) => (
              <tr
                key={file.id}
                className="hover:bg-slate-800/60 transition-colors group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    {getFileIcon(file.name)}
                    <button
                      onClick={() => {
                        setViewFileId(file.id);
                        setViewFileName(file.name);
                      }}
                      className="text-indigo-600 hover:underline font-medium transition-colors text-left"
                    >
                      {file.name}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  {file.folder ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium">
                      {file.folder.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-xs italic">—</span>
                  )}
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-slate-400">
                  {file.uploader
                    ? file.uploader.full_name ?? file.uploader.username
                    : <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="py-3 px-4 hidden lg:table-cell text-slate-500 text-xs">
                  {formatDate(file.created_at)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setViewFileId(file.id);
                        setViewFileName(file.name);
                      }}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        'text-gray-400 hover:text-teal-primary hover:bg-teal-primary/10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-primary'
                      )}
                      aria-label={`View ${file.name}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isManager && (
                      <>
                        <button
                          onClick={() => {
                            setTargetFile(file);
                            setError('');
                            setModalMode('rename');
                          }}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                          )}
                          aria-label={`Rename ${file.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTargetFile(file);
                            setError('');
                            setModalMode('delete');
                          }}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
                          )}
                          aria-label={`Delete ${file.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode === 'rename' && targetFile && (
        <Modal
          title="Rename File"
          inputLabel="New Name"
          defaultValue={targetFile.name}
          confirmLabel="Rename"
          onConfirm={handleRename}
          onClose={() => { setModalMode(null); setTargetFile(null); }}
        />
      )}

      {modalMode === 'delete' && targetFile && (
        <Modal
          title="Delete File"
          message={`Are you sure you want to delete "${targetFile.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => { setModalMode(null); setTargetFile(null); }}
        />
      )}

      {viewFileId && (
        <FileViewModal
          fileId={viewFileId}
          fileName={viewFileName}
          onClose={() => { setViewFileId(null); setViewFileName(''); }}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 shadow-lg">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-xs text-red-400 underline mt-1">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

