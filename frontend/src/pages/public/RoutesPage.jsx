import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import Pagination from '../../components/common/Pagination.jsx';

// Fares sourced from RURA Intercity Public Transport Tariff 2026 (effective 2026-04-06).
// departures = approximate daily trips across all companies on that route (demo estimate).
const ROUTES = [
  // ── Northern ──────────────────────────────────────────────────────────────
  { from: 'NYABUGOGO', to: 'MUSANZE',    distance: '92 km',  duration: '2h',        minPrice: 3821,  departures: 9,  popular: true  },
  { from: 'NYABUGOGO', to: 'GICUMBI',    distance: '55 km',  duration: '1h 30min',  minPrice: 2297,  departures: 9,  popular: true  },
  { from: 'NYABUGOGO', to: 'RUBAVU',     distance: '154 km', duration: '3h 15min',  minPrice: 6403,  departures: 6,  popular: true  },
  { from: 'NYABUGOGO', to: 'GAKENKE',    distance: '58 km',  duration: '1h 15min',  minPrice: 2416,  departures: 6,  popular: false },
  { from: 'NYABUGOGO', to: 'BASE',       distance: '52 km',  duration: '1h',        minPrice: 2158,  departures: 6,  popular: false },
  { from: 'NYABUGOGO', to: 'GATUNA',     distance: '78 km',  duration: '1h 45min',  minPrice: 3248,  departures: 6,  popular: false },
  { from: 'NYABUGOGO', to: 'BUTARO',     distance: '143 km', duration: '3h 30min',  minPrice: 5940,  departures: 6,  popular: false },
  { from: 'MUSANZE',   to: 'RUBAVU',     distance: '62 km',  duration: '1h 15min',  minPrice: 2573,  departures: 9,  popular: false },
  { from: 'GICUMBI',   to: 'MUSANZE',    distance: '105 km', duration: '2h 30min',  minPrice: 4356,  departures: 6,  popular: false },
  // ── Eastern ───────────────────────────────────────────────────────────────
  { from: 'NYABUGOGO', to: 'NYAGATARE',  distance: '129 km', duration: '3h 30min',  minPrice: 5346,  departures: 9,  popular: true  },
  { from: 'NYABUGOGO', to: 'RWAMAGANA',  distance: '51 km',  duration: '1h',        minPrice: 2121,  departures: 10, popular: true  },
  { from: 'NYABUGOGO', to: 'KAYONZA',    distance: '85 km',  duration: '1h 40min',  minPrice: 3534,  departures: 9,  popular: false },
  { from: 'NYABUGOGO', to: 'NGOMA',      distance: '115 km', duration: '2h 30min',  minPrice: 4782,  departures: 6,  popular: false },
  { from: 'NYABUGOGO', to: 'RUSUMO',     distance: '169 km', duration: '4h',        minPrice: 7029,  departures: 5,  popular: false },
  { from: 'NYABUGOGO', to: 'KAGITUMBA',  distance: '190 km', duration: '4h 30min',  minPrice: 7900,  departures: 4,  popular: false },
  { from: 'GICUMBI',   to: 'NYAGATARE',  distance: '109 km', duration: '3h',        minPrice: 4535,  departures: 4,  popular: false },
  { from: 'KAYONZA',   to: 'NYAGATARE',  distance: '101 km', duration: '2h 15min',  minPrice: 4200,  departures: 4,  popular: false },
  // ── Southern ──────────────────────────────────────────────────────────────
  { from: 'NYABUGOGO', to: 'MUHANGA',    distance: '56 km',  duration: '1h 15min',  minPrice: 2328,  departures: 10, popular: true  },
  { from: 'NYABUGOGO', to: 'HUYE',       distance: '122 km', duration: '2h 30min',  minPrice: 5068,  departures: 11, popular: true  },
  { from: 'NYABUGOGO', to: 'RUHANGO',    distance: '90 km',  duration: '1h 50min',  minPrice: 3742,  departures: 6,  popular: false },
  { from: 'NYABUGOGO', to: 'NYANZA',     distance: '106 km', duration: '2h 10min',  minPrice: 4407,  departures: 6,  popular: false },
  { from: 'NYABUGOGO', to: 'NYAMAGABE',  distance: '157 km', duration: '3h 15min',  minPrice: 6528,  departures: 6,  popular: false },
  { from: 'MUHANGA',   to: 'HUYE',       distance: '66 km',  duration: '1h 30min',  minPrice: 2744,  departures: 6,  popular: false },
  // ── Western / South-Western ───────────────────────────────────────────────
  { from: 'NYABUGOGO', to: 'KARONGI',    distance: '120 km', duration: '2h 45min',  minPrice: 4990,  departures: 6,  popular: false },
  { from: 'NYABUGOGO', to: 'RUSIZI',     distance: '275 km', duration: '6h',        minPrice: 11445, departures: 8,  popular: true  },
  { from: 'MUHANGA',   to: 'RUSIZI',     distance: '231 km', duration: '5h',        minPrice: 9603,  departures: 5,  popular: false },
  { from: 'RUBAVU',    to: 'RUSIZI',     distance: '217 km', duration: '4h 30min',  minPrice: 9009,  departures: 5,  popular: false },
  { from: 'RUBAVU',    to: 'KARONGI',    distance: '119 km', duration: '2h 30min',  minPrice: 4950,  departures: 5,  popular: false },
  { from: 'HUYE',      to: 'RUSIZI',     distance: '153 km', duration: '3h 20min',  minPrice: 6362,  departures: 6,  popular: false },
];

export default function RoutesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => ROUTES.filter((r) => {
    const fromMatch = !filterFrom || r.from.toLowerCase().includes(filterFrom.toLowerCase());
    const toMatch   = !filterTo   || r.to.toLowerCase().includes(filterTo.toLowerCase());
    return fromMatch && toMatch;
  }), [filterFrom, filterTo]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / PAGE_SIZE), [filtered.length]);
  const pagedFiltered = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const handleFilterFrom = (e) => { setFilterFrom(e.target.value); setPage(1); };
  const handleFilterTo   = (e) => { setFilterTo(e.target.value);   setPage(1); };

  const popular = ROUTES.filter((r) => r.popular);

  return (
    <div>
      <section className="bg-white text-gray-900 dark:bg-hero-gradient dark:text-white py-20">
        <div className="container-page text-center">
          <span className="badge-accent mb-4">{t('routesBadge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('routesTitle')}</h1>
          <p className="text-gray-600 dark:text-slate-300 text-lg max-w-xl mx-auto">{t('routesSubtitle')}</p>
        </div>
      </section>

      <section className="section-muted">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('routesPopularTitle')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popular.map((r) => (
              <RouteCard
                key={`${r.from}-${r.to}`}
                route={r}
                t={t}
                onBook={(from, to) => navigate(`/search-trips?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <input
              value={filterFrom}
              onChange={handleFilterFrom}
              placeholder={t('routesFilterFrom')}
              className="input max-w-xs"
            />
            <input
              value={filterTo}
              onChange={handleFilterTo}
              placeholder={t('routesFilterTo')}
              className="input max-w-xs"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-gray-400 text-center py-10">{t('routesNoMatch')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8e3ff] dark:border-[#2d1a5e] text-left text-gray-500 dark:text-slate-400">
                    <th className="pb-3 font-medium">{t('routesColRoute')}</th>
                    <th className="pb-3 font-medium">{t('routesColDistance')}</th>
                    <th className="pb-3 font-medium">{t('routesColDuration')}</th>
                    <th className="pb-3 font-medium">{t('routesColDepartures')}</th>
                    <th className="pb-3 font-medium">{t('routesColPrice')}</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e3ff] dark:divide-[#2d1a5e]">
                  {pagedFiltered.map((r) => (
                    <tr key={`${r.from}-${r.to}`} className="hover:bg-[#f8f7ff] dark:hover:bg-[#130d2e] transition-colors">
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        {r.from} <span className="text-accent-500">→</span> {r.to}
                        {r.popular && <span className="badge-accent ml-2">{t('routesPopularBadge')}</span>}
                      </td>
                      <td className="py-3 text-gray-500 dark:text-slate-400">{r.distance}</td>
                      <td className="py-3 text-gray-500 dark:text-slate-400">{r.duration}</td>
                      <td className="py-3 text-gray-500 dark:text-slate-400">{r.departures}{t('routesPerDay')}</td>
                      <td className="py-3 font-semibold text-brand-600 dark:text-brand-400">
                        RWF {r.minPrice.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => navigate(`/search-trips?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          {t('routesViewSchedules')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RouteCard({ route: r, onBook, t }) {
  return (
    <div className="card-hover">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-gray-900 dark:text-white">{r.from}</span>
        <span className="text-accent-500">→</span>
        <span className="font-bold text-gray-900 dark:text-white">{r.to}</span>
        {r.popular && <span className="badge-accent ml-auto">{t('routesPopularBadge')}</span>}
      </div>
      <div className="flex gap-4 text-sm text-gray-500 dark:text-slate-400 mb-4">
        <span>{r.distance}</span>·<span>{r.duration}</span>·<span>{r.departures} {t('routesColDepartures').toLowerCase()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-brand-600 dark:text-brand-400 font-bold">{t('routesFromPrice')} {r.minPrice.toLocaleString()}</span>
        <button onClick={() => onBook(r.from, r.to)} className="btn-primary text-xs px-4 py-2">
          {t('routesBookNow')}
        </button>
      </div>
    </div>
  );
}
