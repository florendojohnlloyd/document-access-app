'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';
import type { Folder } from '@/types';

interface FolderChipsProps {
  folders: Folder[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isManager: boolean;
  canDelete?: boolean;
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
  canDelete,
  onFolderCreated,
  onFolderRenamed,
  onFolderDeleted,
}: FolderChipsProps) {
  const canDeleteFolders = canDelete ?? isManager;
  const showActions = isManager || canDeleteFolders;

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
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* All chip */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          selectedId === null
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        )}
      >
        All
      </button>

      {/* Folder chips */}
      {folders.map((folder) => {
        const isSelected = selectedId === folder.id;
        return (
          <div key={folder.id} className="group relative flex-shrink-0">
            <button
              onClick={() => onSelect(folder.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                // Extra right padding when actions are shown, to make room
                showActions ? 'pl-3 pr-8 py-1.5' : 'px-3 py-1.5',
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {folder.name}
            </button>

            {/* Inline action buttons — absolutely positioned inside the chip */}
            {showActions && (
              <div className={cn(
                'absolute right-1.5 top-1/2 -translate-y-1/2',
                'flex items-center gap-0.5',
                'opacity-0 group-hover:opacity-100 transition-opacity'
              )}>
                {isManager && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetFolder(folder);
                      setError('');
                      setModalMode('rename');
                    }}
                    className={cn(
                      'p-0.5 rounded-full transition-colors',
                      isSelected
                        ? 'text-white/70 hover:text-white hover:bg-white/20'
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-100'
                    )}
                    aria-label={`Rename ${folder.name}`}
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                )}
                {canDeleteFolders && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetFolder(folder);
                      setError('');
                      setModalMode('delete');
                    }}
                    className={cn(
                      'p-0.5 rounded-full transition-colors',
                      isSelected
                        ? 'text-white/70 hover:text-white hover:bg-white/20'
                        : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                    )}
                    aria-label={`Delete ${folder.name}`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* New Folder button — super_admin only */}
      {isManager && (
        <button
          onClick={() => { setError(''); setModalMode('create'); }}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0',
            'border border-dashed border-slate-300',
            'text-slate-400 hover:border-indigo-400 hover:text-indigo-600',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
          )}
        >
          <Plus className="w-3 h-3" />
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
          message={`Delete folder "${targetFolder.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => { setModalMode(null); setTargetFolder(null); }}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-xs text-red-400 underline mt-1">Dismiss</button>
        </div>
      )}
    </div>
  );
}
