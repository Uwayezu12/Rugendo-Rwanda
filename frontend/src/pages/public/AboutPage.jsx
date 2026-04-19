import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function AboutPage() {
  const { t } = useLanguage();

  const VALUES = [
    { icon: '🚌', title: t('aboutValue1Title'), desc: t('aboutValue1Desc') },
    { icon: '📲', title: t('aboutValue2Title'), desc: t('aboutValue2Desc') },
    { icon: '🔒', title: t('aboutValue3Title'), desc: t('aboutValue3Desc') },
    { icon: '🤝', title: t('aboutValue4Title'), desc: t('aboutValue4Desc') },
  ];

  return (
    <div>
      <section className="bg-hero-gradient text-white py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <span className="badge-accent mb-4">{t('aboutBadge')}</span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-5">{t('aboutTitle')}</h1>
            <p className="text-slate-300 text-lg">{t('aboutSubtitle')}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-brand mb-3">{t('aboutMissionBadge')}</span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('aboutMissionTitle')}</h2>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-4">{t('aboutMissionP1')}</p>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed">{t('aboutMissionP2')}</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: t('aboutStat1'), value: '50+'  },
                { label: t('aboutStat2'), value: '200+' },
                { label: t('aboutStat3'), value: '15+'  },
                { label: t('aboutStat4'), value: '8+'   },
              ].map((s) => (
                <div key={s.label} className="card text-center py-8">
                  <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">{s.value}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-muted">
        <div className="container-page">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('aboutValuesTitle')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="card">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section text-center">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('aboutCtaTitle')}</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{t('aboutCtaSubtitle')}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register" className="btn-gradient">{t('aboutCreateAccount')}</Link>
            <Link to="/contact" className="btn-secondary">{t('aboutContactUs')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
