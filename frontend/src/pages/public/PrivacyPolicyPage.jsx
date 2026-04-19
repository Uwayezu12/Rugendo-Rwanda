import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  const SECTIONS = [
    { title: t('privacyS1Title'),  body: t('privacyS1Body')  },
    { title: t('privacyS2Title'),  body: t('privacyS2Body')  },
    { title: t('privacyS3Title'),  body: t('privacyS3Body')  },
    { title: t('privacyS4Title'),  body: t('privacyS4Body')  },
    { title: t('privacyS5Title'),  body: t('privacyS5Body')  },
    { title: t('privacyS6Title'),  body: t('privacyS6Body')  },
    { title: t('privacyS7Title'),  body: t('privacyS7Body')  },
    { title: t('privacyS8Title'),  body: t('privacyS8Body')  },
    { title: t('privacyS9Title'),  body: t('privacyS9Body')  },
    { title: t('privacyS10Title'), body: t('privacyS10Body') },
  ];

  return (
    <div>
      <section className="bg-hero-gradient text-white py-20">
        <div className="container-page">
          <span className="badge-accent mb-4">{t('legalBadge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('privacyTitle')}</h1>
          <p className="text-slate-300">{t('legalLastUpdated')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page max-w-3xl">
          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{s.title}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
