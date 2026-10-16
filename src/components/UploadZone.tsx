'use client';

import { useRef, useState } from 'react';
import { Upload, X, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Folder } from '@/types';

interface UploadZoneProps {
  folders: Folder[];
  onUploaded: () => void;
  selectedFolderId?: string | null;
}

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.zip';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({ folders, onUploaded, selectedFolderId }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [internalFolderId, setInternalFolderId] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const effectiveFolderId = selectedFolderId || internalFolderId;

  const reset = () => {
    setSelectedFile(null);
    setProgress(0);
    setError('');
    setInternalFolderId('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileSelect = (file: File) => {
    setError('');
    setSuccess('');

    // No file size limit — direct Supabase upload handles large files!
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx', 'zip'];
    if (!allowed.includes(ext)) {
      setError(`File type .${ext} is not allowed.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    // Require folder selection
    if (!effectiveFolderId) {
      setError('Please select a Month / Folder before uploading.');
      return;
    }
    setError('');
    setSuccess('');
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Request signed upload URL from prepare route (bypasses Vercel 4.5MB payload limit)
      const prepareRes = await fetch('/api/files/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          folder_id: effectiveFolderId,
        }),
      });

      if (!prepareRes.ok) {
        const errData = await prepareRes.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to prepare upload (${prepareRes.status})`);
      }

      const prepareData = await prepareRes.json() as {
        storagePath: string;
        signedUrl: string;
        token: string;
        folder_id: string | null;
        filename: string;
      };

      // Step 2: Upload directly to Supabase storage signed URL using XMLHttpRequest (tracks real progress)
      const uploadForm = new FormData();
      uploadForm.append('cacheControl', '3600');
      uploadForm.append('', selectedFile);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
          setProgress(percent);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const data = JSON.parse(xhr.responseText) as { error?: string; message?: string };
              reject(new Error(data.error ?? data.message ?? `Direct upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Direct upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload to storage'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'));
        });

        xhr.open('PUT', prepareData.signedUrl);
        xhr.send(uploadForm);
      });

      setProgress(100);

      // Step 3: Confirm upload with server to record file in database and create audit log
      const confirmRes = await fetch('/api/files/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: prepareData.filename,
          storage_path: prepareData.storagePath,
          folder_id: prepareData.folder_id,
        }),
      });

      if (!confirmRes.ok) {
        const errData = await confirmRes.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to confirm upload (${confirmRes.status})`);
      }

      setUploading(false);
      setSuccess(`"${selectedFile.name}" uploaded successfully!`);

      // Auto-clear success message after 4 seconds
      setTimeout(() => {
        setSuccess('');
      }, 4000);

      reset();
      onUploaded();
    } catch (err) {
      setUploading(false);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed.';
      setError(errorMessage);
      console.error('Upload error:', err);

      // Auto-clear error message after 6 seconds
      setTimeout(() => {
        setError('');
      }, 6000);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
        {/* File picker button / selected file */}
        {!selectedFile ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-colors',
              'text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 bg-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm',
              dragging && 'border-indigo-500 bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200'
            )}
          >
            <Paperclip className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="font-medium">Choose file</span>
            <span className="text-xs text-slate-400 hidden xs:inline sm:inline">
              (No size limit · PDF, DOC, XLS, PNG, JPG, ZIP)
            </span>
          </button>
        ) : (
          <div className="w-full sm:w-auto flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 text-sm shadow-sm">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Paperclip className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="font-medium text-indigo-900 truncate max-w-[180px] sm:max-w-xs" title={selectedFile.name}>
                {selectedFile.name}
              </span>
              <span className="text-xs text-indigo-600/75 bg-indigo-100/80 px-1.5 py-0.5 rounded-md font-mono flex-shrink-0">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={reset}
                className="p-1 rounded-md text-indigo-400 hover:text-red-500 hover:bg-white/60 transition-colors flex-shrink-0 ml-1"
                aria-label="Remove selected file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Folder selector — show when file is selected and no folder selected from parent */}
        {selectedFile && !selectedFolderId && (
          <select
            value={internalFolderId}
            disabled={uploading}
            onChange={(e) => { setInternalFolderId(e.target.value); setError(''); }}
            className={cn(
              'w-full sm:w-auto px-3.5 py-2.5 rounded-xl border text-sm transition-colors',
              'bg-white text-slate-800 border-slate-200 shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              !internalFolderId && 'border-amber-300 text-slate-500'
            )}
            aria-label="Select folder"
          >
            <option value="" disabled>— Select Month / Folder —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}

        {/* Upload button */}
        {selectedFile && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !effectiveFolderId}
            className={cn(
              'w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm',
              'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>{progress > 0 ? `Uploading (${progress}%)` : 'Uploading...'}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="w-full space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Direct storage upload</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-200"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error / success messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <p className="flex-1 font-medium">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-xs underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <p className="flex-1 font-medium">{success}</p>
        </div>
      )}
    </div>
  );
}

