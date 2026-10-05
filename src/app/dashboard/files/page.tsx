'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderSelect } from '@/components/FolderSelect';
import { FileTable } from '@/components/FileTable';
import { UploadZone } from '@/components/UploadZone';
import type { FileRecord, Folder, Profile } from '@/types';

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
  const canUpload = profile?.role === 'super_admin' || profile?.role === 'admin';
  // Only super_admin can delete/rename folders; admin can only upload
  const canDeleteFolders = profile?.role === 'super_admin';

  return (
    <div className="space-y-4">
      {/* Upload zone — admin and super_admin only */}
      {canUpload && (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Upload</h2>
          <UploadZone folders={folders} onUploaded={() => void fetchFiles()} />
        </div>
      )}

      {/* Files card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {/* Toolbar: folder dropdown + file count */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <FolderSelect
            folders={folders}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
            isManager={isSuperAdmin}
            canDelete={canDeleteFolders}
            onFolderCreated={(folder) => setFolders((prev) => [...prev, folder])}
            onFolderRenamed={(updated) =>
              setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
            }
            onFolderDeleted={(id) => {
              setFolders((prev) => prev.filter((f) => f.id !== id));
              if (selectedFolderId === id) setSelectedFolderId(null);
            }}
          />
          <span className="text-xs text-slate-400 flex-shrink-0">
            {loadingFiles ? '...' : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <FileTable
          files={files}
          isManager={isSuperAdmin}
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
