import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e8e3ff] dark:border-[#2d1a5e] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-4 flex items-start justify-between gap-4 group"
      >
        <span className="font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {q}
        </span>
        <span className={`shrink-0 text-brand-600 dark:text-brand-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { t } = useLanguage();

  const FAQS = [
    {
      category: t('faqCat1'),
      items: [
        { q: t('faqB1Q'), a: t('faqB1A') },
        { q: t('faqB2Q'), a: t('faqB2A') },
        { q: t('faqB3Q'), a: t('faqB3A') },
        { q: t('faqB4Q'), a: t('faqB4A') },
        { q: t('faqB5Q'), a: t('faqB5A') },
      ],
    },
    {
      category: t('faqCat2'),
      items: [
        { q: t('faqP1Q'), a: t('faqP1A') },
        { q: t('faqP2Q'), a: t('faqP2A') },
        { q: t('faqP3Q'), a: t('faqP3A') },
        { q: t('faqP4Q'), a: t('faqP4A') },
      ],
    },
    {
      category: t('faqCat3'),
      items: [
        { q: t('faqT1Q'), a: t('faqT1A') },
        { q: t('faqT2Q'), a: t('faqT2A') },
        { q: t('faqT3Q'), a: t('faqT3A') },
      ],
    },
    {
      category: t('faqCat4'),
      items: [
        { q: t('faqC1Q'), a: t('faqC1A') },
        { q: t('faqC2Q'), a: t('faqC2A') },
        { q: t('faqC3Q'), a: t('faqC3A') },
      ],
    },
  ];

  return (
    <div>
      <section className="bg-hero-gradient text-white py-20">
        <div className="container-page text-center">
          <span className="badge-accent mb-4">{t('faqBadge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('faqTitle')}</h1>
          <p className="text-slate-300 text-lg max-w-lg mx-auto">{t('faqSubtitle')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page max-w-3xl">
          <div className="space-y-10">
            {FAQS.map((section) => (
              <div key={section.category}>
                <h2 className="text-lg font-bold text-brand-600 dark:text-brand-400 mb-2">{section.category}</h2>
                <div className="card divide-y divide-[#e8e3ff] dark:divide-[#2d1a5e] p-0 overflow-hidden">
                  {section.items.map((item) => (
                    <div key={item.q} className="px-6">
                      <FAQItem {...item} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 card text-center py-10">
            <p className="text-gray-500 dark:text-slate-400 mb-4">{t('faqNotFound')}</p>
            <Link to="/contact" className="btn-gradient">{t('faqContactSupport')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
