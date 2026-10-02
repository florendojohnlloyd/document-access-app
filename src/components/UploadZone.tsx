'use client';

import { useRef, useState } from 'react';
import { Upload, X, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Folder } from '@/types';

interface UploadZoneProps {
  folders: Folder[];
  onUploaded: () => void;
}

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx';

export function UploadZone({ folders, onUploaded }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = () => {
    setSelectedFile(null);
    setProgress(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileSelect = (file: File) => {
    setError('');
    setSuccess('');
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'];
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

  const handleUpload = () => {
    if (!selectedFile) return;
    setError('');
    setSuccess('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (selectedFolderId) {
      formData.append('folder_id', selectedFolderId);
    }

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setSuccess(`"${selectedFile.name}" uploaded successfully!`);
        reset();
        onUploaded();
      } else {
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string };
          setError(data.error ?? 'Upload failed.');
        } catch {
          setError('Upload failed.');
        }
      }
    });

    xhr.addEventListener('error', () => {
      setUploading(false);
      setError('Network error during upload.');
    });

    xhr.open('POST', '/api/files/upload');
    xhr.send(formData);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center transition-colors',
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
          dragging
            ? 'border-indigo-600 bg-indigo-600/5'
            : selectedFile
            ? 'border-indigo-600/50 bg-indigo-600/5 cursor-default'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-600/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !selectedFile && inputRef.current?.click()}
        aria-label="Upload file area"
      >
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

        {selectedFile ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CloudUpload className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {selectedFile.name}
              </span>
              <span className="text-xs text-slate-400 flex-shrink-0">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-indigo-500 hover:text-indigo-400">Click to browse</span>
              {' '}or drag and drop your file here
            </p>
            <p className="text-xs text-slate-400">PDF, PNG, JPG, DOC, DOCX, XLS, XLSX</p>
          </div>
        )}
      </div>

      {/* Folder selector + Upload button */}
      {selectedFile && (
        <div className="flex gap-3">
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg border text-sm',
              'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100',
              'border-gray-300 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
            )}
            aria-label="Select folder"
          >
            <option value="">No folder (uncategorized)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {progress > 0 ? `${progress}%` : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress bar */}
      {uploading && progress > 0 && (
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
      )}

      {success && (
        <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">{success}</p>
      )}
    </div>
  );
}

