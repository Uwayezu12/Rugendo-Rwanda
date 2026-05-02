import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import api from '../../services/api.js';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard.jsx';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';

const LOCALE_BY_LANGUAGE = { en: 'en-RW', rw: 'rw-RW', fr: 'fr-FR', sw: 'sw' };

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
            <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={formatY} />
            <Tooltip
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: tooltipText, fontSize: 13 }}
              formatter={(val) => [formatY ? formatY(val) : val]}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { t } = useLanguage();

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

  const bookingsChartData = (timeseries?.bookingsOverTime || []).map(d => ({ label: formatDayLabel(d.date), value: d.count }));
  const revenueChartData  = (timeseries?.revenueOverTime  || []).map(d => ({ label: formatDayLabel(d.date), value: d.amount }));

  const companyColumns = [
    { key: 'name',      label: t('superAdminCompanyColName') },
    {
      key: 'isActive',  label: t('superAdminCompanyColStatus'),
      render: (val) => (
        <span className={`badge ${val ? 'badge-success' : 'badge-error'}`}>
          {val ? t('superAdminCompanyActive') : t('superAdminCompanyInactive')}
        </span>
      ),
    },
    { key: 'buses',     label: t('superAdminCompanyColBuses') },
    { key: 'drivers',   label: t('superAdminCompanyColDrivers') },
    { key: 'operators', label: t('superAdminCompanyColOperators') },
    { key: 'schedules', label: t('superAdminCompanyColSchedules') },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-gray-500 dark:text-slate-400">{t('superAdminDashboardError')}</p>
        <button className="btn-primary" onClick={fetchData}>{t('superAdminDashboardRetry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('superAdminDashboardTitle')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('superAdminDashboardSubtitle')}</p>
      </div>

      {/* KPI cards — row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardKPICard icon="👥" label={t('superAdminKpiUsers')}          value={loadingStats ? null : stats?.totalUsers}          accent="brand"   loading={loadingStats} />
        <DashboardKPICard icon="🏢" label={t('superAdminKpiCompanies')}      value={loadingStats ? null : stats?.totalCompanies}      accent="brand"   loading={loadingStats} />
        <DashboardKPICard icon="✅" label={t('superAdminKpiActiveCompanies')} value={loadingStats ? null : stats?.activeCompanies}     accent="success" loading={loadingStats} />
        <DashboardKPICard icon="🚌" label={t('superAdminKpiFleet')}          value={loadingStats ? null : stats?.fleetSize}           accent="brand"   loading={loadingStats} />
      </div>

      {/* KPI cards — row 2 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardKPICard icon="🎫" label={t('superAdminKpiBookings')} value={loadingStats ? null : stats?.totalBookings} accent="brand"   loading={loadingStats} />
        <DashboardKPICard icon="💰" label={t('superAdminKpiRevenue')}
          value={loadingStats ? null : stats ? `${Number(stats.revenue.total).toLocaleString('en-RW')} RWF` : null}
          accent="success" loading={loadingStats}
        />
        <DashboardKPICard icon="🗺️" label={t('superAdminKpiRoutes')}    value={loadingStats ? null : stats?.activeRoutes}    accent="brand"   loading={loadingStats} />
        <DashboardKPICard icon="🕐" label={t('superAdminKpiSchedules')} value={loadingStats ? null : stats?.activeSchedules} accent="brand"   loading={loadingStats} />
      </div>

      {/* Timeseries charts — always rendered; no longer gated on timeseries truthy */}
      <div className="space-y-3">
        {tsError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
            {t('superAdminDashboardError') || 'Could not load chart data.'}{' '}
            <button className="underline" onClick={fetchData}>{t('superAdminDashboardRetry') || 'Retry'}</button>
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

      {/* Company overview table */}
      {!loadingStats && stats?.companyOverview && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-slate-200">{t('superAdminCompanyOverview')}</h3>
          {stats.companyOverview.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">{t('superAdminEmptyState')}</p>
          ) : (
            <DashboardTable columns={companyColumns} rows={stats.companyOverview} />
          )}
        </div>
      )}

      {/* Platform quick actions */}
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-slate-200">{t('superAdminQuickActions')}</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/super-admin/settings" className="btn-primary text-sm">
            ⚙️ {t('superAdminActionSettings')}
          </Link>
          <Link to="/super-admin/users" className="btn-secondary text-sm">
            👥 {t('superAdminActionUsers')}
          </Link>
        </div>
      </div>
    </div>
  );
}
