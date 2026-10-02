'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderChips } from '@/components/FolderChips';
import { FileTable } from '@/components/FileTable';
import { UploadZone } from '@/components/UploadZone';
import type { FileRecord, Folder, Profile } from '@/types';

export default function FilesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Fetch current user profile
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: Profile) => setProfile(data))
      .catch(() => {});
  }, []);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json() as Folder[];
      setFolders(data);
    } catch {}
  }, []);

  // Fetch files
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

  useEffect(() => {
    void fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  const isManager = profile?.role === 'manager';

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Upload File
        </h2>
        <UploadZone
          folders={folders}
          onUploaded={() => void fetchFiles()}
        />
      </div>

      {/* Folder chips */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="mb-4">
          <FolderChips
            folders={folders}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
            isManager={isManager}
            onFolderCreated={(folder) => setFolders((prev) => [...prev, folder])}
            onFolderRenamed={(updated) =>
              setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
            }
            onFolderDeleted={(id) => setFolders((prev) => prev.filter((f) => f.id !== id))}
          />
        </div>

        {/* File count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {loadingFiles ? 'Loading...' : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* File table */}
        <FileTable
          files={files}
          isManager={isManager}
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

