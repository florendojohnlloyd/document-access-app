'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
  pageSizeOptions?: number[];
}

export function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'item',
  pageSizeOptions = [10, 15, 25, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-slate-700 font-semibold">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
          <strong className="text-slate-700 font-semibold">{endIndex}</strong> of{' '}
          <strong className="text-slate-700 font-semibold">{totalItems}</strong> {itemLabel}{totalItems !== 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
          <label htmlFor={`pageSize-${itemLabel}`} className="text-slate-400 font-medium">Rows:</label>
          <select
            id={`pageSize-${itemLabel}`}
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="First page"
            aria-label="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage === 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-xs"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => {
              if (typeof p === 'string') {
                return <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold">…</span>;
              }
              const isActive = p === safeCurrentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
            disabled={safeCurrentPage === totalPages}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-xs"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Last page"
            aria-label="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
