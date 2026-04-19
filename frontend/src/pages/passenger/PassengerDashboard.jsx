import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { bookingService } from '../../services/bookingService.js';
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

function NextDepartureBanner({ booking, locale, t }) {
  if (!booking) {
    return (
      <div className="card bg-gradient-to-r from-brand-600/10 to-accent-500/10 border-brand-200 dark:border-brand-900/50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="text-3xl">🚌</div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-white">{t('passengerNextDepartureEmpty')}</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{t('passengerNextDepartureEmptyHint')}</p>
        </div>
        <Link to="/search" className="btn-primary shrink-0 text-sm sm:ml-auto">{t('passengerActionSearchNow')}</Link>
      </div>
    );
  }

  const s = booking.schedule;
  const route = s?.route ? `${s.route.origin} → ${s.route.destination}` : '—';
  const dep = formatDate(s?.departureTime, locale);
  const company = s?.bus?.company?.name || '—';

  return (
    <div className="card bg-gradient-to-r from-brand-600/15 to-accent-500/10 border-brand-300 dark:border-brand-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="text-4xl">🚌</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300 mb-1">{t('passengerNextDeparture')}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{route}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-slate-400">
          <span>📅 {dep}</span>
          <span>🏢 {company}</span>
          <span>🎫 {booking.reference}</span>
          <span>💺 {booking.seatsBooked} {t('passengerColSeats').toLowerCase()}</span>
        </div>
      </div>
      <Link to="/passenger/bookings" className="btn-secondary text-sm shrink-0">{t('passengerActionMyBookings')}</Link>
    </div>
  );
}

export default function PassengerDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    bookingService.getMyBookings()
      .then(res => { if (!cancelled) { setBookings(Array.isArray(res?.data) ? res.data : []); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const now = new Date();

  const totalBookings = bookings.length;
  const upcoming = bookings.filter(b =>
    b.status === 'CONFIRMED' && b.schedule?.departureTime && new Date(b.schedule.departureTime) > now
  );
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;
  const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;

  const nextDeparture = upcoming.sort((a, b) =>
    new Date(a.schedule?.departureTime) - new Date(b.schedule?.departureTime)
  )[0] || null;

  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const chartData = [
    { name: t('bookingStatusConfirmed'), value: bookings.filter(b => b.status === 'CONFIRMED').length },
    { name: t('bookingStatusPending'),   value: bookings.filter(b => b.status === 'PENDING').length },
    { name: t('bookingStatusCompleted'), value: completed },
    { name: t('bookingStatusCancelled'), value: cancelled },
  ];

  const tableColumns = [
    { key: 'reference', label: t('passengerColRef') },
    {
      key: 'route', label: t('passengerColRoute'),
      render: (_, row) => {
        const r = row.schedule?.route;
        return r ? `${r.origin} → ${r.destination}` : '—';
      },
    },
    {
      key: 'dep', label: t('passengerColDate'),
      render: (_, row) => formatDate(row.schedule?.departureTime, locale) || '—',
    },
    { key: 'seatsBooked', label: t('passengerColSeats') },
    {
      key: 'status', label: t('passengerColStatus'),
      render: (val) => <BookingStatusBadge status={val} t={t} />,
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-gray-500 dark:text-slate-400">{t('passengerDashboardError')}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>{t('passengerDashboardRetry')}</button>
      </div>
    );
  }

  const isEmpty = !loading && bookings.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('passengerWelcome', { name: user?.name?.split(' ')[0] || user?.name })}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('passengerDashboardSubtitle')}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKPICard icon="🎫" label={t('passengerKpiTotal')}     value={loading ? null : totalBookings}      accent="brand"   loading={loading} />
        <DashboardKPICard icon="🚀" label={t('passengerKpiUpcoming')}  value={loading ? null : upcoming.length}   accent="success" loading={loading} />
        <DashboardKPICard icon="✅" label={t('passengerKpiCompleted')} value={loading ? null : completed}         accent="brand"   loading={loading} />
        <DashboardKPICard icon="❌" label={t('passengerKpiCancelled')} value={loading ? null : cancelled}         accent="error"   loading={loading} />
      </div>

      {/* Next departure */}
      <div>
        <NextDepartureBanner
          booking={loading ? undefined : nextDeparture}
          locale={locale}
          t={t}
        />
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="text-6xl">🚌</div>
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{t('passengerEmptyState')}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">{t('passengerEmptyHint')}</p>
          </div>
          <Link to="/search" className="btn-gradient mt-2">{t('passengerActionSearchNow')}</Link>
        </div>
      ) : (
        <>
          {/* Chart + Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DashboardChart
                title={t('passengerBookingsByStatus')}
                data={chartData}
                colors={['#10b981', '#f59e0b', '#6e26ff', '#ef4444']}
                height={200}
                empty={t('passengerEmptyState')}
              />
            </div>
            <div className="card p-5 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('passengerQuickActions')}</h3>
              <Link to="/search" className="btn-primary w-full text-center">{t('passengerActionBookTrip')}</Link>
              <Link to="/passenger/bookings" className="btn-secondary w-full text-center">{t('passengerActionMyBookings')}</Link>
            </div>
          </div>

          {/* Recent bookings table */}
          <DashboardTable
            title={t('passengerRecentBookings')}
            columns={tableColumns}
            rows={recent}
            empty={t('passengerEmptyState')}
            loading={loading}
            maxRows={5}
          />
        </>
      )}
    </div>
  );
}
