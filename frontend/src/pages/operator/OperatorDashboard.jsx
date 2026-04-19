import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard.jsx';
import DashboardChart from '../../components/dashboard/DashboardChart.jsx';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';

const LOCALE_BY_LANGUAGE = {
  en: 'en-RW', rw: 'rw-RW', fr: 'fr-FR', sw: 'sw',
};

function formatDate(value, locale) {
  if (!value) return null;
  return new Date(value).toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatTime(value, locale) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
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

function PaymentStatusBadge({ status, t }) {
  const map = {
    PENDING:  { label: t('paymentStatusPending'),  cls: 'badge-warning' },
    PAID:     { label: t('paymentStatusPaid'),     cls: 'badge-success' },
    FAILED:   { label: t('paymentStatusFailed'),   cls: 'badge-error' },
    REFUNDED: { label: t('paymentStatusRefunded'), cls: 'badge-brand' },
  };
  const m = map[status] || { label: status || '—', cls: 'badge-brand' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export default function OperatorDashboard() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [bookings, setBookings] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get('/bookings/operator-company')
      .then(({ data: res }) => {
        if (!cancelled) {
          setCompany(res.data?.company ?? null);
          setBookings(res.data?.bookings ?? []);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86400000);

  const totalBookings = bookings.length;
  const confirmed     = bookings.filter(b => b.status === 'CONFIRMED').length;
  const pending       = bookings.filter(b => b.status === 'PENDING').length;
  const boarded       = bookings.filter(b => b.status === 'COMPLETED').length;
  const cancelled     = bookings.filter(b => b.status === 'CANCELLED').length;

  // Unique schedules for today's departures
  const todayScheduleMap = new Map();
  bookings.forEach(b => {
    const s = b.schedule;
    if (!s?.departureTime) return;
    const dep = new Date(s.departureTime);
    if (dep >= todayStart && dep < todayEnd && !todayScheduleMap.has(s.id)) {
      todayScheduleMap.set(s.id, {
        id: s.id,
        route: s.route ? `${s.route.origin} → ${s.route.destination}` : '—',
        departureTime: s.departureTime,
        seatsAvailable: s.seatsAvailable ?? '—',
      });
    }
  });
  const todayDepartures = [...todayScheduleMap.values()].sort(
    (a, b) => new Date(a.departureTime) - new Date(b.departureTime)
  );

  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const chartData = [
    { name: t('bookingStatusConfirmed'), value: confirmed },
    { name: t('bookingStatusPending'),   value: pending },
    { name: t('boardedStatus'),          value: boarded },
    { name: t('bookingStatusCancelled'), value: bookings.filter(b => b.status === 'CANCELLED').length },
  ];

  const tableColumns = [
    { key: 'reference', label: t('operatorColRef') ?? 'Reference' },
    {
      key: 'passenger', label: t('operatorColPassenger'),
      render: (_, row) => row.user?.name || row.user?.email || '—',
    },
    {
      key: 'route', label: t('operatorColRoute'),
      render: (_, row) => {
        const r = row.schedule?.route;
        return r ? `${r.origin} → ${r.destination}` : '—';
      },
    },
    {
      key: 'departure', label: t('operatorColDeparture'),
      render: (_, row) => formatDate(row.schedule?.departureTime, locale) || '—',
    },
    {
      key: 'bookingStatus', label: t('operatorColStatus'),
      render: (val) => <BookingStatusBadge status={val} t={t} />,
    },
    {
      key: 'payment', label: t('operatorColPayment'),
      render: (_, row) => <PaymentStatusBadge status={row.payment?.status} t={t} />,
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-gray-500 dark:text-slate-400">{t('operatorDashboardError')}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>{t('operatorDashboardRetry')}</button>
      </div>
    );
  }

  const isEmpty = !loading && bookings.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('operatorDashboardTitle')}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('operatorDashboardSubtitle')}</p>
        </div>
        {company && (
          <div className="shrink-0 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm dark:border-brand-800 dark:bg-brand-900/20">
            <span className="text-xs uppercase tracking-wide text-brand-500 dark:text-brand-400 block">
              {t('operatorBoardingYourCompany')}
            </span>
            <span className="font-semibold text-brand-800 dark:text-brand-300">{company.name}</span>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DashboardKPICard icon="🎫" label={t('operatorKpiTotal')}     value={loading ? null : totalBookings} accent="brand"   loading={loading} />
        <DashboardKPICard icon="✅" label={t('operatorKpiConfirmed')} value={loading ? null : confirmed}     accent="success" loading={loading} />
        <DashboardKPICard icon="⏳" label={t('operatorKpiPending')}   value={loading ? null : pending}       accent="warning" loading={loading} />
        <DashboardKPICard icon="🚌" label={t('operatorKpiBoarded')}   value={loading ? null : boarded}       accent="brand"   loading={loading} />
        <DashboardKPICard icon="❌" label={t('operatorKpiCancelled')} value={loading ? null : cancelled}     accent="error"   loading={loading} />
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="text-6xl">📋</div>
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{t('operatorEmptyState')}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">{t('operatorEmptyHint')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Today's departures */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">{t('operatorTodayDepartures')}</h3>
            {todayDepartures.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">{t('operatorNoDeparturesToday')}</p>
            ) : (
              <div className="space-y-2">
                {todayDepartures.map(dep => (
                  <div key={dep.id} className="flex flex-col gap-2 rounded-xl bg-gray-50 px-4 py-3 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white text-sm">{dep.route}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {t('operatorDepartingAt')} {formatTime(dep.departureTime, locale)}
                      </p>
                    </div>
                    {dep.seatsAvailable !== '—' && (
                      <span className="self-start text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:self-auto">
                        {dep.seatsAvailable} {t('operatorSeatsAvail')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart + Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DashboardChart
                title={t('operatorBookingsByStatus')}
                data={chartData}
                colors={['#10b981', '#f59e0b', '#6e26ff', '#ef4444']}
                height={200}
                empty={t('operatorEmptyState')}
              />
            </div>
            <div className="card p-5 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('operatorQuickActions')}</h3>
              <Link to="/operator/boarding" className="btn-primary w-full text-center">{t('operatorActionValidate')}</Link>
              <Link to="/operator/bookings" className="btn-secondary w-full text-center">{t('operatorActionViewBookings')}</Link>
            </div>
          </div>

          {/* Recent activity table */}
          <DashboardTable
            title={t('operatorRecentActivity')}
            columns={tableColumns}
            rows={recent}
            empty={t('operatorEmptyState')}
            loading={loading}
            maxRows={5}
          />
        </>
      )}
    </div>
  );
}
