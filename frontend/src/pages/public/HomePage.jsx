import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const FEATURED_ROUTES = [
  { from: 'Kigali', to: 'Butare',    distance: '136 km', duration: '2h 30min', price: 'RWF 3,500' },
  { from: 'Kigali', to: 'Musanze',   distance: '111 km', duration: '2h',       price: 'RWF 3,000' },
  { from: 'Kigali', to: 'Gisenyi',   distance: '157 km', duration: '2h 45min', price: 'RWF 4,000' },
  { from: 'Kigali', to: 'Cyangugu',  distance: '218 km', duration: '3h 30min', price: 'RWF 5,500' },
  { from: 'Butare',  to: 'Musanze',  distance: '195 km', duration: '3h 15min', price: 'RWF 5,000' },
  { from: 'Kigali', to: 'Kibungo',   distance: '114 km', duration: '2h',       price: 'RWF 3,200' },
];

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function SearchWidget({ compact = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ from: '', to: '', date: todayLocal(), passengers: '1' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(form).toString();
    navigate(`/search?${params}`);
  };

  const inputClass = compact ? 'input text-sm' : 'input py-3 text-base';

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-white dark:bg-[#1a1035] rounded-2xl shadow-brand border border-[#e8e3ff] dark:border-[#2d1a5e] ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className={`grid gap-3 ${compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        <div>
          <label className="label">{t('from')}</label>
          <input
            name="from"
            value={form.from}
            onChange={handleChange}
            placeholder={t('homeDepartureCity')}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="label">{t('to')}</label>
          <input
            name="to"
            value={form.to}
            onChange={handleChange}
            placeholder={t('homeDestination')}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="label">{t('date')}</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className="label">{t('passengers')}</label>
          <select name="passengers" value={form.passengers} onChange={handleChange} className={inputClass}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? t('homePassengerN', { n }) : t('homePassengersN', { n })}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="submit" className="btn-gradient px-8">
          {t('searchTripsSearchBtn')}
        </button>
      </div>
    </form>
  );
}

function RouteCard({ from, to, distance, duration, price }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => navigate(`/search-trips?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)}
      className="card-hover text-left w-full group"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-semibold text-gray-900 dark:text-white">{from}</span>
        <span className="text-accent-500">→</span>
        <span className="text-base font-semibold text-gray-900 dark:text-white">{to}</span>
      </div>
      <div className="flex gap-4 text-sm text-gray-500 dark:text-slate-400 mb-4">
        <span>{distance}</span>
        <span>·</span>
        <span>{duration}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-slate-500">{t('homeFrom')}</span>
        <span className="text-brand-600 dark:text-brand-400 font-bold text-lg">{price}</span>
      </div>
    </button>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const bookTripPath = user ? '/routes' : '/register';

  const STEPS = [
    { step: '01', title: t('homeStep1Title'), desc: t('homeStep1Desc'), icon: '🔍' },
    { step: '02', title: t('homeStep2Title'), desc: t('homeStep2Desc'), icon: '🗓️' },
    { step: '03', title: t('homeStep3Title'), desc: t('homeStep3Desc'), icon: '🎫' },
  ];

  const BENEFITS = [
    { title: t('homeBenefit1Title'), desc: t('homeBenefit1Desc'), icon: '📱' },
    { title: t('homeBenefit2Title'), desc: t('homeBenefit2Desc'), icon: '✅' },
    { title: t('homeBenefit3Title'), desc: t('homeBenefit3Desc'), icon: '💳' },
    { title: t('homeBenefit4Title'), desc: t('homeBenefit4Desc'), icon: '📋' },
  ];

  const STATS = [
    { value: '50+',  label: t('homeStatRoutes')     },
    { value: '200+', label: t('homeStatDepartures') },
    { value: '15+',  label: t('homeStatCities')     },
    { value: '98%',  label: t('homeStatOnTime')     },
  ];

  const TRUST_ITEMS = [
    t('homeTrust1'),
    t('homeTrust2'),
    t('homeTrust3'),
    t('homeTrust4'),
  ];

  const TRUST_CARDS = [
    { icon: '🔒', title: t('homeTrustCard1Title'), sub: t('homeTrustCard1Sub') },
    { icon: '📲', title: t('homeTrustCard2Title'), sub: t('homeTrustCard2Sub') },
    { icon: '🕒', title: t('homeTrustCard3Title'), sub: t('homeTrustCard3Sub') },
    { icon: '🛡️', title: t('homeTrustCard4Title'), sub: t('homeTrustCard4Sub') },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative bg-hero-gradient text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600 opacity-20 blur-3xl" />
          <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-accent-500 opacity-15 blur-3xl" />
        </div>

        <div className="container-page relative py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-accent mb-4 inline-flex">{t('homeBadgePlatform')}</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                {t('homeHeroTitle')}{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #9b72ff 0%, #fa26ae 100%)' }}
                >
                  {t('homeHeroHighlight')}
                </span>{' '}
                {t('homeHeroTitleEnd')}
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-xl mb-10">
                {t('homeHeroSubtitle')}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to={bookTripPath} className="btn-gradient text-base px-7 py-3">
                  {t('homeBookTrip')}
                </Link>
                <Link to="/how-it-works" className="btn-secondary text-base px-7 py-3">
                  {t('homeHowItWorks')}
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 mt-8">
                {[t('homeTrustSecure'), t('homeTrustInstant'), t('homeTrustDigital')].map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                               bg-white/10 text-white border border-white/20 backdrop-blur-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 inline-block" />
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div
                className="absolute inset-0 rounded-3xl blur-3xl opacity-30 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 60% 40%, #6e26ff 0%, #fa26ae 60%, transparent 100%)' }}
                aria-hidden
              />
              <div className="relative p-1.5 rounded-3xl"
                   style={{ background: 'linear-gradient(135deg, rgba(110,38,255,0.5) 0%, rgba(250,38,174,0.5) 100%)' }}>
                <div
                  className="relative rounded-[1.25rem] overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                    boxShadow: '0 8px 40px 0 rgba(110,38,255,0.45), 0 2px 12px 0 rgba(250,38,174,0.25)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <img
                    src="/hero_image.png"
                    alt="Rugendo Rwanda — modern intercity bus travel in Rwanda"
                    className="block w-full max-w-sm lg:max-w-full object-contain"
                    style={{ maxHeight: '420px' }}
                    draggable={false}
                  />
                  <div
                    className="absolute bottom-0 inset-x-0 h-16 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(26,8,69,0.5) 0%, transparent 100%)' }}
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-page pb-16 relative">
          <SearchWidget />
        </div>

        <div className="h-12 bg-gradient-to-b from-transparent to-white dark:to-[#0e0a1f]" />
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────── */}
      <section className="section-muted border-y border-[#e8e3ff] dark:border-[#2d1a5e]">
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="section">
        <div className="container-page">
          <div className="text-center mb-12">
            <span className="badge-brand mb-3">{t('homeStepsBadge')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {t('homeStepsTitle')}
            </h2>
            <p className="mt-3 text-gray-500 dark:text-slate-400 max-w-lg mx-auto">
              {t('homeStepsSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="card relative">
                <span className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center shadow-brand">
                  {s.step}
                </span>
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/how-it-works" className="btn-secondary">
              {t('homeLearnMore')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED ROUTES ──────────────────────────────────────── */}
      <section className="section-muted">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="badge-accent mb-3">{t('homeRoutesBadge')}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {t('homeRoutesTitle')}
              </h2>
            </div>
            <Link to="/routes" className="btn-ghost text-sm shrink-0">
              {t('homeViewAllRoutes')}
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED_ROUTES.map((r) => (
              <RouteCard key={`${r.from}-${r.to}`} {...r} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-page">
          <div className="text-center mb-12">
            <span className="badge-brand mb-3">{t('homeBenefitsBadge')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {t('homeBenefitsTitle')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card-gradient p-6">
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ────────────────────────────────────────── */}
      <section className="section-muted">
        <div className="container-page">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-brand mb-4">{t('homeTrustBadge')}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-5">
                {t('homeTrustTitle')}
              </h2>
              <ul className="space-y-4 text-gray-600 dark:text-slate-400">
                {TRUST_ITEMS.map((item) => (
                  <li key={item} className="flex gap-3 items-start text-sm">
                    <span className="mt-0.5 text-brand-600 dark:text-brand-400 font-bold shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {TRUST_CARDS.map((tc) => (
                <div key={tc.title} className="card text-center py-6">
                  <div className="text-3xl mb-2">{tc.icon}</div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{tc.title}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{tc.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────── */}
      <section className="section">
        <div className="container-page">
          <div
            className="rounded-3xl px-8 py-14 text-white text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6e26ff 0%, #fa26ae 100%)' }}
          >
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-white opacity-5 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('homeCtaTitle')}</h2>
              <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">{t('homeCtaSubtitle')}</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center bg-white text-brand-700 font-bold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors"
                >
                  {t('homeCtaCreate')}
                </Link>
                <Link
                  to="/search-trips"
                  className="inline-flex items-center bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl border border-white/30 transition-colors"
                >
                  {t('homeCtaSearch')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
