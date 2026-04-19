import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function BookingPolicyPage() {
  const { t } = useLanguage();

  const SECTIONS = [
    { title: t('policyS1Title'), icon: '🎫', body: t('policyS1Body') },
    { title: t('policyS2Title'), icon: '💺', body: t('policyS2Body') },
    { title: t('policyS3Title'), icon: '👤', body: t('policyS3Body') },
    { title: t('policyS4Title'), icon: '❌', body: t('policyS4Body') },
    { title: t('policyS5Title'), icon: '💰', body: t('policyS5Body') },
    { title: t('policyS6Title'), icon: '📅', body: t('policyS6Body') },
    { title: t('policyS7Title'), icon: '🚌', body: t('policyS7Body') },
    { title: t('policyS8Title'), icon: '✅', body: t('policyS8Body') },
    { title: t('policyS9Title'), icon: '🧳', body: t('policyS9Body') },
  ];

  return (
    <div>
      <section className="bg-hero-gradient text-white py-20">
        <div className="container-page">
          <span className="badge-accent mb-4">{t('legalBadge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('policyTitle')}</h1>
          <p className="text-slate-300 max-w-xl">{t('policySubtitle')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page max-w-3xl">
          <div className="space-y-5">
            {SECTIONS.map((s) => (
              <div key={s.title} className="card flex gap-5 items-start">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-xl shrink-0">
                  {s.icon}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white mb-1">{s.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">{t('policyCtaText')}</p>
            <Link to="/contact" className="btn-secondary">{t('policyCtaLink')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
