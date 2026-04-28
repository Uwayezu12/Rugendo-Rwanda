import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

/**
 * props:
 *   page      — current 1-based page number
 *   totalPages — total number of pages
 *   onPage    — callback(newPage)
 */
export default function Pagination({ page, totalPages, onPage }) {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <button
        className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
      >
        ← {t('paginationPrev')}
      </button>
      <span className="text-sm text-gray-500 dark:text-slate-400">
        {t('paginationPageOf', { page, total: totalPages })}
      </span>
      <button
        className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
      >
        {t('paginationNext')} →
      </button>
    </div>
  );
}
