import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Pagination from '../../components/common/Pagination.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';
import { LOCALE_BY_LANGUAGE, activeStatusMeta, formatDate, requestError } from './companyAdminUtils.js';

const RWANDA_PHONE_RE = /^07(2|3|8|9)\d{7}$/;

function Badge({ meta }) {
  return <span className={`badge text-xs ${meta.className}`}>{meta.label}</span>;
}

function DriverModal({ open, driver, onClose, onSaved, t }) {
  const [form, setForm] = useState({ name: '', phone: '', licenseNo: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(driver);

  useEffect(() => {
    if (!open) return;
    setForm({ name: driver?.name || '', phone: driver?.phone || '', licenseNo: driver?.licenseNo || '' });
    setSaving(false);
    setError('');
  }, [open, driver]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.licenseNo.trim()) {
      setError(t('companyAdminFormRequired'));
      return;
    }
    if (form.phone.trim() && !RWANDA_PHONE_RE.test(form.phone.trim())) {
      setError(t('manageDriversInvalidPhone'));
      return;
    }
    setSaving(true);
    setError('');
    const payload = { name: form.name.trim(), phone: form.phone.trim(), licenseNo: form.licenseNo.trim() };
    try {
      const { data: res } = isEdit
        ? await api.patch(`/company-admin/drivers/${driver.id}`, payload)
        : await api.post('/company-admin/drivers', payload);
      onSaved(res.data);
    } catch (err) {
      setError(requestError(err, isEdit ? t('manageDriversUpdateError') : t('manageDriversCreateError')));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEdit ? t('manageDriversEditTitle') : t('manageDriversCreateTitle')}</h2>
          <button
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
            onClick={onClose}
            disabled={saving}
            aria-label={t('cancel')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
          <form id="driver-form" onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t('manageDriversName')}</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={saving} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">{t('profilePhoneLabel')}</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={saving} />
              </div>
              <div>
                <label className="label">{t('manageDriversLicenseNumber')}</label>
                <input className="input" value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} disabled={saving} />
              </div>
            </div>
          </form>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>{t('cancel')}</button>
          <button type="submit" form="driver-form" className="btn-primary" disabled={saving}>{saving ? t('manageDriversSaving') : t('save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyAdminDrivers() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    try {
      const { data: res } = await api.get(`/company-admin/drivers?${params.toString()}`);
      setDrivers(res.data?.drivers || []);
    } catch (err) {
      setError(requestError(err, t('manageDriversLoadError')));
    } finally {
      setLoading(false);
    }
  }, [search, status, t]);

  useEffect(() => { setPage(1); fetchDrivers(); }, [fetchDrivers]);

  const updateStatus = async (driver) => {
    try {
      await api.patch(`/company-admin/drivers/${driver.id}/status`, { isActive: !driver.isActive });
      setNotice(t('companyAdminSaved'));
      fetchDrivers();
    } catch (err) {
      setError(requestError(err, t('manageDriversStatusError')));
    }
  };

  const totalPages = useMemo(() => Math.ceil(drivers.length / PAGE_SIZE), [drivers.length]);
  const pagedDrivers = useMemo(() => drivers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [drivers, page]);

  const columns = useMemo(() => [
    { key: 'name', label: t('manageDriversName') },
    { key: 'phone', label: t('manageUsersColPhone'), render: (value) => value || '-' },
    { key: 'licenseNo', label: t('manageDriversLicenseNumber') },
    { key: 'isActive', label: t('manageUsersColStatus'), render: (value) => <Badge meta={activeStatusMeta(value, t)} /> },
    { key: 'createdAt', label: t('manageDriversColCreated'), render: (value) => formatDate(value, locale) },
    { key: 'actions', label: t('manageUsersColActions'), render: (_v, row) => (
      <div className="flex items-center gap-1">
        <button
          className="inline-flex items-center justify-center p-2 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
          onClick={() => { setEditing(row); setModalOpen(true); }}
          aria-label={t('companyAdminEditAction')}
          title={t('companyAdminEditAction')}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" /></svg>
        </button>
        <button
          className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${row.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
          onClick={() => updateStatus(row)}
          aria-label={row.isActive ? t('manageUsersDeactivate') : t('manageUsersActivate')}
          title={row.isActive ? t('manageUsersDeactivate') : t('manageUsersActivate')}
        >
          {row.isActive
            ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          }
        </button>
      </div>
    ) },
  ], [locale, t]);

  const handleSaved = () => {
    setModalOpen(false);
    setEditing(null);
    setNotice(t('companyAdminSaved'));
    fetchDrivers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companyAdminDriversTitle')}</h1>
          <p className="mt-1 text-gray-500 dark:text-slate-400">{t('companyAdminDriversSubtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>{t('manageDriversCreateButton')}</button>
      </div>
      {notice && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="input text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('manageDriversSearch')} />
          <select className="input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('manageDriversAllStatuses')}</option>
            <option value="active">{t('manageUsersActive')}</option>
            <option value="inactive">{t('manageUsersInactive')}</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <DashboardTable columns={columns} rows={pagedDrivers} loading={loading} empty={t('manageDriversEmpty')} maxRows={PAGE_SIZE} />
      </div>
      {!loading && drivers.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      )}
      <DriverModal open={modalOpen} driver={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={handleSaved} t={t} />
    </div>
  );
}
