import React from 'react';

/**
 * props:
 *   title    — section heading
 *   columns  — [{ key, label, render? }]
 *   rows     — array of data objects
 *   empty    — string shown when rows is empty
 *   loading  — bool
 *   maxRows  — cap shown rows (default 5)
 */
export default function DashboardTable({ title, columns = [], rows = [], empty, loading = false, maxRows = 5 }) {
  const displayed = rows.slice(0, maxRows);

  return (
    <div className="card p-0 overflow-hidden">
      {title && (
        <div className="border-b border-gray-100 px-4 py-4 dark:border-slate-800/60 sm:px-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">{title}</h3>
        </div>
      )}
      {loading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-slate-500 sm:px-5">{empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800/60">
                {columns.map(col => (
                  <th key={col.key} className="break-words px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 sm:px-5">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/40">
              {displayed.map((row, i) => (
                <tr key={row.id ?? i} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="break-words px-4 py-3.5 align-top text-gray-700 dark:text-slate-300 sm:px-5">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
