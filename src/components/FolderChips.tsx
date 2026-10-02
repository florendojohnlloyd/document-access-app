'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';
import type { Folder } from '@/types';

interface FolderChipsProps {
  folders: Folder[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isManager: boolean;
  onFolderCreated: (folder: Folder) => void;
  onFolderRenamed: (folder: Folder) => void;
  onFolderDeleted: (id: string) => void;
}

type ModalMode = 'create' | 'rename' | 'delete' | null;

export function FolderChips({
  folders,
  selectedId,
  onSelect,
  isManager,
  onFolderCreated,
  onFolderRenamed,
  onFolderDeleted,
}: FolderChipsProps) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [targetFolder, setTargetFolder] = useState<Folder | null>(null);
  const [error, setError] = useState('');

  const handleCreate = async (name?: string) => {
    if (!name?.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json() as Folder | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error creating folder.');
        return;
      }
      onFolderCreated(data as Folder);
      setModalMode(null);
    } catch {
      setError('Network error.');
    }
  };

  const handleRename = async (name?: string) => {
    if (!name?.trim() || !targetFolder) return;
    setError('');
    try {
      const res = await fetch(`/api/folders?id=${targetFolder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json() as Folder | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error renaming folder.');
        return;
      }
      onFolderRenamed(data as Folder);
      setModalMode(null);
      setTargetFolder(null);
    } catch {
      setError('Network error.');
    }
  };

  const handleDelete = async () => {
    if (!targetFolder) return;
    setError('');
    try {
      const res = await fetch(`/api/folders?id=${targetFolder.id}`, { method: 'DELETE' });
      const data = await res.json() as { success: boolean } | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error deleting folder.');
        return;
      }
      onFolderDeleted(targetFolder.id);
      if (selectedId === targetFolder.id) onSelect(null);
      setModalMode(null);
      setTargetFolder(null);
    } catch {
      setError('Network error.');
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-nowrap">
      {/* All chip */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          selectedId === null
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        )}
      >
        <FolderOpen className="w-3.5 h-3.5" />
        All
      </button>

      {/* Folder chips */}
      {folders.map((folder) => (
        <div key={folder.id} className="flex items-center gap-1 flex-shrink-0 group">
          <button
            onClick={() => onSelect(folder.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              selectedId === folder.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {folder.name}
          </button>

          {/* Manager folder actions */}
          {isManager && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setTargetFolder(folder);
                  setError('');
                  setModalMode('rename');
                }}
                className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-600/10 transition-colors"
                aria-label={`Rename folder ${folder.name}`}
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  setTargetFolder(folder);
                  setError('');
                  setModalMode('delete');
                }}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label={`Delete folder ${folder.name}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add folder button */}
      {isManager && (
        <button
          onClick={() => {
            setError('');
            setModalMode('create');
          }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium flex-shrink-0',
            'border-2 border-dashed border-slate-200',
            'text-slate-500 hover:border-indigo-500 hover:text-indigo-600',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          New Folder
        </button>
      )}

      {/* Modals */}
      {modalMode === 'create' && (
        <Modal
          title="Create Folder"
          inputLabel="Folder Name"
          defaultValue=""
          confirmLabel="Create"
          onConfirm={handleCreate}
          onClose={() => setModalMode(null)}
        />
      )}

      {modalMode === 'rename' && targetFolder && (
        <Modal
          title="Rename Folder"
          inputLabel="New Name"
          defaultValue={targetFolder.name}
          confirmLabel="Rename"
          onConfirm={handleRename}
          onClose={() => { setModalMode(null); setTargetFolder(null); }}
        />
      )}

      {modalMode === 'delete' && targetFolder && (
        <Modal
          title="Delete Folder"
          message={`Are you sure you want to delete the folder "${targetFolder.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => { setModalMode(null); setTargetFolder(null); }}
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
    </div>
  );
}

