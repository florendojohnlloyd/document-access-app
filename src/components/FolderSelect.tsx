'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, FolderOpen, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';
import type { Folder } from '@/types';

interface FolderSelectProps {
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

export function FolderSelect({
  folders,
  selectedId,
  onSelect,
  isManager,
  canDelete,
  onFolderCreated,
  onFolderRenamed,
  onFolderDeleted,
}: FolderSelectProps) {
  const canDeleteFolders = canDelete ?? isManager;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [targetFolder, setTargetFolder] = useState<Folder | null>(null);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedFolder = folders.find((f) => f.id === selectedId) ?? null;

  const filtered = folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (id: string | null) => {
    onSelect(id);
    setOpen(false);
    setSearch('');
  };

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
      if (!res.ok || 'error' in data) { setError(('error' in data ? data.error : null) ?? 'Error'); return; }
      onFolderCreated(data as Folder);
      setModalMode(null);
    } catch { setError('Network error.'); }
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
      if (!res.ok || 'error' in data) { setError(('error' in data ? data.error : null) ?? 'Error'); return; }
      onFolderRenamed(data as Folder);
      setModalMode(null); setTargetFolder(null);
    } catch { setError('Network error.'); }
  };

  const handleDelete = async () => {
    if (!targetFolder) return;
    setError('');
    try {
      const res = await fetch(`/api/folders?id=${targetFolder.id}`, { method: 'DELETE' });
      const data = await res.json() as { success: boolean } | { error: string };
      if (!res.ok || 'error' in data) { setError(('error' in data ? data.error : null) ?? 'Error'); return; }
      onFolderDeleted(targetFolder.id);
      if (selectedId === targetFolder.id) onSelect(null);
      setModalMode(null); setTargetFolder(null);
    } catch { setError('Network error.'); }
  };

  return (
    <>
      <div ref={ref} className="relative w-56">
        {/* Trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
            'bg-white text-slate-700 border-slate-200',
            'hover:border-indigo-400 hover:text-indigo-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            open && 'border-indigo-400 ring-2 ring-indigo-500/20'
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 truncate">
            <FolderOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate font-medium">
              {selectedFolder ? selectedFolder.name : 'All Files'}
            </span>
          </span>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] z-30 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search folders..."
                  className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Options */}
            <ul className="max-h-52 overflow-y-auto py-1" role="listbox">
              {/* All Files option */}
              <li>
                <button
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left',
                    selectedId === null
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                  role="option"
                  aria-selected={selectedId === null}
                >
                  <FolderOpen className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  <span className="flex-1">All Files</span>
                  {selectedId === null && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              </li>

              {/* Folder options */}
              {filtered.length === 0 && search && (
                <li className="px-3 py-3 text-xs text-slate-400 text-center">No folders found</li>
              )}
              {filtered.map((folder) => (
                <li key={folder.id}>
                  <div className={cn(
                    'group flex items-center gap-2 px-3 py-2 transition-colors',
                    selectedId === folder.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  )}>
                    <button
                      onClick={() => handleSelect(folder.id)}
                      className="flex-1 flex items-center gap-2 text-sm text-left"
                      role="option"
                      aria-selected={selectedId === folder.id}
                    >
                      <FolderOpen className={cn(
                        'w-4 h-4 flex-shrink-0',
                        selectedId === folder.id ? 'text-indigo-500' : 'text-slate-400'
                      )} />
                      <span className={cn(
                        'flex-1 truncate',
                        selectedId === folder.id ? 'text-indigo-700 font-medium' : 'text-slate-700'
                      )}>
                        {folder.name}
                      </span>
                      {selectedId === folder.id && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                    </button>

                    {/* Folder actions */}
                    {(isManager || canDeleteFolders) && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {isManager && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setTargetFolder(folder); setModalMode('rename'); setOpen(false); }}
                            className="p-1 rounded text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            aria-label={`Rename ${folder.name}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        {canDeleteFolders && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setTargetFolder(folder); setModalMode('delete'); setOpen(false); }}
                            className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            aria-label={`Delete ${folder.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* New folder button */}
            {isManager && (
              <div className="border-t border-slate-100 p-1.5">
                <button
                  onClick={() => { setOpen(false); setModalMode('create'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Folder
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalMode === 'create' && (
        <Modal title="Create Folder" inputLabel="Folder Name" defaultValue="" confirmLabel="Create"
          onConfirm={handleCreate} onClose={() => setModalMode(null)} />
      )}
      {modalMode === 'rename' && targetFolder && (
        <Modal title="Rename Folder" inputLabel="New Name" defaultValue={targetFolder.name} confirmLabel="Rename"
          onConfirm={handleRename} onClose={() => { setModalMode(null); setTargetFolder(null); }} />
      )}
      {modalMode === 'delete' && targetFolder && (
        <Modal title="Delete Folder" message={`Delete folder "${targetFolder.name}"?`} confirmLabel="Delete" danger
          onConfirm={handleDelete} onClose={() => { setModalMode(null); setTargetFolder(null); }} />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-xs text-red-400 underline mt-1">Dismiss</button>
        </div>
      )}
    </>
  );
}
