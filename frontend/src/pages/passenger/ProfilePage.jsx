import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { userService } from '../../services/userService.js';

const RWANDA_PHONE_RE = /^07(2|3|8|9)\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-RW', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function ProfilePage() {
  const { user: authUser, logout, refreshUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [profile,       setProfile]      = useState(null);
  const [loadError,     setLoadError]    = useState('');
  const [loading,       setLoading]      = useState(true);

  const [editing,       setEditing]      = useState(false);
  const [form,          setForm]         = useState({ name: '', email: '', phone: '' });
  const [saving,        setSaving]       = useState(false);
  const [saveError,     setSaveError]    = useState('');
  const [saveSuccess,   setSaveSuccess]  = useState('');

  const [showDelete,    setShowDelete]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting,      setDeleting]     = useState(false);
  const [deleteError,   setDeleteError]  = useState('');

  const roleLabel = (role) => {
    const map = {
      passenger:   t('profileRolePassenger'),
      admin:       t('profileRoleAdmin'),
      super_admin: t('profileRoleSuperAdmin'),
      operator:    t('profileRoleOperator'),
    };
    return map[role] || role;
  };

  useEffect(() => {
    userService.getProfile()
      .then((res) => {
        setProfile(res.data);
        setForm({
          name:  res.data.name  || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
        });
      })
      .catch(() => setLoadError(t('profileLoadError')))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setSaveError('');
    setSaveSuccess('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    const hasEmail = form.email.trim() !== '';
    const hasPhone = form.phone.trim() !== '';

    if (hasEmail && !EMAIL_RE.test(form.email.trim())) {
      setSaveError(t('profileEmailInvalid'));
      return;
    }
    if (hasPhone && !RWANDA_PHONE_RE.test(form.phone.trim())) {
      setSaveError(t('profilePhoneInvalid'));
      return;
    }

    setSaving(true);
    try {
      const res = await userService.updateProfile({
        name:  form.name.trim() || undefined,
        email: form.email.trim() || '',
        phone: form.phone.trim() || '',
      });
      setProfile(res.data);
      setSaveSuccess(t('profileUpdated'));
      setEditing(false);
      if (refreshUser) await refreshUser();
    } catch (err) {
      setSaveError(
        err?.response?.data?.message || t('profileUpdateError')
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditing(false);
    setSaveError('');
    setSaveSuccess('');
    setForm({
      name:  profile?.name  || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
  }

  async function handleDelete() {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE in capitals to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await userService.deleteAccount();
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || t('profileDeleteError')
      );
      setDeleting(false);
      return;
    }
    try {
      await logout();
    } catch {
      // Session will be stale; localStorage was cleared by authService.logout's finally block
    }
    navigate('/', { replace: true });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-slate-400 text-sm">{t('profileLoadingText')}</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-red-500 dark:text-red-400">{loadError || t('profileUnavailable')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profileTitle')}</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t('profileSubtitle')}</p>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {profile.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.name}</p>
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 mt-1">
              {roleLabel(authUser?.role || profile.role?.toLowerCase())}
            </span>
          </div>
        </div>

        {!editing && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-gray-400 dark:text-slate-500 mb-0.5">{t('profileFullName')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{profile.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-slate-500 mb-0.5">{t('profileEmailLabel')}</p>
                <p className="font-medium text-gray-900 dark:text-white break-all">
                  {profile.email || <span className="text-gray-400 dark:text-slate-500 italic">{t('profileNotSet')}</span>}
                </p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-slate-500 mb-0.5">{t('profilePhoneLabel')}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {profile.phone || <span className="text-gray-400 dark:text-slate-500 italic">{t('profileNotSet')}</span>}
                </p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-slate-500 mb-0.5">{t('profileMemberSince')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(profile.createdAt)}</p>
              </div>
            </div>

            {saveSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400 mb-4">{saveSuccess}</p>
            )}

            <button
              type="button"
              onClick={() => { setEditing(true); setSaveSuccess(''); }}
              className="btn-gradient"
            >
              {t('profileEditBtn')}
            </button>
          </>
        )}

        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {saveError}
              </div>
            )}

            <div>
              <label className="label">{t('profileFullName')}</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t('profileYourName')}
                className="input"
              />
            </div>

            <div>
              <label className="label">
                {t('profileEmailLabel')} <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">{t('profileEmailOptional')}</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="label">
                {t('profilePhoneLabel')} <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">{t('profilePhoneOptional')}</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0781234567"
                className="input"
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('profilePhoneHint')}</p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="btn-secondary flex-1"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-gradient flex-1 flex items-center justify-center gap-2"
              >
                {saving && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {saving ? t('profileSaving') : t('profileSaveChanges')}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card border border-red-200 dark:border-red-900/50">
        <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-1">{t('profileDangerZone')}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{t('profileDangerDesc')}</p>

        {!showDelete && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            {t('profileDeleteBtn')}
          </button>
        )}

        {showDelete && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-slate-300">
              {t('profileDeleteConfirm').replace('DELETE', '')}
              <strong className="font-mono text-red-600 dark:text-red-400">DELETE</strong>
              {' '}in the box below and click the button.
            </p>

            {deleteError && (
              <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
            )}

            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
              placeholder={t('profileDeleteTypePlaceholder')}
              className="input font-mono"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowDelete(false); setDeleteConfirm(''); setDeleteError(''); }}
                disabled={deleting}
                className="btn-secondary flex-1"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== 'DELETE'}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {deleting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {deleting ? t('profileDeleting') : t('profileDeleteSubmitBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
