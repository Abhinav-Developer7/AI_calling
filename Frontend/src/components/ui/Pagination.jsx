import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 5,
  onPageChange,
  loading = false,
  className = '',
}) {
  if (totalItems <= 0 && totalPages <= 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers with ellipsis if many pages
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePrev = () => {
    if (page > 1 && !loading) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages && !loading) {
      onPageChange(page + 1);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] shadow-soft text-xs text-ink-soft select-none ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Item count text */}
      <div className="text-[11px] font-medium text-ink-soft">
        Showing{' '}
        <span className="font-semibold text-ink tabular-nums">{startItem}</span>
        {' '}to{' '}
        <span className="font-semibold text-ink tabular-nums">{endItem}</span>
        {' '}of{' '}
        <span className="font-semibold text-ink tabular-nums">{totalItems}</span>
        {' '}results (5 per page)
      </div>

      {/* Page navigation controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={page <= 1 || loading}
          aria-label="Previous page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-pill bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2]" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-ink-soft">
                  …
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => !isCurrent && !loading && onPageChange(p)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                  isCurrent
                    ? 'bg-accent text-accent-ink shadow-soft'
                    : 'text-ink-soft hover:text-ink hover:bg-surface-muted'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={page >= totalPages || loading}
          aria-label="Next page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-pill bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
}

