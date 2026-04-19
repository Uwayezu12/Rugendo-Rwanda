import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
      <path d="m10.748 13.93 2.523 2.523a10.006 10.006 0 0 1-8.607-3.737 1.651 1.651 0 0 1 0-1.185 9.978 9.978 0 0 1 1.51-2.315l4.574 4.574Z" />
    </svg>
  );
}

function PasswordInput({ name, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={8}
        className="input pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
        aria-label={visible ? t('loginHidePassword') : t('loginShowPassword')}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError(t('resetErrorMismatch'));
      return;
    }
    if (!token) {
      setError(t('resetErrorMissingToken'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword({ token, password: form.password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || t('resetErrorFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('resetInvalidTitle')}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{t('resetInvalidText')}</p>
        <Link to="/forgot-password" className="btn-gradient">{t('resetRequestNew')}</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('resetDoneTitle')}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{t('resetDoneText')}</p>
        <Link to="/login" className="btn-gradient">{t('resetSignInBtn')}</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('resetTitle')}</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-7">{t('resetSubtitle')}</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('resetNewPassword')}</label>
          <PasswordInput
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder={t('resetPasswordHint')}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">{t('resetConfirmPassword')}</label>
          <PasswordInput
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder={t('resetRepeatHint')}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-gradient w-full">
          {loading ? t('resetSubmitting') : t('resetSubmitBtn')}
        </button>
      </form>
    </div>
  );
}
