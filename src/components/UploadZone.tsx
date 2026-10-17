'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, X, Paperclip, CheckCircle2, AlertCircle, Loader2, ListFilter, Trash2 } from 'lucide-react';
import * as tus from 'tus-js-client';
import { cn } from '@/lib/utils';
import type { Folder } from '@/types';

interface UploadZoneProps {
  folders: Folder[];
  onUploaded: () => void;
  selectedFolderId?: string | null;
}

interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'cancelled';
  progress: number;
  bytesUploaded: number;
  error?: string;
  abort?: () => void;
}

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.zip,.csv,.txt';
const ALLOWED_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'csv', 'txt'];
const CONCURRENCY = 3; // Upload up to 3 files concurrently to prevent lag and socket starvation

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({ folders, onUploaded, selectedFolderId }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<UploadItem[]>([]);
  const isUploadingRef = useRef(false);
  const cancelledRef = useRef(false);

  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [internalFolderId, setInternalFolderId] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQueueList, setShowQueueList] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const effectiveFolderId = selectedFolderId || internalFolderId;

  // Throttled UI sync to ensure 60fps without locking the browser thread
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncQueueToState = useCallback((immediate = false) => {
    if (immediate) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      setQueue([...queueRef.current]);
      return;
    }
    if (syncTimeoutRef.current) return;
    syncTimeoutRef.current = setTimeout(() => {
      syncTimeoutRef.current = null;
      setQueue([...queueRef.current]);
    }, 120);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const handleFilesSelect = (fileList: FileList | File[]) => {
    setError('');
    setSuccess('');

    const newFiles: UploadItem[] = [];
    const invalidNames: string[] = [];

    Array.from(fileList).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_EXTS.includes(ext)) {
        invalidNames.push(file.name);
        return;
      }

      // Avoid exact duplicates in current pending list
      const isDuplicate = queueRef.current.some(
        (q) => q.name === file.name && q.size === file.size && q.status !== 'error' && q.status !== 'cancelled'
      );
      if (!isDuplicate) {
        newFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          status: 'pending',
          progress: 0,
          bytesUploaded: 0,
        });
      }
    });

    if (invalidNames.length > 0) {
      setError(`Some files were skipped (unsupported type): ${invalidNames.slice(0, 3).join(', ')}${invalidNames.length > 3 ? ` and ${invalidNames.length - 3} more` : ''}`);
    }

    if (newFiles.length > 0) {
      queueRef.current = [...queueRef.current, ...newFiles];
      syncQueueToState(true);
      setShowQueueList(true);
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const removeQueueItem = (id: string) => {
    const item = queueRef.current.find((q) => q.id === id);
    if (item?.status === 'uploading' && item.abort) {
      item.abort();
    }
    queueRef.current = queueRef.current.filter((q) => q.id !== id);
    syncQueueToState(true);
    if (queueRef.current.length === 0) {
      setShowQueueList(false);
    }
  };

  const clearQueue = () => {
    // Abort any in-flight uploads
    queueRef.current.forEach((item) => {
      if (item.status === 'uploading' && item.abort) {
        item.abort();
      }
    });
    queueRef.current = [];
    isUploadingRef.current = false;
    cancelledRef.current = false;
    setUploading(false);
    setShowQueueList(false);
    setError('');
    syncQueueToState(true);
    if (inputRef.current) inputRef.current.value = '';
  };

  const cancelAllUploads = () => {
    cancelledRef.current = true;
    queueRef.current.forEach((item) => {
      if (item.status === 'uploading' && item.abort) {
        item.abort();
        item.status = 'cancelled';
      } else if (item.status === 'pending') {
        item.status = 'cancelled';
      }
    });
    isUploadingRef.current = false;
    setUploading(false);
    syncQueueToState(true);
    setError('Upload batch was cancelled.');
    setTimeout(() => setError(''), 4000);
  };

  // Upload single file routine
  const uploadSingleFile = async (item: UploadItem, folderId: string, jwtToken: string): Promise<boolean> => {
    try {
      item.status = 'uploading';
      syncQueueToState();

      // Step 1: Prepare
      const prepareRes = await fetch('/api/files/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: item.file.name,
          folder_id: folderId,
        }),
      });

      if (!prepareRes.ok) {
        const errData = await prepareRes.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to prepare (${prepareRes.status})`);
      }

      const prepareData = await prepareRes.json() as {
        storagePath: string;
        accessToken?: string;
        folder_id: string | null;
        filename: string;
      };

      const token = prepareData.accessToken || jwtToken;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oidcihmopmkhjqoxrbot.supabase.co';
      const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

      const MULTIPART_THRESHOLD = 40 * 1024 * 1024; // 40 MB
      const PART_SIZE = 38 * 1024 * 1024;
      const isMultipart = item.file.size > MULTIPART_THRESHOLD;
      const totalParts = isMultipart ? Math.ceil(item.file.size / PART_SIZE) : 1;

      if (isMultipart) {
        for (let partIndex = 0; partIndex < totalParts; partIndex++) {
          if (cancelledRef.current) throw new Error('Cancelled');
          const start = partIndex * PART_SIZE;
          const end = Math.min(item.file.size, (partIndex + 1) * PART_SIZE);
          const partBlob = item.file.slice(start, end);
          const partStoragePath = `${prepareData.storagePath}.part_${partIndex}`;

          await new Promise<void>((resolve, reject) => {
            const upload = new tus.Upload(partBlob, {
              endpoint,
              retryDelays: [0, 3000, 5000, 10000],
              chunkSize: 6 * 1024 * 1024,
              metadata: {
                bucketName: 'documents',
                objectName: partStoragePath,
                contentType: 'application/octet-stream',
                cacheControl: '3600',
              },
              headers: { authorization: `Bearer ${token}` },
              uploadDataDuringCreation: true,
              removeFingerprintOnSuccess: true,
              onError: (err) => {
                item.abort = undefined;
                reject(err);
              },
              onProgress: (bytesSent) => {
                const totalBytes = start + bytesSent;
                item.bytesUploaded = totalBytes;
                item.progress = Math.min(99, Math.round((totalBytes / item.file.size) * 100));
                syncQueueToState();
              },
              onSuccess: () => {
                item.abort = undefined;
                resolve();
              },
            });

            item.abort = () => upload.abort();
            upload.start();
          });
        }
      } else {
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(item.file, {
            endpoint,
            retryDelays: [0, 3000, 5000, 10000],
            chunkSize: 6 * 1024 * 1024,
            metadata: {
              bucketName: 'documents',
              objectName: prepareData.storagePath,
              contentType: item.file.type || 'application/octet-stream',
              cacheControl: '3600',
            },
            headers: { authorization: `Bearer ${token}` },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            onError: (err) => {
              item.abort = undefined;
              reject(err);
            },
            onProgress: (bytesSent) => {
              item.bytesUploaded = bytesSent;
              item.progress = Math.min(99, Math.round((bytesSent / item.file.size) * 100));
              syncQueueToState();
            },
            onSuccess: () => {
              item.abort = undefined;
              item.bytesUploaded = item.file.size;
              item.progress = 100;
              resolve();
            },
          });

          item.abort = () => upload.abort();
          upload.start();
        });
      }

      if (cancelledRef.current) throw new Error('Cancelled');

      // Step 2: Confirm
      const confirmRes = await fetch('/api/files/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: prepareData.filename,
          storage_path: prepareData.storagePath,
          folder_id: prepareData.folder_id,
          is_multipart: isMultipart,
          total_parts: totalParts,
          file_size: item.file.size,
          content_type: item.file.type || 'application/octet-stream',
        }),
      });

      if (!confirmRes.ok) {
        const errData = await confirmRes.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to confirm (${confirmRes.status})`);
      }

      item.status = 'done';
      item.progress = 100;
      syncQueueToState();
      return true;
    } catch (err: unknown) {
      if (item.status !== 'cancelled') {
        item.status = 'error';
        item.error = err instanceof Error ? err.message : 'Upload failed';
      }
      syncQueueToState();
      return false;
    }
  };

  // Main Upload Trigger with Concurrency Worker Pool
  const handleStartUpload = async () => {
    if (!effectiveFolderId) {
      setError('Please select a Month / Folder before uploading.');
      return;
    }

    const pendingItems = queueRef.current.filter((item) => item.status === 'pending' || item.status === 'error' || item.status === 'cancelled');
    if (pendingItems.length === 0) {
      setError('No pending files to upload.');
      return;
    }

    // Reset status for pending/retried items
    pendingItems.forEach((i) => {
      i.status = 'pending';
      i.progress = 0;
      i.bytesUploaded = 0;
      i.error = undefined;
    });

    setError('');
    setSuccess('');
    setUploading(true);
    isUploadingRef.current = true;
    cancelledRef.current = false;
    syncQueueToState(true);

    try {
      // Get shared JWT token
      let jwtToken = '';
      try {
        const tokenRes = await fetch('/api/auth/token');
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json() as { token?: string };
          jwtToken = tokenData.token || '';
        }
      } catch {}

      // Worker Pool to process files with controlled concurrency
      let nextIndex = 0;
      const workerCount = Math.min(CONCURRENCY, pendingItems.length);

      const runWorker = async () => {
        while (nextIndex < pendingItems.length && !cancelledRef.current) {
          const currentIndex = nextIndex++;
          const currentItem = pendingItems[currentIndex];
          if (!currentItem || cancelledRef.current) break;
          await uploadSingleFile(currentItem, effectiveFolderId, jwtToken);
        }
      };

      // Run parallel workers
      const workers = Array.from({ length: workerCount }, () => runWorker());
      await Promise.all(workers);

      // Evaluate summary
      const doneCount = queueRef.current.filter((q) => q.status === 'done').length;
      const errorCount = queueRef.current.filter((q) => q.status === 'error').length;

      setUploading(false);
      isUploadingRef.current = false;
      syncQueueToState(true);

      if (doneCount > 0) {
        onUploaded();
      }

      if (!cancelledRef.current) {
        if (errorCount === 0) {
          setSuccess(`Successfully uploaded all ${doneCount} file${doneCount !== 1 ? 's' : ''}!`);
          setTimeout(() => {
            clearQueue();
            setSuccess('');
          }, 4500);
        } else {
          setError(`Upload finished: ${doneCount} succeeded, ${errorCount} failed. You can retry failed files.`);
        }
      }
    } catch (err: unknown) {
      setUploading(false);
      isUploadingRef.current = false;
      setError(err instanceof Error ? err.message : 'An error occurred during batch upload.');
    }
  };

  // Calculations for overall progress
  const totalFiles = queue.length;
  const doneFiles = queue.filter((q) => q.status === 'done').length;
  const uploadingFiles = queue.filter((q) => q.status === 'uploading').length;
  const errorFiles = queue.filter((q) => q.status === 'error').length;
  const totalBytes = queue.reduce((acc, q) => acc + q.size, 0);
  const uploadedBytes = queue.reduce((acc, q) => acc + (q.status === 'done' ? q.size : q.bytesUploaded), 0);
  const overallPercent = totalBytes > 0 ? Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)) : 0;

  return (
    <div className="w-full space-y-3">
      {/* Hidden file input with multiple allowed */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelect(e.target.files);
          }
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
        {/* File picker button / Trigger */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={cn(
            'w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all',
            'text-slate-700 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 bg-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-xs',
            dragging && 'border-indigo-500 bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200',
            uploading && 'opacity-60 cursor-not-allowed'
          )}
        >
          <Paperclip className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="font-semibold">
            {totalFiles === 0 ? 'Choose files' : `Add more files (${totalFiles} selected)`}
          </span>
          <span className="text-xs text-slate-400 hidden xs:inline sm:inline">
            (Multiple files supported · Unlimited size)
          </span>
        </button>

        {/* Folder selector — show if files queued and no parent folder selected */}
        {totalFiles > 0 && !selectedFolderId && (
          <select
            value={internalFolderId}
            disabled={uploading}
            onChange={(e) => { setInternalFolderId(e.target.value); setError(''); }}
            className={cn(
              'w-full sm:w-auto px-3.5 py-2.5 rounded-xl border text-sm transition-colors',
              'bg-white text-slate-800 border-slate-200 shadow-xs',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              !internalFolderId && 'border-amber-300 text-slate-500'
            )}
            aria-label="Select destination folder"
          >
            <option value="" disabled>— Select Month / Folder —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}

        {/* Batch action buttons */}
        {totalFiles > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!uploading ? (
              <>
                <button
                  type="button"
                  onClick={handleStartUpload}
                  disabled={!effectiveFolderId}
                  className={cn(
                    'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm',
                    'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload {totalFiles} {totalFiles === 1 ? 'file' : 'files'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQueueList((prev) => !prev)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  title="Toggle files list"
                >
                  <ListFilter className="w-4 h-4 text-slate-500" />
                  <span className="hidden xs:inline">{showQueueList ? 'Hide list' : 'View list'}</span>
                </button>
                <button
                  type="button"
                  onClick={clearQueue}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                  title="Clear all selected files"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs cursor-default"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>
                    Uploading ({doneFiles}/{totalFiles})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={cancelAllUploads}
                  className="px-3.5 py-2.5 rounded-xl text-sm font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Cancel All
                </button>
                <button
                  type="button"
                  onClick={() => setShowQueueList((prev) => !prev)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {showQueueList ? 'Hide details' : 'Show details'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Aggregate Batch Progress Bar */}
      {uploading && (
        <div className="w-full space-y-1.5 pt-1 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="truncate mr-2">
              Uploading {uploadingFiles} in parallel · {doneFiles} of {totalFiles} completed {errorFiles > 0 && `(${errorFiles} failed)`}
            </span>
            <span className="font-semibold text-indigo-600 font-mono flex-shrink-0">
              {formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)} ({overallPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 rounded-full transition-all duration-150"
              style={{ width: `${Math.max(3, overallPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Expandable File Queue List */}
      {totalFiles > 0 && showQueueList && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
            <span>Selected Files ({totalFiles} total · {formatFileSize(totalBytes)})</span>
            {!uploading && (
              <button
                type="button"
                onClick={clearQueue}
                className="text-red-500 hover:underline font-normal text-[11px]"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
            {queue.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-50/60 transition-colors gap-2">
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  {item.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : item.status === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500 flex-shrink-0" />
                  ) : item.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="truncate font-medium text-slate-800" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px] flex-shrink-0">
                    {formatFileSize(item.size)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === 'uploading' && (
                    <span className="text-indigo-600 font-mono font-medium text-[11px]">
                      {item.progress}%
                    </span>
                  )}
                  {item.status === 'done' && (
                    <span className="text-emerald-600 font-medium text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                      Done
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-600 font-medium text-[11px] bg-red-50 px-1.5 py-0.5 rounded" title={item.error}>
                      Failed
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="text-slate-400 text-[11px]">
                      Queued
                    </span>
                  )}
                  {item.status === 'cancelled' && (
                    <span className="text-amber-500 text-[11px]">
                      Cancelled
                    </span>
                  )}
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeQueueItem(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
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


