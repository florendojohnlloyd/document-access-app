'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileViewModalProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function FileViewModal({ fileId, fileName, onClose }: FileViewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const ext = getExtension(fileName);
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const res = await fetch(`/api/files/${fileId}/url`);
        const data = await res.json() as { url: string } | { error: string };
        if (!res.ok || 'error' in data) {
          setError(('error' in data ? data.error : null) ?? 'Could not load file.');
        } else {
          setUrl((data as { url: string }).url);
        }
      } catch {
        setError('Network error loading file.');
      } finally {
        setLoading(false);
      }
    };

    void fetchUrl();
  }, [fileId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-modal="true"
      role="dialog"
      aria-labelledby="fileview-title"
    >
      <div className="bg-white bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
          <h2
            id="fileview-title"
            className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate max-w-xs"
          >
            {fileName}
          </h2>
          <div className="flex items-center gap-2">
            {url && (
              <>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                    'bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                    'hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                  )}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
                <a
                  href={url}
                  download={fileName}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                    'bg-teal-primary text-white',
                    'hover:bg-teal-dark transition-colors'
                  )}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 -300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-8 h-8 text-teal-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading file...</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-slate-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!loading && url && isPdf && (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={fileName}
              aria-label={`Preview of ${fileName}`}
            />
          )}

          {!loading && url && isImage && (
            <div className="flex items-center justify-center h-full p-4 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}

          {!loading && url && isOffice && (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
              className="w-full h-full border-0"
              title={fileName}
              aria-label={`Preview of ${fileName}`}
            />
          )}

          {!loading && url && !isPdf && !isImage && !isOffice && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Hindi ma-preview ang file na ito. I-download para buksan.
              </p>
              <a
                href={url}
                download={fileName}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium',
                  'bg-teal-primary text-white hover:bg-teal-dark transition-colors'
                )}
              >
                <Download className="w-4 h-4" />
                I-download ang {fileName}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

