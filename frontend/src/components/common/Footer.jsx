import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const FOOTER_SECTIONS = [
  {
    headingKey: 'footerBookTravel',
    links: [
      { to: '/search-trips',  labelKey: 'footerSearchTrips' },
      { to: '/routes',        labelKey: 'footerAllRoutes' },
      { to: '/how-it-works',  labelKey: 'navHowItWorks' },
      { to: '/faq',           labelKey: 'footerFaq' },
    ],
  },
  {
    headingKey: 'footerCompany',
    links: [
      { to: '/about',   labelKey: 'footerAboutUs' },
      { to: '/contact', labelKey: 'footerContact' },
    ],
  },
  {
    headingKey: 'footerLegal',
    links: [
      { to: '/terms',          labelKey: 'footerTermsService' },
      { to: '/privacy',        labelKey: 'footerPrivacyPolicy' },
      { to: '/booking-policy', labelKey: 'footerBookingPolicy' },
    ],
  },
  {
    headingKey: 'footerAccount',
    links: [
      { to: '/login',    labelKey: 'navSignIn' },
      { to: '/register', labelKey: 'footerCreateAccount' },
    ],
  },
];

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0e0a1f] text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Rugendo Rwanda" className="h-8 w-auto object-contain brightness-0 invert" />
              <span
                className="text-xl font-extrabold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #9b72ff 0%, #fa26ae 100%)' }}
              >
                Rugendo Rwanda
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              {t('footerTagline')}
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.headingKey}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                {t(section.headingKey)}
              </h4>
              <ul className="space-y-2">
                {section.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {t(l.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-[#2d1a5e] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Rugendo Rwanda. {t('footerRights')}</p>
          <p>Kigali, Rwanda · support@rugendorwanda.rw</p>
        </div>
      </div>
    </footer>
  );
}
