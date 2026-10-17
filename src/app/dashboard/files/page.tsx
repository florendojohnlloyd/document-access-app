'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { FolderSelect } from '@/components/FolderSelect';
import { FileTable } from '@/components/FileTable';
import { UploadZone } from '@/components/UploadZone';
import { Modal } from '@/components/Modal';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileRecord, Folder, Profile } from '@/types';

// ── New Folder button ─────────────────────────────────────────────────────────
function NewFolderButton({ onFolderCreated }: {
  folders: Folder[];
  selectedFolderId: string | null;
  onFolderCreated: (f: Folder) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (name?: string) => {
    if (!name?.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), parent_folder_id: null }),
      });
      const data = await res.json() as Folder | { error: string };
      if (!res.ok || 'error' in data) { setError(('error' in data ? data.error : null) ?? 'Error.'); return; }
      onFolderCreated(data as Folder);
      setShowModal(false);
    } catch { setError('Network error.'); }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
          'border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
        )}
      >
        <Plus className="w-3.5 h-3.5" />
        New Folder
      </button>
      {showModal && (
        <Modal
          title="New Folder"
          inputLabel="Folder Name"
          defaultValue=""
          confirmLabel="Create"
          onConfirm={handleCreate}
          onClose={() => setShowModal(false)}
        />
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
// ─────────────────────────────────────────────────────────────────────────────

export default function FilesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Filters: WB, AB, BP, ALL and search
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'WB' | 'AB' | 'BP'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: Profile) => setProfile(data))
      .catch(() => {});
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFolders(data);
      } else {
        setFolders([]);
      }
    } catch {
      setFolders([]);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const url = selectedFolderId ? `/api/files?folder_id=${selectedFolderId}` : '/api/files';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setFiles(data);
      } else {
        setFiles([]);
      }
    } catch {
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedFolderId]);

  useEffect(() => { void fetchFolders(); }, [fetchFolders]);
  useEffect(() => { void fetchFiles(); }, [fetchFiles]);

  // Auto-select branch folder on load for non-super_admin
  useEffect(() => {
    if (!profile || profile.role === 'super_admin' || !profile.branch) return;
    if (folders.length === 0) return;
    const branchFolder = folders.find(
      (f) => f.name.toUpperCase() === profile.branch?.toUpperCase() && !f.parent_folder_id
    );
    if (branchFolder && selectedFolderId === null) {
      setSelectedFolderId(branchFolder.id);
    }
  }, [profile, folders, selectedFolderId]);

  const isSuperAdmin = profile?.role === 'super_admin';
  const canDelete = profile?.role === 'super_admin' || profile?.role === 'admin';
  const canManageFolders = profile?.role === 'super_admin' || profile?.role === 'admin';

  const handleFolderCreated = (folder: Folder) => setFolders((prev) => [...prev, folder]);
  const handleFolderRenamed = (updated: Folder) =>
    setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  const handleFolderDeleted = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (selectedFolderId === id) setSelectedFolderId(null);
  };

  // Branch-filtered folders for UploadZone
  const uploadableFolders = isSuperAdmin || !profile?.branch
    ? folders
    : folders.filter(
        (f) =>
          f.name.toUpperCase() === profile.branch?.toUpperCase() ||
          folders.some(
            (p) => p.name.toUpperCase() === profile.branch?.toUpperCase() && f.parent_folder_id === p.id
          )
      );

  // Compute category counts for WB, AB, BP
  const wbCount = useMemo(() => files.filter((f) => f.name.toUpperCase().includes('WB')).length, [files]);
  const abCount = useMemo(() => files.filter((f) => f.name.toUpperCase().includes('AB')).length, [files]);
  const bpCount = useMemo(() => files.filter((f) => f.name.toUpperCase().includes('BP')).length, [files]);

  // Filter files by type (WB, AB, BP, ALL) and search query
  const displayedFiles = useMemo(() => {
    return files.filter((f) => {
      const upperName = f.name.toUpperCase();
      if (typeFilter !== 'ALL' && !upperName.includes(typeFilter)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        if (!upperName.includes(q)) return false;
      }
      return true;
    });
  }, [files, typeFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Single combined card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-5 shadow-xs">

        {/* Upload section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Upload Files</h2>
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              No size limit · Multi-file
            </span>
          </div>
          <UploadZone
            folders={uploadableFolders}
            selectedFolderId={selectedFolderId}
            onUploaded={() => void fetchFiles()}
          />
        </div>

        <div className="border-t border-slate-100" />

        {/* Folder toolbar & Category Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <FolderSelect
                folders={folders}
                selectedId={selectedFolderId}
                onSelect={setSelectedFolderId}
                isManager={canManageFolders}
                canDelete={canManageFolders}
                userBranch={profile?.branch ?? null}
                isSuperAdmin={isSuperAdmin}
                onFolderCreated={handleFolderCreated}
                onFolderRenamed={handleFolderRenamed}
                onFolderDeleted={handleFolderDeleted}
              />

              {canManageFolders && (
                <NewFolderButton
                  folders={folders}
                  selectedFolderId={null}
                  onFolderCreated={handleFolderCreated}
                />
              )}

              {/* WB, AB, BP Filter Pills */}
              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl gap-1 text-xs font-semibold text-slate-600 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                    typeFilter === 'ALL'
                      ? 'bg-white text-indigo-600 shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-500 hover:bg-slate-200/50'
                  )}
                >
                  <span>All</span>
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono', typeFilter === 'ALL' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'bg-slate-200/70 text-slate-500')}>
                    {files.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTypeFilter('WB')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                    typeFilter === 'WB'
                      ? 'bg-white text-indigo-600 shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-500 hover:bg-slate-200/50'
                  )}
                >
                  <span>WB</span>
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono', typeFilter === 'WB' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'bg-slate-200/70 text-slate-500')}>
                    {wbCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTypeFilter('AB')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                    typeFilter === 'AB'
                      ? 'bg-white text-indigo-600 shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-500 hover:bg-slate-200/50'
                  )}
                >
                  <span>AB</span>
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono', typeFilter === 'AB' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'bg-slate-200/70 text-slate-500')}>
                    {abCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTypeFilter('BP')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                    typeFilter === 'BP'
                      ? 'bg-white text-indigo-600 shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-500 hover:bg-slate-200/50'
                  )}
                >
                  <span>BP</span>
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono', typeFilter === 'BP' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'bg-slate-200/70 text-slate-500')}>
                    {bpCount}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-400 flex-shrink-0">
              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white w-40 sm:w-52 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <span className="font-medium text-slate-500 whitespace-nowrap pl-1">
                {loadingFiles ? 'Loading...' : `${displayedFiles.length} file${displayedFiles.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>

        {/* File table */}
        <FileTable
          files={displayedFiles}
          isManager={isSuperAdmin}
          canDelete={canDelete}
          userRole={profile?.role}
          onFileRenamed={(updated) =>
            setFiles((prev) => prev.map((f) => (f.id === updated.id ? { ...f, name: updated.name } : f)))
          }
          onFileDeleted={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          isLoading={loadingFiles}
        />
      </div>
    </div>
  );
}
