import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Pagination from '../../components/common/Pagination.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';
import { BUS_STATUSES, LOCALE_BY_LANGUAGE, busStatusMeta, formatDate, requestError } from './companyAdminUtils.js';

function Badge({ meta }) {
  return <span className={`badge text-xs ${meta.className}`}>{meta.label}</span>;
}

function BusModal({ open, bus, onClose, onSaved, t }) {
  const [form, setForm] = useState({ plateNumber: '', model: '', capacity: '', status: 'ACTIVE' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(bus);

  useEffect(() => {
    if (!open) return;
    setForm({
      plateNumber: bus?.plateNumber || '',
      model: bus?.model || '',
      capacity: bus?.capacity ? String(bus.capacity) : '',
      status: bus?.status || 'ACTIVE',
    });
    setSaving(false);
    setError('');
  }, [open, bus]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.plateNumber.trim() || !form.capacity) {
      setError(t('companyAdminFormRequired'));
      return;
    }
    setSaving(true);
    setError('');
    const payload = { ...form, plateNumber: form.plateNumber.trim(), model: form.model.trim(), capacity: Number(form.capacity) };
    try {
      const { data: res } = isEdit
        ? await api.patch(`/company-admin/buses/${bus.id}`, payload)
        : await api.post('/company-admin/buses', payload);
      onSaved(res.data);
    } catch (err) {
      setError(requestError(err, isEdit ? t('manageBusesUpdateError') : t('manageBusesCreateError')));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEdit ? t('manageBusesEditTitle') : t('manageBusesCreateTitle')}</h2>
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
          <form id="bus-form" onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">{t('manageBusesPlateNumber')}</label>
                <input className="input" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} disabled={saving} />
              </div>
              <div>
                <label className="label">{t('manageBusesModel')}</label>
                <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} disabled={saving} />
              </div>
              <div>
                <label className="label">{t('manageBusesCapacity')}</label>
                <input className="input" type="number" min="1" max="100" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} disabled={saving} />
              </div>
              <div>
                <label className="label">{t('manageUsersColStatus')}</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={saving}>
                  {BUS_STATUSES.map((item) => <option key={item} value={item}>{busStatusMeta(item, t).label}</option>)}
                </select>
              </div>
            </div>
          </form>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>{t('cancel')}</button>
          <button type="submit" form="bus-form" className="btn-primary" disabled={saving}>{saving ? t('manageBusesSaving') : t('save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyAdminBuses() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    try {
      const { data: res } = await api.get(`/company-admin/buses?${params.toString()}`);
      setBuses(res.data?.buses || []);
    } catch (err) {
      setError(requestError(err, t('manageBusesLoadError')));
    } finally {
      setLoading(false);
    }
  }, [search, status, t]);

  useEffect(() => { setPage(1); fetchBuses(); }, [fetchBuses]);

  const updateStatus = async (bus, nextStatus) => {
    try {
      await api.patch(`/company-admin/buses/${bus.id}/status`, { status: nextStatus });
      setNotice(t('companyAdminSaved'));
      fetchBuses();
    } catch (err) {
      setError(requestError(err, t('manageBusesStatusError')));
    }
  };

  const totalPages = useMemo(() => Math.ceil(buses.length / PAGE_SIZE), [buses.length]);
  const pagedBuses = useMemo(() => buses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [buses, page]);

  const columns = useMemo(() => [
    { key: 'plateNumber', label: t('manageBusesPlateNumber') },
    { key: 'model', label: t('manageBusesModel'), render: (value) => value || '-' },
    { key: 'capacity', label: t('manageBusesCapacity') },
    { key: 'status', label: t('manageUsersColStatus'), render: (value) => <Badge meta={busStatusMeta(value, t)} /> },
    { key: 'createdAt', label: t('manageBusesColCreated'), render: (value) => formatDate(value, locale) },
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
          className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${row.status === 'ACTIVE' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
          onClick={() => updateStatus(row, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
          aria-label={row.status === 'ACTIVE' ? t('manageUsersDeactivate') : t('manageUsersActivate')}
          title={row.status === 'ACTIVE' ? t('manageUsersDeactivate') : t('manageUsersActivate')}
        >
          {row.status === 'ACTIVE'
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
    fetchBuses();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companyAdminBusesTitle')}</h1>
          <p className="mt-1 text-gray-500 dark:text-slate-400">{t('companyAdminBusesSubtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>{t('manageBusesCreateButton')}</button>
      </div>
      {notice && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="input text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('manageBusesSearch')} />
          <select className="input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('manageBusesAllStatuses')}</option>
            {BUS_STATUSES.map((item) => <option key={item} value={item}>{busStatusMeta(item, t).label}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <DashboardTable columns={columns} rows={pagedBuses} loading={loading} empty={t('manageBusesEmpty')} maxRows={PAGE_SIZE} />
      </div>
      {!loading && buses.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      )}
      <BusModal open={modalOpen} bus={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={handleSaved} t={t} />
    </div>
  );
}
