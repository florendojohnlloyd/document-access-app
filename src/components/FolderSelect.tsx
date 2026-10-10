'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Search, FolderOpen, Folder, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';
import type { Folder as FolderType } from '@/types';

interface FolderSelectProps {
  folders: FolderType[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isManager: boolean;   // can create/delete folders
  canDelete?: boolean;
  onFolderCreated: (folder: FolderType) => void;
  onFolderRenamed: (folder: FolderType) => void;
  onFolderDeleted: (id: string) => void;
}

type ModalMode = 'create' | 'create-sub' | 'rename' | 'delete' | null;

// Build tree from flat list
function buildTree(folders: FolderType[]): FolderType[] {
  const map = new Map<string, FolderType>();
  const roots: FolderType[] = [];

  folders.forEach((f) => map.set(f.id, { ...f, subfolders: [] }));
  map.forEach((f) => {
    if (f.parent_folder_id) {
      const parent = map.get(f.parent_folder_id);
      if (parent) parent.subfolders = [...(parent.subfolders ?? []), f];
    } else {
      roots.push(f);
    }
  });

  return roots;
}

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [targetFolder, setTargetFolder] = useState<FolderType | null>(null);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const tree = buildTree(folders);

  // Flatten for search
  const allFolders = folders;
  const filtered = search
    ? allFolders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const selectedFolder = folders.find((f) => f.id === selectedId) ?? null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (id: string | null) => {
    onSelect(id); setOpen(false); setSearch('');
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async (name?: string) => {
    if (!name?.trim()) return;
    setError('');
    try {
      const body = modalMode === 'create-sub' && targetFolder
        ? { name: name.trim(), parent_folder_id: targetFolder.id }
        : { name: name.trim(), parent_folder_id: null };

      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as FolderType | { error: string };
      if (!res.ok || 'error' in data) { setError(('error' in data ? data.error : null) ?? 'Error'); return; }
      onFolderCreated(data as FolderType);
      // Auto-expand parent when subfolder is created
      if (modalMode === 'create-sub' && targetFolder) {
        setExpanded((prev) => new Set([...prev, targetFolder.id]));
      }
      setModalMode(null); setTargetFolder(null);
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
      const data = await res.json() as FolderType | { error: string };
      if (!res.ok || 'error' in data) { setError(('error' in data ? data.error : null) ?? 'Error'); return; }
      onFolderRenamed(data as FolderType);
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

  const FolderItem = ({ folder, depth = 0 }: { folder: FolderType; depth?: number }) => {
    const isSelected = selectedId === folder.id;
    const hasSubs = (folder.subfolders?.length ?? 0) > 0;
    const isExpanded = expanded.has(folder.id);

    return (
      <>
        <li>
          <div
            className={cn(
              'group flex items-center gap-1 pr-2 transition-colors',
              isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
            )}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
          >
            {/* Expand toggle */}
            <button
              onClick={(e) => hasSubs ? toggleExpand(folder.id, e) : e.stopPropagation()}
              className={cn(
                'w-5 h-5 flex items-center justify-center flex-shrink-0 rounded transition-colors',
                hasSubs ? 'text-slate-400 hover:text-slate-600' : 'text-transparent cursor-default'
              )}
              tabIndex={-1}
            >
              {hasSubs
                ? isExpanded
                  ? <ChevronDown className="w-3 h-3" />
                  : <ChevronRight className="w-3 h-3" />
                : <span className="w-3 h-3" />}
            </button>

            {/* Folder button */}
            <button
              onClick={() => handleSelect(folder.id)}
              className="flex-1 flex items-center gap-2 py-2 text-sm text-left min-w-0"
              role="option"
              aria-selected={isSelected}
            >
              {hasSubs && isExpanded
                ? <FolderOpen className={cn('w-4 h-4 flex-shrink-0', isSelected ? 'text-indigo-500' : 'text-slate-400')} />
                : <Folder className={cn('w-4 h-4 flex-shrink-0', isSelected ? 'text-indigo-500' : 'text-slate-400')} />
              }
              <span className={cn('truncate flex-1', isSelected ? 'text-indigo-700 font-medium' : 'text-slate-700')}>
                {folder.name}
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
            </button>

            {/* Actions */}
            {(isManager || canDeleteFolders) && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {/* Add subfolder — only for root folders (depth=0) */}
                {isManager && depth === 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setTargetFolder(folder); setModalMode('create-sub'); setOpen(false); }}
                    className="p-1 rounded text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    aria-label={`Add subfolder to ${folder.name}`}
                    title="Add sub-folder"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
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

        {/* Subfolders */}
        {hasSubs && isExpanded && folder.subfolders!.map((sub) => (
          <FolderItem key={sub.id} folder={sub} depth={depth + 1} />
        ))}
      </>
    );
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
          <div className="absolute top-full left-0 mt-1 w-64 z-30 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
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

            <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
              {/* All Files */}
              <li>
                <button
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left',
                    selectedId === null ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <FolderOpen className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  <span className="flex-1">All Files</span>
                  {selectedId === null && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              </li>

              {/* Flat search results */}
              {search && filtered?.length === 0 && (
                <li className="px-3 py-3 text-xs text-slate-400 text-center">No folders found</li>
              )}
              {search && filtered?.map((folder) => (
                <li key={folder.id}>
                  <button
                    onClick={() => handleSelect(folder.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left',
                      selectedId === folder.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Folder className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    <span className="flex-1 truncate">{folder.name}</span>
                    {folder.parent_folder_id && (
                      <span className="text-xs text-slate-400 flex-shrink-0">sub</span>
                    )}
                    {selectedId === folder.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                </li>
              ))}

              {/* Tree view */}
              {!search && tree.map((folder) => (
                <FolderItem key={folder.id} folder={folder} depth={0} />
              ))}
            </ul>

            {/* New root folder button */}
            {isManager && (
              <div className="border-t border-slate-100 p-1.5">
                <button
                  onClick={() => { setOpen(false); setTargetFolder(null); setModalMode('create'); }}
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
          onConfirm={handleCreate} onClose={() => { setModalMode(null); setTargetFolder(null); }} />
      )}
      {modalMode === 'create-sub' && targetFolder && (
        <Modal
          title={`New Sub-folder in "${targetFolder.name}"`}
          inputLabel="Sub-folder Name"
          defaultValue=""
          confirmLabel="Create"
          onConfirm={handleCreate}
          onClose={() => { setModalMode(null); setTargetFolder(null); }}
        />
      )}
      {modalMode === 'rename' && targetFolder && (
        <Modal title="Rename Folder" inputLabel="New Name" defaultValue={targetFolder.name} confirmLabel="Rename"
          onConfirm={handleRename} onClose={() => { setModalMode(null); setTargetFolder(null); }} />
      )}
      {modalMode === 'delete' && targetFolder && (
        <Modal title="Delete Folder" message={`Delete "${targetFolder.name}"? This cannot be undone.`} confirmLabel="Delete" danger
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
