'use client';

import { useRef, useState } from 'react';
import { Upload, X, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Folder } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface UploadZoneProps {
  folders: Folder[];
  onUploaded: () => void;
  selectedFolderId?: string | null;
}

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.zip';

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
    
    // No file size limit - removed validation
    
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
      // Step 1: Get upload metadata
      const prepareResponse = await fetch('/api/files/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          folder_id: effectiveFolderId,
        }),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json() as { error?: string };
        throw new Error(errorData.error ?? 'Failed to prepare upload');
      }

      const prepareData = await prepareResponse.json() as {
        storagePath: string;
        folder_id: string | null;
        filename: string;
      };

      // Step 2: Upload directly to Supabase from client (NO SIZE LIMIT!)
      const supabase = createClient();
      
      // Upload using Supabase client's upload method
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(prepareData.storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(100);

      // Step 3: Confirm upload and save to database
      const confirmResponse = await fetch('/api/files/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: prepareData.filename,
          storage_path: prepareData.storagePath,
          folder_id: prepareData.folder_id,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json() as { error?: string };
        throw new Error(errorData.error ?? 'Failed to save file record');
      }

      setUploading(false);
      setSuccess(`"${selectedFile.name}" uploaded successfully!`);
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      reset();
      onUploaded();
    } catch (err) {
      setUploading(false);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed.';
      setError(errorMessage);
      
      // Auto-clear error message after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
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

      {/* File picker button / selected file */}
      {!selectedFile ? (
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
            'text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            dragging && 'border-indigo-500 bg-indigo-50 text-indigo-600'
          )}
        >
          <Paperclip className="w-4 h-4" />
          Choose file
          <span className="text-xs text-slate-400">PDF, DOC, XLS, PNG, JPG, ZIP</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-sm">
          <Paperclip className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <span className="font-medium text-indigo-700 truncate max-w-[180px]">{selectedFile.name}</span>
          <span className="text-xs text-indigo-400 flex-shrink-0">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
          <button
            onClick={reset}
            className="ml-1 text-indigo-300 hover:text-red-500 transition-colors flex-shrink-0"
            aria-label="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Folder selector — only show when file is selected and no folder selected from parent */}
      {selectedFile && !selectedFolderId && (
        <select
          value={internalFolderId}
          onChange={(e) => { setInternalFolderId(e.target.value); setError(''); }}
          className={cn(
            'px-3 py-2 rounded-lg border text-sm',
            'bg-white text-slate-800 border-slate-200',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            !internalFolderId && 'border-red-300 text-slate-400'
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
          onClick={handleUpload}
          disabled={uploading || !effectiveFolderId}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            'bg-indigo-600 hover:bg-indigo-700 text-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {progress > 0 ? `${progress}%` : 'Uploading...'}
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              Upload
            </>
          )}
        </button>
      )}

      {/* Progress bar */}
      {uploading && progress > 0 && (
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error / success */}
      {error && <p className="w-full text-red-500 text-xs">{error}</p>}
      {success && <p className="w-full text-indigo-600 text-xs font-medium">{success}</p>}
    </div>
  );
}
