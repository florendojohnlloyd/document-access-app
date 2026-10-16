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

interface MultipartManifest {
  filename: string;
  totalSize: number;
  partSize: number;
  totalParts: number;
  contentType?: string;
}

interface MultipartData {
  manifest: MultipartManifest;
  signedUrls: string[];
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileViewModal({ fileId, fileName, onClose }: FileViewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [multipartData, setMultipartData] = useState<MultipartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [iframeError, setIframeError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ part: 0, total: 0, percent: 0 });

  const ext = getExtension(fileName);
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const res = await fetch(`/api/files/${fileId}/url`);
        const data = await res.json() as {
          isMultipart?: boolean;
          manifest?: MultipartManifest;
          signedUrls?: string[];
          url?: string;
          error?: string;
        };

        if (!res.ok || data.error) {
          setError(data.error ?? 'Could not load file.');
        } else if (data.isMultipart && data.manifest && data.signedUrls) {
          setMultipartData({
            manifest: data.manifest,
            signedUrls: data.signedUrls,
          });
        } else if (data.url) {
          setUrl(data.url);
        } else {
          setError('File location not found.');
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

  const handleDownload = async () => {
    if (multipartData) {
      setDownloading(true);
      try {
        const partsCount = multipartData.signedUrls.length;
        const blobs: Blob[] = [];

        for (let i = 0; i < partsCount; i++) {
          setDownloadProgress({
            part: i + 1,
            total: partsCount,
            percent: Math.round(((i) / partsCount) * 100),
          });

          const partRes = await fetch(multipartData.signedUrls[i]);
          if (!partRes.ok) throw new Error(`Failed to download part ${i + 1}`);
          const partBlob = await partRes.blob();
          blobs.push(partBlob);
        }

        setDownloadProgress({ part: partsCount, total: partsCount, percent: 100 });
        const mergedBlob = new Blob(blobs, {
          type: multipartData.manifest.contentType || 'application/octet-stream',
        });
        const blobUrl = URL.createObjectURL(mergedBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Download error:', err);
        setError('Failed to download multipart file. Please try again.');
      } finally {
        setDownloading(false);
      }
    } else if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-modal="true"
      role="dialog"
      aria-labelledby="fileview-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[94vh] sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 id="fileview-title" className="text-sm font-semibold text-slate-800 truncate max-w-[150px] xs:max-w-[220px] sm:max-w-md" title={fileName}>
              {fileName}
            </h2>
            {multipartData?.manifest?.totalSize && (
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-mono font-medium hidden sm:inline">
                {formatFileSize(multipartData.manifest.totalSize)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {!loading && (url || multipartData) && (
              <>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline sm:inline">Open</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">
                    {downloading ? 'Downloading...' : 'Download'}
                  </span>
                </button>
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

        {/* Mobile top helper for PDFs & Office files */}
        {url && (isPdf || isOffice) && (
          <div className="sm:hidden px-3 py-2 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-700">
            <span className="truncate mr-2">Mobile preview may be limited</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline flex items-center gap-1 flex-shrink-0 text-indigo-800"
            >
              Open in new tab <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-50 flex flex-col">
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
            <div className="flex items-center justify-center h-full p-4 text-center">
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Multipart file view (e.g. large ZIP / backup / video) */}
          {!loading && multipartData && (
            <div className="flex flex-col items-center justify-center h-full gap-5 p-6 text-center">
              <FileTypeIcon ext={ext} />
              <div className="space-y-1">
                <p className="text-slate-800 font-semibold text-base">{fileName}</p>
                <p className="text-slate-500 text-xs font-mono">
                  {formatFileSize(multipartData.manifest.totalSize)} · Large Archive ({multipartData.manifest.totalParts} parts)
                </p>
                <p className="text-slate-400 text-xs">
                  This file was securely uploaded in multi-part chunks.
                </p>
              </div>

              {downloading ? (
                <div className="w-full max-w-xs space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Downloading part {downloadProgress.part} of {downloadProgress.total}...</span>
                    <span className="font-semibold text-indigo-600">{downloadProgress.percent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-200"
                      style={{ width: `${Math.max(5, downloadProgress.percent)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download File ({formatFileSize(multipartData.manifest.totalSize)})
                </button>
              )}
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
            <div className="flex items-center justify-center h-full p-4 sm:p-6 overflow-auto">
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
                  This file cannot be previewed in the browser.
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
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
