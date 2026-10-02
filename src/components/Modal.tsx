'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  message?: string;
  inputLabel?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: (value?: string) => void;
  onClose: () => void;
}

export function Modal({
  title,
  message,
  inputLabel,
  defaultValue = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}: ModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus input or dialog on mount
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    } else {
      dialogRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConfirm = () => {
    if (inputLabel) {
      onConfirm(inputRef.current?.value ?? '');
    } else {
      onConfirm();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2
            id="modal-title"
            className="text-base font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {message && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
          )}

          {inputLabel && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {inputLabel}
              </label>
              <input
                ref={inputRef}
                type="text"
                defaultValue={defaultValue}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border text-sm',
                  'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100',
                  'border-gray-300 dark:border-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600'
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              danger
                ? 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-600'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-600'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

