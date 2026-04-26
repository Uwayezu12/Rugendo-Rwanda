import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';

const EyeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
    <path d="M1 10s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
    <line x1="4" y1="4" x2="16" y2="16" />
    <line x1="16" y1="4" x2="4" y2="16" />
  </svg>
);

function UserDetailModal({ user, onClose, t }) {
  const roleLabel_ = (role) => {
    const map = { PASSENGER: t('manageUsersRolePassenger'), ADMIN: t('manageUsersRoleAdmin'), SUPER_ADMIN: t('manageUsersRoleSuperAdmin'), OPERATOR: t('manageUsersRoleOperator') };
    return map[role] || role;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('manageUsersViewTitle')}</h2>
          <button
            onClick={onClose}
            aria-label={t('manageUsersCancelChange')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <XIcon />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Avatar placeholder + name */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user.name || '—'}</p>
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                <span className={`badge text-xs ${roleBadgeClass(user.role)}`}>{roleLabel_(user.role)}</span>
                <span className={`badge text-xs ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                  {user.isActive ? t('manageUsersActive') : t('manageUsersInactive')}
                </span>
              </div>
            </div>
          </div>

          {/* Detail rows */}
          <dl className="divide-y divide-gray-100 dark:divide-slate-700 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500 dark:text-slate-400">{t('manageUsersDetailEmail')}</dt>
              <dd className="text-gray-900 dark:text-white text-right break-all">{user.email || <span className="italic text-gray-400">—</span>}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500 dark:text-slate-400">{t('manageUsersDetailPhone')}</dt>
              <dd className="text-gray-900 dark:text-white">{user.phone || <span className="italic text-gray-400">—</span>}</dd>
            </div>
            {user.company && (
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-500 dark:text-slate-400">{t('manageUsersDetailCompany')}</dt>
                <dd className="text-indigo-600 dark:text-indigo-400 font-medium">{user.company.name}</dd>
              </div>
            )}
            {user.createdAt && (
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-500 dark:text-slate-400">{t('manageUsersDetailJoined')}</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString('en-RW', { year: 'numeric', month: 'short', day: 'numeric' })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 dark:border-slate-700">
          <button className="btn-secondary w-full text-sm" onClick={onClose}>{t('manageUsersCancelChange')}</button>
        </div>
      </div>
    </div>
  );
}

const ROLES = ['PASSENGER', 'ADMIN', 'SUPER_ADMIN', 'OPERATOR'];

function roleBadgeClass(role) {
  switch (role) {
    case 'SUPER_ADMIN': return 'badge-brand';
    case 'ADMIN':       return 'badge-warning';
    case 'OPERATOR':    return 'badge-success';
    default:            return 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300';
  }
}

function roleLabel(role, t) {
  const map = {
    PASSENGER:   t('manageUsersRolePassenger'),
    ADMIN:       t('manageUsersRoleAdmin'),
    SUPER_ADMIN: t('manageUsersRoleSuperAdmin'),
    OPERATOR:    t('manageUsersRoleOperator'),
  };
  return map[role] || role;
}

function RoleChangePanel({ user, companies, onDone, t }) {
  const [selectedRole, setSelectedRole]       = useState(user.role);
  const [selectedCompany, setSelectedCompany] = useState(user.companyId ? String(user.companyId) : '');
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState('');

  const handleAssign = async () => {
    if (selectedRole === 'OPERATOR' && !selectedCompany) {
      setError(t('manageUsersSelectCompany'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/users/${user.id}/role`, {
        role: selectedRole,
        companyId: selectedRole === 'OPERATOR' ? Number(selectedCompany) : undefined,
      });
      onDone(true);
    } catch {
      setError(t('manageUsersRoleError'));
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="input text-sm py-1"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          disabled={saving}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{roleLabel(r, t)}</option>
          ))}
        </select>

        {selectedRole === 'OPERATOR' && (
          <select
            className="input text-sm py-1"
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
            disabled={saving}
          >
            <option value="">{t('manageUsersSelectCompany')}</option>
            {companies.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        )}

        <button className="btn-primary text-xs" onClick={handleAssign} disabled={saving}>
          {saving ? t('manageUsersUpdatingRole') : t('manageUsersAssignRole')}
        </button>
        <button className="btn-secondary text-xs" onClick={() => onDone(false)} disabled={saving}>
          {t('manageUsersCancelChange')}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function UserRow({ user, companies, currentUserId, onUpdated, onView, t }) {
  const [showRolePanel, setShowRolePanel] = useState(false);
  const [statusSaving, setStatusSaving]   = useState(false);
  const [statusError, setStatusError]     = useState('');
  const isSelf = user.id === currentUserId;

  const handleStatusToggle = async () => {
    if (isSelf) return;
    setStatusSaving(true);
    setStatusError('');
    try {
      const { data: res } = await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      onUpdated(res.data);
    } catch {
      setStatusError(t('manageUsersStatusError'));
    } finally {
      setStatusSaving(false);
    }
  };

  const handleRoleDone = (changed) => {
    setShowRolePanel(false);
    if (changed) onUpdated(null);
  };

  return (
    <div className="py-4 border-b border-gray-100 dark:border-slate-700 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</span>
            <span className={`badge text-xs ${roleBadgeClass(user.role)}`}>{roleLabel(user.role, t)}</span>
            <span className={`badge text-xs ${user.isActive ? 'badge-success' : 'badge-error'}`}>
              {user.isActive ? t('manageUsersActive') : t('manageUsersInactive')}
            </span>
            {isSelf && (
              <span className="text-xs text-gray-400 dark:text-slate-500 italic">(you)</span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
          <button
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => onView(user)}
            aria-label={t('manageUsersViewTitle')}
            title={t('manageUsersViewTitle')}
          >
            <EyeIcon />
          </button>

          {!isSelf && (
            <>
              <button
                className="btn-secondary text-xs"
                onClick={() => setShowRolePanel(v => !v)}
              >
                {t('manageUsersChangeRole')}
              </button>
              <button
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                  user.isActive
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
                }`}
                onClick={handleStatusToggle}
                disabled={statusSaving}
              >
                {statusSaving
                  ? t('manageUsersUpdatingStatus')
                  : user.isActive ? t('manageUsersDeactivate') : t('manageUsersActivate')}
              </button>
            </>
          )}
        </div>
      </div>

      {statusError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{statusError}</p>}

      {showRolePanel && !isSelf && (
        <RoleChangePanel user={user} companies={companies} onDone={handleRoleDone} t={t} />
      )}
    </div>
  );
}

export default function ManageUsers() {
  const { t } = useLanguage();
  const { user: me } = useAuth();

  const [users, setUsers]         = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingUser, setViewingUser] = useState(null);
  const searchTimer = useRef(null);

  const fetchUsers = useCallback((searchVal, roleVal, pageVal) => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ page: pageVal, limit: 20 });
    if (searchVal) params.set('search', searchVal);
    if (roleVal)   params.set('role', roleVal);

    api.get(`/users?${params}`)
      .then(({ data: res }) => {
        setUsers(res.data.users);
        setTotalPages(res.data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => {
    api.get('/operators/companies').then(({ data: res }) => setCompanies(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchUsers(search, roleFilter, 1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, roleFilter, fetchUsers]);

  useEffect(() => {
    fetchUsers(search, roleFilter, page);
  }, [page]);

  const handleUpdated = (updatedUser) => {
    if (updatedUser) {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    } else {
      fetchUsers(search, roleFilter, page);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manageUsersTitle')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('manageUsersSubtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          className="input flex-1 text-sm sm:min-w-48"
          placeholder={t('manageUsersSearch')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input text-sm"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">{t('manageUsersFilterRole')}</option>
          {ROLES.map(r => (
            <option key={r} value={r}>{roleLabel(r, t)}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="card p-5">
        {loading ? (
          <p className="text-sm text-center text-gray-400 dark:text-slate-500 py-8">{t('manageUsersLoading')}</p>
        ) : error ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('manageUsersLoadError')}</p>
            <button className="btn-primary text-sm" onClick={() => fetchUsers(search, roleFilter, page)}>
              {t('retry')}
            </button>
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-center text-gray-400 dark:text-slate-500 py-8">{t('manageUsersEmpty')}</p>
        ) : (
          users.map(user => (
            <UserRow
              key={user.id}
              user={user}
              companies={companies}
              currentUserId={me?.id}
              onUpdated={handleUpdated}
              onView={setViewingUser}
              t={t}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <button
            className="btn-secondary text-sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            {t('manageUsersPrev')}
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {t('manageUsersPageOf').replace('{page}', page).replace('{total}', totalPages)}
          </span>
          <button
            className="btn-secondary text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            {t('manageUsersNext')}
          </button>
        </div>
      )}

      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          t={t}
        />
      )}
    </div>
  );
}
