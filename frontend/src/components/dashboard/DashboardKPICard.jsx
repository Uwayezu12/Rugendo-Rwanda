import React from 'react';

/**
 * props:
 *   icon      — emoji or small SVG string
 *   label     — translated label string
 *   value     — numeric or string value
 *   sub       — optional small sub-label
 *   accent    — 'brand' | 'success' | 'warning' | 'error' (default 'brand')
 *   loading   — bool
 */
export default function DashboardKPICard({ icon, label, value, sub, accent = 'brand', loading = false }) {
  const accentMap = {
    brand:   'from-brand-600/10 to-brand-400/5 border-brand-200 dark:border-brand-900/60',
    success: 'from-emerald-500/10 to-emerald-300/5 border-emerald-200 dark:border-emerald-900/50',
    warning: 'from-amber-500/10 to-amber-300/5 border-amber-200 dark:border-amber-900/50',
    error:   'from-red-500/10 to-red-300/5 border-red-200 dark:border-red-900/50',
  };
  const iconMap = {
    brand:   'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300',
    success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
    error:   'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300',
  };

  return (
    <div className={`card bg-gradient-to-br ${accentMap[accent]} p-5 flex items-center gap-4`}>
      <div className={`rounded-xl w-12 h-12 flex items-center justify-center text-xl shrink-0 ${iconMap[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value ?? '—'}</p>
        )}
        {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}
