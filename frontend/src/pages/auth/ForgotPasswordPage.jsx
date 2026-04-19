import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || t('forgotError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('forgotTitle')}</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-7">{t('forgotSubtitle')}</p>

      {sent ? (
        <div className="text-center py-6">
          <div className="text-5xl mb-4">📧</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('forgotSentTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {t('forgotSentText', { email })}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="label">{t('forgotEmailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t('forgotEmailPlaceholder')}
              className="input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-gradient w-full">
            {loading ? t('forgotSubmitting') : t('forgotSubmitBtn')}
          </button>
        </form>
      )}

      <p className="text-sm text-center mt-6">
        <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline">{t('forgotBackToSignIn')}</Link>
      </p>
    </div>
  );
}
