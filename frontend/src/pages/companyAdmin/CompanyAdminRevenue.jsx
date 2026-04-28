import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardKPICard from '../../components/dashboard/DashboardKPICard.jsx';
import DashboardChart from '../../components/dashboard/DashboardChart.jsx';
import { formatMoney, requestError } from './companyAdminUtils.js';

export default function CompanyAdminRevenue() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/company-admin/revenue')
      .then(({ data: res }) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(requestError(err, t('companyAdminLoadError')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  const routeChartData = (data?.revenueByRoute || [])
    .slice(0, 6)
    .map((r) => ({ name: r.route, value: Number(r.amount) }));

  const paymentChartData = (data?.paymentStatusSummary || []).map((s) => ({
    name: s.status,
    value: s.count,
  }));
  const paymentChartColors = { PAID: '#10b981', PENDING: '#f59e0b', FAILED: '#ef4444', REFUNDED: '#6e26ff' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companyAdminRevenueTitle')}</h1>
        <p className="mt-1 text-gray-500 dark:text-slate-400">{t('companyAdminRevenueSubtitle')}</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardKPICard icon="💰" label={t('companyAdminTotalRevenue')} value={formatMoney(data?.totalRevenue)}  accent="success" loading={loading} />
        <DashboardKPICard icon="📅" label={t('companyAdminTodayRevenue')} value={formatMoney(data?.todayRevenue)} accent="success" loading={loading} />
        <DashboardKPICard icon="📆" label={t('companyAdminWeekRevenue')}  value={formatMoney(data?.weekRevenue)}  accent="warning" loading={loading} />
        <DashboardKPICard icon="🗓️" label={t('companyAdminMonthRevenue')} value={formatMoney(data?.monthRevenue)} accent="brand"   loading={loading} />
        <DashboardKPICard icon="✅" label={t('companyAdminPaidBookings')}   value={data?.paidBookings}   accent="success" loading={loading} />
        <DashboardKPICard icon="⏳" label={t('companyAdminUnpaidBookings')} value={data?.unpaidBookings} accent="warning" loading={loading} />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DashboardChart
            title={t('companyAdminChartRevenueByRoute')}
            data={routeChartData}
            colors={['#6e26ff', '#fa26ae', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9']}
            height={240}
            empty={t('companyAdminNoRevenue')}
          />
          <DashboardChart
            title={t('companyAdminChartPaymentStatus')}
            data={paymentChartData}
            colors={paymentChartData.map((d) => paymentChartColors[d.name] || '#6e26ff')}
            height={240}
            empty={t('companyAdminNoRevenue')}
          />
        </div>
      )}
    </div>
  );
}
