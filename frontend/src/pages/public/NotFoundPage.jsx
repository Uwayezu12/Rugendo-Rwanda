import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-[#0e0a1f]">
      <div
        className="text-[8rem] font-extrabold leading-none bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg, #6e26ff 0%, #fa26ae 100%)' }}
      >
        404
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">{t('notFoundTitle')}</h1>
      <p className="text-gray-500 dark:text-slate-400 max-w-sm mb-8">{t('notFoundDesc')}</p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button onClick={() => navigate(-1)} className="btn-secondary">{t('notFoundGoBack')}</button>
        <Link to="/" className="btn-gradient">{t('notFoundGoHome')}</Link>
      </div>
    </div>
  );
}
