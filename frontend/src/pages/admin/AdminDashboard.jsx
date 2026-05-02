import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import api from '../../services/api.js';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard.jsx';
import DashboardChart from '../../components/dashboard/DashboardChart.jsx';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';

const LOCALE_BY_LANGUAGE = {
  en: 'en-RW', rw: 'rw-RW', fr: 'fr-FR', sw: 'sw',
};

function formatDate(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatAmount(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('en-RW') + ' RWF';
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function BookingStatusBadge({ status, t }) {
  const map = {
    PENDING:   { label: t('bookingStatusPending'),   cls: 'badge-warning' },
    CONFIRMED: { label: t('bookingStatusConfirmed'), cls: 'badge-success' },
    CANCELLED: { label: t('bookingStatusCancelled'), cls: 'badge-error' },
    COMPLETED: { label: t('boardedStatus'),          cls: 'badge-success' },
  };
  const m = map[status] || { label: status, cls: 'badge-brand' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

function TimeseriesLineChart({ title, data, dataKey, color, formatY, empty }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const gridColor     = dark ? '#1e3a5f' : '#dbeafe';
  const axisColor     = dark ? '#94a3b8' : '#64748b';
  const tooltipBg     = dark ? '#112040' : '#ffffff';
  const tooltipBorder = dark ? '#1e3a5f' : '#dbeafe';
  const tooltipText   = dark ? '#e2e8f0' : '#1e293b';

  const allZero = data.length > 0 && data.every(d => !d[dataKey]);
  const showEmpty = allZero || data.length === 0;

  return (
    <div className="card p-5">
      {title && <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-slate-200">{title}</h3>}
      {showEmpty ? (
        <div className="flex items-center justify-center text-sm text-gray-400 dark:text-slate-500" style={{ height: 180 }}>
          {empty}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tickFormatter={formatY}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 8,
                color: tooltipText,
                fontSize: 13,
              }}
              formatter={(val) => [formatY ? formatY(val) : val]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [stats, setStats] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTs, setLoadingTs] = useState(true);
  const [error, setError] = useState(null);
  const [tsError, setTsError] = useState(false);

  const fetchData = useCallback(() => {
    let cancelled = false;
    setLoadingStats(true);
    setLoadingTs(true);
    setError(null);
    setTsError(false);

    api.get('/dashboard/stats')
      .then(({ data: res }) => {
        if (!cancelled) { setStats(res.data); setLoadingStats(false); }
      })
      .catch(() => { if (!cancelled) { setError(true); setLoadingStats(false); } });

    api.get('/dashboard/timeseries')
      .then(({ data: res }) => {
        if (!cancelled) { setTimeseries(res.data); setLoadingTs(false); }
      })
      .catch(() => {
        if (!cancelled) { setTsError(true); setLoadingTs(false); }
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => fetchData(), [fetchData]);

  const loading = loadingStats || loadingTs;

  const bookingsChartData = (timeseries?.bookingsOverTime || []).map(d => ({
    label: formatDayLabel(d.date),
    value: d.count,
  }));
  const revenueChartData = (timeseries?.revenueOverTime || []).map(d => ({
    label: formatDayLabel(d.date),
    value: d.amount,
  }));
  const statusChartData = (timeseries?.statusDistribution || []).map(d => ({
    name: t(`bookingStatus${d.name.charAt(0) + d.name.slice(1).toLowerCase()}`) || d.name,
    value: d.value,
  }));

  const recentBookingsColumns = [
    { key: 'reference', label: t('adminRecentColRef') },
    {
      key: 'passenger', label: t('adminRecentColPassenger'),
      render: (_, row) => row.user?.name || row.user?.email || '—',
    },
    {
      key: 'route', label: t('adminRecentColRoute'),
      render: (_, row) => {
        const r = row.schedule?.route;
        return r ? `${r.origin} → ${r.destination}` : '—';
      },
    },
    {
      key: 'createdAt', label: t('adminRecentColDate'),
      render: (val) => formatDate(val, locale),
    },
    {
      key: 'status', label: t('adminRecentColStatus'),
      render: (val) => <BookingStatusBadge status={val} t={t} />,
    },
    {
      key: 'totalAmount', label: t('adminRecentColAmount'),
      render: (val) => formatAmount(val),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-gray-500 dark:text-slate-400">{t('adminDashboardError')}</p>
        <button className="btn-primary" onClick={fetchData}>{t('adminDashboardRetry')}</button>
      </div>
    );
  }

  const isEmpty = !loading && stats && stats.totalBookings === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('adminDashboardTitle')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('adminDashboardSubtitle')}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardKPICard icon="🎫" label={t('adminKpiTotalBookings')}
          value={loadingStats ? null : stats?.totalBookings} accent="brand" loading={loadingStats} />
        <DashboardKPICard icon="✅" label={t('adminKpiConfirmed')}
          value={loadingStats ? null : stats?.confirmedBookings} accent="success" loading={loadingStats} />
        <DashboardKPICard icon="💰" label={t('adminKpiRevenue')}
          value={loadingStats ? null : stats ? `${Number(stats.revenue.total).toLocaleString('en-RW')} RWF` : null}
          accent="success" loading={loadingStats} />
        <DashboardKPICard icon="⏳" label={t('adminKpiPending')}
          value={loadingStats ? null : stats?.pendingBookings} accent="warning" loading={loadingStats} />
        <DashboardKPICard icon="🗺️" label={t('adminKpiRoutes')}
          value={loadingStats ? null : stats?.activeRoutes} accent="brand" loading={loadingStats} />
        <DashboardKPICard icon="🕐" label={t('adminKpiSchedules')}
          value={loadingStats ? null : stats?.activeSchedules} accent="brand" loading={loadingStats} />
        <DashboardKPICard icon="🚌" label={t('adminKpiFleet')}
          value={loadingStats ? null : stats?.fleetSize} accent="brand" loading={loadingStats} />
        <DashboardKPICard icon="❌" label={t('adminKpiCancelled')}
          value={loadingStats ? null : stats?.cancelledBookings} accent="error" loading={loadingStats} />
      </div>

      {isEmpty ? (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="text-6xl">📊</div>
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{t('adminEmptyState')}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">{t('adminEmptyHint')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Timeseries charts */}
          <div className="space-y-3">
            {tsError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                {t('adminDashboardError') || 'Could not load chart data.'}{' '}
                <button className="underline" onClick={fetchData}>{t('adminDashboardRetry') || 'Retry'}</button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeseriesLineChart
                title={t('adminBookingsOverTime')}
                data={bookingsChartData}
                dataKey="value"
                color="#2563eb"
                empty={loadingTs ? '…' : tsError ? t('adminChartError') : t('adminChartNoRecentData')}
              />
              <TimeseriesLineChart
                title={t('adminRevenueOverTime')}
                data={revenueChartData}
                dataKey="value"
                color="#10b981"
                formatY={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                empty={loadingTs ? '…' : tsError ? t('adminChartError') : t('adminChartNoRecentData')}
              />
            </div>
          </div>

          {/* Status distribution + Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DashboardChart
                title={t('adminStatusDistribution')}
                data={statusChartData}
                colors={['#10b981', '#f59e0b', '#ef4444', '#2563eb']}
                height={200}
                empty={t('adminEmptyState')}
              />
            </div>
            <div className="card p-5 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('adminQuickActions')}</h3>
              <Link to="/admin/routes"    className="btn-primary w-full text-center text-sm">{t('adminActionManageRoutes')}</Link>
              <Link to="/admin/schedules" className="btn-secondary w-full text-center text-sm">{t('adminActionManageSchedules')}</Link>
              <Link to="/admin/bookings"  className="btn-secondary w-full text-center text-sm">{t('adminActionManageBookings')}</Link>
              <Link to="/admin/buses"     className="btn-secondary w-full text-center text-sm">{t('adminActionManageBuses')}</Link>
            </div>
          </div>

          {/* Recent bookings — full width */}
          <DashboardTable
            title={t('adminRecentBookings')}
            columns={recentBookingsColumns}
            rows={stats?.recentBookings || []}
            empty={t('adminEmptyState')}
            loading={loadingStats}
            maxRows={5}
          />
        </>
      )}
    </div>
  );
}
