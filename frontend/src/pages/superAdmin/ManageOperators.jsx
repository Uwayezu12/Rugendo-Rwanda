import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';

const LOCALE_BY_LANGUAGE = {
  en: 'en-RW',
  rw: 'rw-RW',
  fr: 'fr-FR',
  sw: 'sw',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RWANDA_PHONE_RE = /^07(2|3|8|9)\d{7}$/;

function formatDate(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getRequestError(err, fallback) {
  const fieldErrors = err?.response?.data?.errors;
  const firstFieldError = fieldErrors
    ? Object.values(fieldErrors).flat().find(Boolean)
    : null;

  return firstFieldError || err?.response?.data?.message || fallback;
}

function getCreateOperatorError(err, fallback, t) {
  const raw = getRequestError(err, fallback);

  const knownErrors = {
    'Email is already registered': t('manageOperatorsEmailTaken'),
    'Phone number is already registered': t('manageOperatorsPhoneTaken'),
    'Company not found': t('manageOperatorsCompanyNotFound'),
  };

  return knownErrors[raw] || fallback;
}

function NoticeBanner({ notice }) {
  if (!notice?.message) return null;

  const cls = notice.type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-300'
    : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/40 dark:text-green-300';

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {notice.message}
    </div>
  );
}

function StatusBadge({ isActive, t }) {
  return (
    <span className={`badge text-xs ${isActive ? 'badge-success' : 'badge-error'}`}>
      {isActive ? t('manageUsersActive') : t('manageUsersInactive')}
    </span>
  );
}

function CreateOperatorModal({ open, companies, onClose, onCreated, t }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      companyId: '',
    });
    setSaving(false);
    setError('');
  }, [open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim();
    const cleanPhone = form.phone.trim();

    if (!cleanName) {
      setError(t('manageOperatorsNameRequired'));
      return;
    }
    if (!cleanEmail && !cleanPhone) {
      setError(t('manageOperatorsIdentifierRequired'));
      return;
    }
    if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
      setError(t('manageOperatorsInvalidEmail'));
      return;
    }
    if (cleanPhone && !RWANDA_PHONE_RE.test(cleanPhone)) {
      setError(t('manageOperatorsInvalidPhone'));
      return;
    }
    if (form.password.length < 8) {
      setError(t('manageOperatorsPasswordMin'));
      return;
    }
    if (!form.companyId) {
      setError(t('manageOperatorsSelectCompanyError'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { data: res } = await api.post('/operators', {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: form.password,
        companyId: Number(form.companyId),
      });
      onCreated(res.data);
    } catch (err) {
      setError(getCreateOperatorError(err, t('manageOperatorsCreateError'), t));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('manageOperatorsCreateTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {t('manageOperatorsCreateSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-sm"
            disabled={saving}
          >
            {t('cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">{t('profileFullName')}</label>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">
                {t('profileEmailLabel')}
                <span className="ml-1 text-xs font-normal text-gray-400 dark:text-slate-500">
                  {t('profileEmailOptional')}
                </span>
              </label>
              <input
                className="input"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">
                {t('profilePhoneLabel')}
                <span className="ml-1 text-xs font-normal text-gray-400 dark:text-slate-500">
                  {t('profilePhoneOptional')}
                </span>
              </label>
              <input
                className="input"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('password')}</label>
              <input
                className="input"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('manageUsersColCompany')}</label>
              <select
                className="input"
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">{t('manageUsersSelectCompany')}</option>
                {companies.map((company) => (
                  <option key={company.id} value={String(company.id)}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('manageOperatorsIdentifierHint')}
          </p>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              {t('cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? t('manageOperatorsCreating') : t('manageOperatorsCreateSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OperatorActionsCell({ operator, companies, onMutated, t }) {
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(operator.companyId ? String(operator.companyId) : '');
  const [companySaving, setCompanySaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedCompany(operator.companyId ? String(operator.companyId) : '');
  }, [operator.companyId]);

  const handleStatusToggle = async () => {
    setStatusSaving(true);
    setError('');

    try {
      await api.patch(`/operators/${operator.id}/status`, { isActive: !operator.isActive });
      onMutated(operator.isActive ? t('manageOperatorsDeactivated') : t('manageOperatorsActivated'));
    } catch {
      setError(t('manageOperatorsStatusError'));
      setStatusSaving(false);
      return;
    }

    setStatusSaving(false);
  };

  const handleCompanySave = async () => {
    if (!selectedCompany) {
      setError(t('manageOperatorsSelectCompanyError'));
      return;
    }

    setCompanySaving(true);
    setError('');

    try {
      await api.patch(`/operators/${operator.id}/company`, {
        companyId: Number(selectedCompany),
      });
      setShowCompanyForm(false);
      onMutated(t('manageOperatorsCompanyUpdated'));
    } catch {
      setError(t('manageOperatorsCompanyError'));
      setCompanySaving(false);
      return;
    }

    setCompanySaving(false);
  };

  return (
    <div className="w-full min-w-0 space-y-2 whitespace-normal sm:min-w-[12rem]">
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-secondary w-full text-xs sm:w-auto"
          onClick={() => {
            setShowCompanyForm((prev) => !prev);
            setError('');
          }}
          disabled={companySaving || statusSaving}
        >
          {t('manageOperatorsChangeCompany')}
        </button>
        <button
          className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:w-auto ${
            operator.isActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
              : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
          }`}
          onClick={handleStatusToggle}
          disabled={companySaving || statusSaving}
        >
          {statusSaving
            ? t('manageUsersUpdatingStatus')
            : operator.isActive ? t('manageUsersDeactivate') : t('manageUsersActivate')}
        </button>
      </div>

      {showCompanyForm && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/70 space-y-2">
          <select
            className="input !py-2 !text-xs w-full"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            disabled={companySaving}
          >
            <option value="">{t('manageUsersSelectCompany')}</option>
            {companies.map((company) => (
              <option key={company.id} value={String(company.id)}>
                {company.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary text-xs"
              onClick={handleCompanySave}
              disabled={companySaving}
            >
              {companySaving ? t('manageOperatorsSavingCompany') : t('save')}
            </button>
            <button
              className="btn-secondary text-xs"
              onClick={() => {
                setShowCompanyForm(false);
                setSelectedCompany(operator.companyId ? String(operator.companyId) : '');
                setError('');
              }}
              disabled={companySaving}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ManageOperators() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [operators, setOperators] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const debounceRef = useRef(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const { data: res } = await api.get('/operators/companies');
      setCompanies(res.data || []);
    } catch {
      setCompanies([]);
    }
  }, []);

  const fetchOperators = useCallback(async (searchValue, companyValue, statusValue, pageValue) => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(pageValue),
      limit: '20',
    });

    if (searchValue.trim()) params.set('search', searchValue.trim());
    if (companyValue) params.set('companyId', companyValue);
    if (statusValue) params.set('status', statusValue);

    try {
      const { data: res } = await api.get(`/operators?${params.toString()}`);
      setOperators(res.data?.operators || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setOperators([]);
      setError(getRequestError(err, t('manageOperatorsLoadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOperators(search, companyFilter, statusFilter, page);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [search, companyFilter, statusFilter, page, fetchOperators]);

  const refreshOperators = useCallback(() => {
    fetchOperators(search, companyFilter, statusFilter, page);
  }, [fetchOperators, search, companyFilter, statusFilter, page]);

  const handleCreated = () => {
    setCreateOpen(false);
    setNotice({ type: 'success', message: t('manageOperatorsCreateSuccess') });
    setPage(1);
    fetchOperators(search, companyFilter, statusFilter, 1);
  };

  const handleMutated = useCallback((message) => {
    setNotice({ type: 'success', message });
    refreshOperators();
  }, [refreshOperators]);

  const columns = useMemo(() => [
    {
      key: 'name',
      label: t('manageUsersColName'),
      render: (value, row) => (
        <div className="min-w-0 whitespace-normal sm:min-w-[10rem]">
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mt-1">
            {t('manageUsersRoleOperator')}
          </p>
        </div>
      ),
    },
    {
      key: 'email',
      label: t('manageUsersColEmail'),
      render: (value) => (
        <span className="whitespace-normal break-all">
          {value || t('profileNotSet')}
        </span>
      ),
    },
    {
      key: 'phone',
      label: t('manageUsersColPhone'),
      render: (value) => value || t('profileNotSet'),
    },
    {
      key: 'company',
      label: t('manageUsersColCompany'),
      render: (_value, row) => (
        <span className="whitespace-normal">
          {row.company?.name || t('profileNotSet')}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: t('manageUsersColStatus'),
      render: (value) => <StatusBadge isActive={value} t={t} />,
    },
    {
      key: 'createdAt',
      label: t('manageOperatorsColCreated'),
      render: (value) => formatDate(value, locale),
    },
    {
      key: 'actions',
      label: t('manageUsersColActions'),
      render: (_value, row) => (
        <OperatorActionsCell
          operator={row}
          companies={companies}
          onMutated={handleMutated}
          t={t}
        />
      ),
    },
  ], [companies, handleMutated, locale, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manageOperatorsTitle')}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('manageOperatorsSubtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setCreateOpen(true)}
        >
          {t('manageOperatorsCreateButton')}
        </button>
      </div>

      <NoticeBanner notice={notice} />

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <input
            className="input text-sm"
            placeholder={t('manageOperatorsSearch')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="input text-sm"
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('manageOperatorsAllCompanies')}</option>
            {companies.map((company) => (
              <option key={company.id} value={String(company.id)}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            className="input text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('manageOperatorsAllStatuses')}</option>
            <option value="active">{t('manageUsersActive')}</option>
            <option value="inactive">{t('manageUsersInactive')}</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <div className="flex justify-center">
            <button className="btn-primary text-sm" onClick={refreshOperators}>
              {t('retry')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <DashboardTable
            columns={columns}
            rows={operators}
            loading={loading}
            empty={loading ? t('manageOperatorsLoading') : t('manageOperatorsEmpty')}
            maxRows={operators.length || 1}
          />

          {!loading && operators.length === 0 && (
            <p className="text-sm text-center text-gray-500 dark:text-slate-400">
              {t('manageOperatorsEmptyHint')}
            </p>
          )}
        </>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <button
            className="btn-secondary text-sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            {t('manageUsersPrev')}
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {t('manageUsersPageOf').replace('{page}', page).replace('{total}', totalPages)}
          </span>
          <button
            className="btn-secondary text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t('manageUsersNext')}
          </button>
        </div>
      )}

      <CreateOperatorModal
        open={createOpen}
        companies={companies}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
        t={t}
      />
    </div>
  );
}
