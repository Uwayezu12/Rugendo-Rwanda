import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';

const SETTINGS_KEYS = [
  'default_language',
  'default_theme',
  'maintenance_mode',
  'support_email',
  'support_phone',
  'booking_cancellation_window_hours',
  'max_seats_per_booking',
];

function keyLabel(key, t) {
  const map = {
    default_language:                   t('platformSettingsKeyDefaultLanguage'),
    default_theme:                      t('platformSettingsKeyDefaultTheme'),
    maintenance_mode:                   t('platformSettingsKeyMaintenanceMode'),
    support_email:                      t('platformSettingsKeySupportEmail'),
    support_phone:                      t('platformSettingsKeySupportPhone'),
    booking_cancellation_window_hours:  t('platformSettingsKeyCancelWindow'),
    max_seats_per_booking:              t('platformSettingsKeyMaxSeats'),
  };
  return map[key] || key;
}

function SettingRow({ settingKey, value, onSave, t }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value ?? '');
  const [saving, setSaving]   = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError]     = useState('');
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  const handleSave = async (confirmed = false) => {
    if (settingKey === 'maintenance_mode' && draft === 'true' && !confirmed) {
      setConfirmMaintenance(true);
      return;
    }
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      await api.put(`/settings/${settingKey}`, { value: draft });
      setSavedMsg(t('platformSettingsSaved'));
      setEditing(false);
      onSave(settingKey, draft);
      setTimeout(() => setSavedMsg(''), 3000);
    } catch {
      setError(t('platformSettingsError'));
    } finally {
      setSaving(false);
      setConfirmMaintenance(false);
    }
  };

  const handleCancel = () => {
    setDraft(value ?? '');
    setEditing(false);
    setError('');
    setSavedMsg('');
    setConfirmMaintenance(false);
  };

  const displayValue = value ?? t('platformSettingsNotSet');

  return (
    <div className="py-4 border-b border-gray-100 dark:border-slate-700 last:border-b-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{keyLabel(settingKey, t)}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-mono">{settingKey}</p>
          {settingKey === 'maintenance_mode' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('platformSettingsKeyMaintenanceModeHint')}</p>
          )}
          {!editing && (
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              {value ? value : <span className="italic text-gray-400 dark:text-slate-500">{t('platformSettingsNotSet')}</span>}
            </p>
          )}
        </div>
        {!editing && (
          <button
            className="btn-secondary text-xs shrink-0"
            onClick={() => { setDraft(value ?? ''); setEditing(true); setError(''); setSavedMsg(''); }}
          >
            {t('edit')}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          {settingKey === 'maintenance_mode' ? (
            <select
              className="input w-40 text-sm"
              value={draft}
              onChange={e => setDraft(e.target.value)}
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          ) : (
            <input
              className="input w-full text-sm"
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
          )}

          {confirmMaintenance && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('platformSettingsMaintenanceConfirmTitle')}</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('platformSettingsMaintenanceConfirmText')}</p>
              <div className="flex gap-2">
                <button className="btn-primary text-xs" onClick={() => handleSave(true)} disabled={saving}>
                  {saving ? t('platformSettingsSaving') : t('platformSettingsConfirmYes')}
                </button>
                <button className="btn-secondary text-xs" onClick={() => setConfirmMaintenance(false)}>
                  {t('platformSettingsConfirmNo')}
                </button>
              </div>
            </div>
          )}

          {!confirmMaintenance && (
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-primary text-xs" onClick={() => handleSave(false)} disabled={saving}>
                {saving ? t('platformSettingsSaving') : t('platformSettingsSave')}
              </button>
              <button className="btn-secondary text-xs" onClick={handleCancel} disabled={saving}>
                {t('cancel')}
              </button>
              {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
              {savedMsg && <p className="text-xs text-green-600 dark:text-green-400">{savedMsg}</p>}
            </div>
          )}
        </div>
      )}

      {!editing && savedMsg && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">{savedMsg}</p>
      )}
    </div>
  );
}

export default function PlatformSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const fetchSettings = useCallback(() => {
    setLoading(true);
    setError(false);
    api.get('/settings')
      .then(({ data: res }) => { setSettings(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-slate-400">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-gray-500 dark:text-slate-400">{t('platformSettingsLoadError')}</p>
        <button className="btn-primary" onClick={fetchSettings}>{t('platformSettingsRetry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('platformSettingsTitle')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('platformSettingsSubtitle')}</p>
      </div>

      <div className="card p-6">
        {SETTINGS_KEYS.map(key => (
          <SettingRow
            key={key}
            settingKey={key}
            value={settings?.[key] ?? null}
            onSave={handleSave}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
