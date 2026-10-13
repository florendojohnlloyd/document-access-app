'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderSelect } from '@/components/FolderSelect';
import { FileTable } from '@/components/FileTable';
import { UploadZone } from '@/components/UploadZone';
import { Modal } from '@/components/Modal';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileRecord, Folder, Profile } from '@/types';

// ── New Folder button ────────────────────────────────────────────────────────
function NewFolderButton({
  onFolderCreated,
}: {
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
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Error creating folder.');
        return;
      }
      onFolderCreated(data as Folder);
      setShowModal(false);
    } catch {
      setError('Network error.');
    }
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

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: Profile) => setProfile(data))
      .catch(() => {});
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json() as Folder[];
      setFolders(data);
    } catch {}
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const url = selectedFolderId
        ? `/api/files?folder_id=${selectedFolderId}`
        : '/api/files';
      const res = await fetch(url);
      const data = await res.json() as FileRecord[];
      setFiles(data);
    } catch {
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedFolderId]);

  useEffect(() => { void fetchFolders(); }, [fetchFolders]);
  useEffect(() => { void fetchFiles(); }, [fetchFiles]);

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

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Upload</h2>
        <UploadZone folders={folders} onUploaded={() => void fetchFiles()} />
      </div>

      {/* Files card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {/* Toolbar: folder dropdown + new folder button + file count */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Folder dropdown */}
          <FolderSelect
            folders={folders}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
            isManager={canManageFolders}
            canDelete={canManageFolders}
            onFolderCreated={handleFolderCreated}
            onFolderRenamed={handleFolderRenamed}
            onFolderDeleted={handleFolderDeleted}
          />

          {/* New Folder button — admin and super_admin only */}
          {canManageFolders && (
            <NewFolderButton
              folders={folders}
              selectedFolderId={null}
              onFolderCreated={handleFolderCreated}
            />
          )}

          {/* File count — pushed to right */}
          <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
            {loadingFiles ? '...' : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <FileTable
          files={files}
          isManager={isSuperAdmin}
          canDelete={canDelete}
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
