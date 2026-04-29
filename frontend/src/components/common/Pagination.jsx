import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

/**
 * props:
 *   page       - current 1-based page number
 *   totalPages - total number of pages
 *   onPage     - callback(newPage)
 */
export default function Pagination({ page, totalPages, onPage }) {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(page, 1), totalPages);
  const maxButtons = 5;
  const halfWindow = Math.floor(maxButtons / 2);
  let start = Math.max(1, safePage - halfWindow);
  let end = Math.min(totalPages, start + maxButtons - 1);

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const goToPage = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages && nextPage !== safePage) {
      onPage(nextPage);
    }
  };

  return (
    <nav
      className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
      aria-label={t('paginationLabel')}
    >
      <button
        className="inline-flex items-center justify-center text-sm font-semibold px-4 py-1.5 rounded-xl border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
        onClick={() => goToPage(safePage - 1)}
        disabled={safePage <= 1}
      >
        {t('paginationPrev')}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {start > 1 && (
          <>
            <button
              type="button"
              className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-amber-200 px-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
              onClick={() => goToPage(1)}
              aria-label={t('paginationGoToPage', { page: 1 })}
            >
              1
            </button>
            {start > 2 && (
              <span className="px-1 text-sm text-gray-400 dark:text-slate-500" aria-hidden="true">...</span>
            )}
          </>
        )}

        {pages.map((item) => {
          const current = item === safePage;
          return (
            <button
              key={item}
              type="button"
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors ${
                current
                  ? 'border-amber-500 bg-amber-400 text-white shadow-sm dark:border-amber-500 dark:bg-amber-500'
                  : 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30'
              }`}
              onClick={() => goToPage(item)}
              aria-current={current ? 'page' : undefined}
              aria-label={current ? t('paginationCurrentPage', { page: item }) : t('paginationGoToPage', { page: item })}
            >
              {item}
            </button>
          );
        })}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-sm text-gray-400 dark:text-slate-500" aria-hidden="true">...</span>
            )}
            <button
              type="button"
              className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-amber-200 px-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
              onClick={() => goToPage(totalPages)}
              aria-label={t('paginationGoToPage', { page: totalPages })}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className="inline-flex items-center justify-center text-sm font-semibold px-4 py-1.5 rounded-xl border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
        onClick={() => goToPage(safePage + 1)}
        disabled={safePage >= totalPages}
      >
        {t('paginationNext')}
      </button>
    </nav>
  );
}
