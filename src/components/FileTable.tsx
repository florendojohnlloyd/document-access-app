'use client';

import { useState } from 'react';
import {
  Eye, Pencil, Trash2, FileText, FileImage, FileSpreadsheet, File,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Modal } from './Modal';
import { FileViewModal } from './FileViewModal';
import type { FileRecord, Role } from '@/types';

interface FileTableProps {
  files: FileRecord[];
  isManager: boolean;
  canDelete?: boolean;
  userRole?: Role;
  onFileRenamed: (file: FileRecord) => void;
  onFileDeleted: (id: string) => void;
  onFilesDeleted?: (ids: string[]) => void;
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
  canDelete,
  userRole,
  onFileRenamed,
  onFileDeleted,
  onFilesDeleted,
  isLoading,
}: FileTableProps) {
  // super_admin=isManager can rename+delete, admin can delete only, user can neither
  const showRename = isManager;
  const showDelete = isManager || (canDelete ?? false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [targetFile, setTargetFile] = useState<FileRecord | null>(null);
  const [viewFileId, setViewFileId] = useState<string | null>(null);
  const [viewFileName, setViewFileName] = useState<string>('');
  const [error, setError] = useState('');

  // Multiple selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteModal, setBatchDeleteModal] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetFile.id);
        return next;
      });
      setModalMode(null);
      setTargetFile(null);
    } catch {
      setError('Network error.');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setError('');
    setBatchDeleting(true);
    try {
      const idsArray = Array.from(selectedIds);
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray }),
      });
      const data = await res.json() as { success?: boolean; count?: number; deletedIds?: string[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Error deleting selected files.');
        return;
      }

      const deleted = data.deletedIds || idsArray;
      if (onFilesDeleted) {
        onFilesDeleted(deleted);
      } else {
        deleted.forEach((id) => onFileDeleted(id));
      }
      setSelectedIds(new Set());
      setBatchDeleteModal(false);
    } catch {
      setError('Network error deleting files.');
    } finally {
      setBatchDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-100 rounded-lg h-12" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-slate-500 font-medium">No files found</p>
        <p className="text-slate-400 text-sm mt-1">
          Upload a file to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Batch Action Toolbar when files are selected */}
      {showDelete && selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-red-50/90 border border-red-200/90 rounded-xl px-4 py-2.5 mb-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-red-950">
              {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setBatchDeleteModal(true)}
              disabled={batchDeleting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {showDelete && (
                <th className="w-10 py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={files.length > 0 && selectedIds.size === files.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selectedIds.size > 0 && selectedIds.size < files.length;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    aria-label="Select all files"
                  />
                </th>
              )}
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
          <tbody className="divide-y divide-slate-100">
            {files.map((file) => {
              const isSelected = selectedIds.has(file.id);
              return (
                <tr
                  key={file.id}
                  className={cn(
                    'hover:bg-slate-100/60 transition-colors group',
                    isSelected && 'bg-indigo-50/60 hover:bg-indigo-50'
                  )}
                >
                  {showDelete && (
                    <td className="w-10 py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(file.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        aria-label={`Select ${file.name}`}
                      />
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="mt-0.5 sm:mt-0 flex-shrink-0">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => {
                            setViewFileId(file.id);
                            setViewFileName(file.name);
                          }}
                          className="text-indigo-600 hover:underline font-medium transition-colors text-left break-all sm:break-normal line-clamp-2 sm:line-clamp-none"
                        >
                          {file.name}
                        </button>
                        {/* Mobile metadata subline */}
                        <div className="sm:hidden flex items-center gap-1.5 text-xs text-slate-400 mt-1 flex-wrap">
                          {file.folder && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                              {file.folder.name}
                            </span>
                          )}
                          {file.uploader && (
                            <span className="truncate max-w-[120px]">{file.uploader.full_name ?? file.uploader.username}</span>
                          )}
                          <span>·</span>
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    {file.folder ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {file.folder.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-slate-600 text-xs">
                    {file.uploader
                      ? file.uploader.full_name ?? file.uploader.username
                      : <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-slate-500 text-xs">
                    {formatDate(file.created_at)}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                      <button
                        onClick={() => {
                          setViewFileId(file.id);
                          setViewFileName(file.name);
                        }}
                        className={cn(
                          'p-2 sm:p-1.5 rounded-lg transition-colors',
                          'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
                        )}
                        aria-label={`View ${file.name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {showRename && (
                        <button
                          onClick={() => {
                            setTargetFile(file);
                            setError('');
                            setModalMode('rename');
                          }}
                          className={cn(
                            'p-2 sm:p-1.5 rounded-lg transition-colors',
                            'text-slate-400 hover:text-blue-600 hover:bg-blue-50',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                          )}
                          aria-label={`Rename ${file.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {showDelete && (
                        <button
                          onClick={() => {
                            setTargetFile(file);
                            setError('');
                            setModalMode('delete');
                          }}
                          className={cn(
                            'p-2 sm:p-1.5 rounded-lg transition-colors',
                            'text-slate-400 hover:text-red-500 hover:bg-red-50',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
                          )}
                          aria-label={`Delete ${file.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {batchDeleteModal && (
        <Modal
          title="Delete Selected Files"
          message={`Are you sure you want to delete ${selectedIds.size} selected file${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
          confirmLabel={batchDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Files`}
          danger
          onConfirm={handleBatchDelete}
          onClose={() => { setBatchDeleteModal(false); }}
        />
      )}

      {viewFileId && (
        <FileViewModal
          fileId={viewFileId}
          fileName={viewFileName}
          userRole={userRole}
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



