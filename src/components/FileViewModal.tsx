'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Download, FileText, FileSpreadsheet, File, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileViewModalProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function FileTypeIcon({ ext }: { ext: string }) {
  if (ext === 'pdf') return <FileText className="w-10 h-10 text-red-400" />;
  if (['xls', 'xlsx'].includes(ext)) return <FileSpreadsheet className="w-10 h-10 text-green-500" />;
  if (['doc', 'docx'].includes(ext)) return <FileText className="w-10 h-10 text-blue-500" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return <FileImage className="w-10 h-10 text-purple-400" />;
  return <File className="w-10 h-10 text-slate-400" />;
}

export function FileViewModal({ fileId, fileName, onClose }: FileViewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [iframeError, setIframeError] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-modal="true"
      role="dialog"
      aria-labelledby="fileview-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <h2 id="fileview-title" className="text-sm font-semibold text-slate-800 truncate max-w-xs">
            {fileName}
          </h2>
          <div className="flex items-center gap-2">
            {url && (
              <>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
                <a
                  href={url}
                  download={fileName}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-full">
              <svg className="animate-spin w-7 h-7 text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* PDF — direct iframe */}
          {!loading && url && isPdf && (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={fileName}
            />
          )}

          {/* Image */}
          {!loading && url && isImage && (
            <div className="flex items-center justify-center h-full p-6 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
          )}

          {/* Office files — MS Office Online viewer, falls back to download card */}
          {!loading && url && isOffice && !iframeError && (
            <iframe
              key={url}
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              className="w-full h-full border-0"
              title={fileName}
              onError={() => setIframeError(true)}
            />
          )}

          {/* Office fallback or unsupported */}
          {!loading && url && (isOffice && iframeError || (!isPdf && !isImage && !isOffice)) && (
            <div className="flex flex-col items-center justify-center h-full gap-5 p-6">
              <FileTypeIcon ext={ext} />
              <div className="text-center">
                <p className="text-slate-700 font-medium text-sm">{fileName}</p>
                <p className="text-slate-400 text-xs mt-1">
                  Hindi ma-preview ang file na ito sa browser.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buksan sa bagong tab
                </a>
                <a
                  href={url}
                  download={fileName}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  I-download
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
