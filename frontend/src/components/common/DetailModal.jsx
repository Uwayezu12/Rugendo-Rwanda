import React from 'react';
import IconButton, { XIcon } from './IconButton.jsx';

export function DetailSection({ title, children, className = '' }) {
  return (
    <section className={className}>
      {title && (
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          {title}
        </h3>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function DetailItem({ label, value, children, highlight = false, className = '' }) {
  return (
    <div
      className={`min-w-0 rounded-xl border px-3 py-3 sm:px-4 ${
        highlight
          ? 'border-brand-200 bg-brand-50/80 dark:border-brand-800 dark:bg-brand-900/20'
          : 'border-gray-100 bg-gray-50/80 dark:border-slate-700 dark:bg-slate-800/60'
      } ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
        {children ?? value ?? '-'}
      </div>
    </div>
  );
}

export default function DetailModal({
  open = true,
  title,
  subtitle,
  badge,
  closeLabel,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-4xl',
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className={`card flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden p-0 shadow-2xl`}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-slate-700 sm:gap-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {title && (
                <h2 className="min-w-0 truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                  {title}
                </h2>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="mt-1 min-w-0 break-words text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <IconButton
            label={closeLabel}
            variant="neutral"
            size="md"
            onClick={onClose}
            icon={<XIcon />}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-5 sm:space-y-6">{children}</div>
        </div>

        {footer && (
          <div className="border-t border-gray-100 px-4 py-3 dark:border-slate-700 sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
