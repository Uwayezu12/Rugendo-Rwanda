import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard.jsx';
import DashboardChart from '../../components/dashboard/DashboardChart.jsx';
import { formatMoney } from './companyAdminUtils.js';

export default function CompanyAdminDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const companyName = user?.company?.name;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/company-admin/dashboard')
      .then(({ data: res }) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setError(t('companyAdminLoadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  const stats = data?.stats || {};

  const completedBookings = Math.max(
    0,
    (stats.totalBookings || 0) - (stats.confirmedBookings || 0) - (stats.pendingBookings || 0) - (stats.cancelledBookings || 0),
  );

  const bookingStatusData = [
    { name: t('bookingStatusPending'),   value: stats.pendingBookings   || 0 },
    { name: t('bookingStatusConfirmed'), value: stats.confirmedBookings || 0 },
    { name: t('bookingStatusCancelled'), value: stats.cancelledBookings || 0 },
    { name: t('boardedStatus'),          value: completedBookings },
  ];

  const scheduleOverviewData = [
    { name: t('companyAdminUpcoming'),  value: stats.upcomingSchedules || 0 },
    { name: t('companyAdminCompleted'), value: stats.completedTrips    || 0 },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-gray-500 dark:text-slate-400">{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>{t('retry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companyAdminDashboardTitle')}</h1>
          {companyName && (
            <p className="mt-1 text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-400 uppercase">{companyName}</p>
          )}
          <p className="text-gray-500 dark:text-slate-400 mt-0.5">{t('companyAdminDashboardSubtitle')}</p>
        </div>
        <Link to="/company-admin/schedules" className="btn-green text-sm">{t('companyAdminCreateSchedule')}</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DashboardKPICard icon="🚌" label={t('companyAdminKpiTodayTrips')}    value={stats.todayTrips}        loading={loading} />
        <DashboardKPICard icon="📅" label={t('companyAdminKpiUpcoming')}      value={stats.upcomingSchedules} loading={loading} />
        <DashboardKPICard icon="🎟️" label={t('adminKpiTotalBookings')}        value={stats.totalBookings}     loading={loading} />
        <DashboardKPICard icon="✅" label={t('adminKpiConfirmed')}            value={stats.confirmedBookings} accent="success" loading={loading} />
        <DashboardKPICard icon="⏳" label={t('adminKpiPending')}              value={stats.pendingBookings}   accent="warning" loading={loading} />
        <DashboardKPICard icon="❌" label={t('adminKpiCancelled')}            value={stats.cancelledBookings} accent="error"   loading={loading} />
        <DashboardKPICard icon="🏁" label={t('companyAdminKpiCompletedTrips')} value={stats.completedTrips}   loading={loading} />
        <DashboardKPICard icon="🚍" label={t('adminKpiFleet')}                value={stats.activeBuses}       loading={loading} />
        <DashboardKPICard icon="👤" label={t('companyAdminKpiActiveDrivers')}  value={stats.activeDrivers}    loading={loading} />
        <DashboardKPICard icon="💰" label={t('adminKpiRevenue')}              value={formatMoney(stats.totalRevenue)} accent="success" loading={loading} />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DashboardChart
            title={t('companyAdminChartBookingsByStatus')}
            data={bookingStatusData}
            colors={['#f59e0b', '#10b981', '#ef4444', '#2563eb']}
            height={220}
            empty={t('companyAdminNoChartData')}
          />
          <DashboardChart
            title={t('companyAdminChartScheduleOverview')}
            data={scheduleOverviewData}
            colors={['#2563eb', '#10b981']}
            height={220}
            empty={t('companyAdminNoChartData')}
          />
        </div>
      )}
    </div>
  );
}
