import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function HowItWorksPage() {
  const { t } = useLanguage();

  const STEPS = [
    { step: '01', title: t('howStep1Title'), desc: t('howStep1Desc'), detail: t('howStep1Detail'), icon: '👤' },
    { step: '02', title: t('howStep2Title'), desc: t('howStep2Desc'), detail: t('howStep2Detail'), icon: '🔍' },
    { step: '03', title: t('howStep3Title'), desc: t('howStep3Desc'), detail: t('howStep3Detail'), icon: '🗓️' },
    { step: '04', title: t('howStep4Title'), desc: t('howStep4Desc'), detail: t('howStep4Detail'), icon: '💺' },
    { step: '05', title: t('howStep5Title'), desc: t('howStep5Desc'), detail: t('howStep5Detail'), icon: '💳' },
    { step: '06', title: t('howStep6Title'), desc: t('howStep6Desc'), detail: t('howStep6Detail'), icon: '🎫' },
  ];

  const FAQS = [
    { q: t('howFaq1Q'), a: t('howFaq1A') },
    { q: t('howFaq2Q'), a: t('howFaq2A') },
    { q: t('howFaq3Q'), a: t('howFaq3A') },
    { q: t('howFaq4Q'), a: t('howFaq4A') },
    { q: t('howFaq5Q'), a: t('howFaq5A') },
  ];

  return (
    <div>
      <section className="bg-hero-gradient text-white py-20">
        <div className="container-page text-center">
          <span className="badge-accent mb-4">{t('howBadge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('howTitle')}</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">{t('howSubtitle')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page max-w-4xl">
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="card flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient text-white text-sm font-bold flex items-center justify-center shadow-brand shrink-0">
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{s.icon}</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{s.title}</h3>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 mb-2">{s.desc}</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500">{s.detail}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block text-2xl text-brand-300 shrink-0">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-muted">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">{t('howFaqTitle')}</h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="card">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">{f.q}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section text-center">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('howCtaTitle')}</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{t('howCtaSubtitle')}</p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn-gradient">{t('howCtaCreate')}</Link>
            <Link to="/search" className="btn-secondary">{t('howCtaSearch')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
