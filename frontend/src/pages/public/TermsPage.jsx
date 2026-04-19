import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function TermsPage() {
  const { t } = useLanguage();

  const SECTIONS = [
    { title: t('termsS1Title'),  body: t('termsS1Body')  },
    { title: t('termsS2Title'),  body: t('termsS2Body')  },
    { title: t('termsS3Title'),  body: t('termsS3Body')  },
    { title: t('termsS4Title'),  body: t('termsS4Body')  },
    { title: t('termsS5Title'),  body: t('termsS5Body')  },
    { title: t('termsS6Title'),  body: t('termsS6Body')  },
    { title: t('termsS7Title'),  body: t('termsS7Body')  },
    { title: t('termsS8Title'),  body: t('termsS8Body')  },
    { title: t('termsS9Title'),  body: t('termsS9Body')  },
    { title: t('termsS10Title'), body: t('termsS10Body') },
  ];

  return (
    <div>
      <section className="bg-hero-gradient text-white py-20">
        <div className="container-page">
          <span className="badge-accent mb-4">{t('legalBadge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('termsTitle')}</h1>
          <p className="text-slate-300">{t('legalLastUpdated')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page max-w-3xl">
          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{s.title}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
