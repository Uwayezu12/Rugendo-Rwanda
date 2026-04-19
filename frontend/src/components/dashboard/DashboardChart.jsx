import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext.jsx';

/**
 * props:
 *   title   — chart heading string
 *   data    — [{ name, value }]
 *   colors  — optional array of hex strings per bar
 *   height  — px (default 200)
 *   empty   — string to show when data is empty/all-zero
 */
export default function DashboardChart({ title, data = [], colors, height = 200, empty }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const gridColor   = dark ? '#2d1a5e' : '#e8e3ff';
  const axisColor   = dark ? '#7c6fa0' : '#9a8ec0';
  const tooltipBg   = dark ? '#1a1035' : '#ffffff';
  const tooltipBorder = dark ? '#2d1a5e' : '#e8e3ff';
  const tooltipText = dark ? '#e2d9f3' : '#1e1040';

  const defaultColors = ['#6e26ff', '#fa26ae', '#10b981', '#f59e0b', '#ef4444'];

  const allZero = data.every(d => !d.value);

  return (
    <div className="card p-5">
      {title && <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">{title}</h3>}
      {allZero && empty ? (
        <div className="flex items-center justify-center text-sm text-gray-400 dark:text-slate-500" style={{ height }}>
          {empty}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: tooltipText, fontSize: 13 }}
              cursor={{ fill: dark ? 'rgba(110,38,255,0.08)' : 'rgba(110,38,255,0.05)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={(colors || defaultColors)[i % (colors || defaultColors).length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
