import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
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

const ROLE_ROUTES = {
  passenger:  '/',
  admin:      '/admin',
  super_admin:'/super-admin',
  operator:   '/operator',
};

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm]           = useState({ identifier: '', password: '' });
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPassword, setShowPw] = useState(false);

  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback:  handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size:  'large',
      width: '100%',
      text:  'signin_with',
    });
  }, []);

  const handleGoogleResponse = async ({ credential }) => {
    setError('');
    setLoading(true);
    try {
      const data = await loginWithGoogle(credential);
      navigate(ROLE_ROUTES[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || t('loginGoogleFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form);
      navigate(ROLE_ROUTES[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('loginTitle')}</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-7">{t('loginSubtitle')}</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Google sign-in button — rendered by GSI SDK */}
      <div ref={googleBtnRef} className="mb-4 flex justify-center" />

      <div className="relative my-5 flex items-center">
        <div className="flex-grow border-t border-gray-200 dark:border-slate-700" />
        <span className="mx-3 text-xs text-gray-400 dark:text-slate-500 shrink-0">{t('navOrSignIn')}</span>
        <div className="flex-grow border-t border-gray-200 dark:border-slate-700" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('loginIdentifierLabel')}</label>
          <input
            type="text"
            name="identifier"
            value={form.identifier}
            onChange={handleChange}
            required
            autoComplete="username"
            placeholder={t('loginIdentifierPlaceholder')}
            className="input"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="label mb-0">{t('password')}</label>
            <Link to="/forgot-password" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
              {t('loginForgotPasswordLink')}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="input pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              aria-label={showPassword ? t('loginHidePassword') : t('loginShowPassword')}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-gradient w-full mt-2">
          {loading ? t('loginSubmitting') : t('loginSubmitBtn')}
        </button>
      </form>

      <p className="text-sm text-gray-500 dark:text-slate-400 mt-6 text-center">
        {t('loginNoAccount')}{' '}
        <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
          {t('loginCreateAccount')}
        </Link>
      </p>
    </div>
  );
}
