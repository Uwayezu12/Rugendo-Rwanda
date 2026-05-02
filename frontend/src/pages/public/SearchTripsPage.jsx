import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export default function SearchTripsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    from:       searchParams.get('from')       || '',
    to:         searchParams.get('to')         || '',
    date:       searchParams.get('date')       || todayLocal(),
    passengers: searchParams.get('passengers') || '1',
  });
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    let ignore = false;

    api.get('/routes?scope=public')
      .then(({ data: res }) => {
        if (!ignore) setRoutes(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!ignore) setRoutes([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const fromOptions = useMemo(
    () => uniqueSorted(routes.map((route) => route.origin)),
    [routes],
  );

  const toOptions = useMemo(() => {
    const matchingRoutes = form.from
      ? routes.filter((route) => route.origin === form.from)
      : routes;

    return uniqueSorted(
      matchingRoutes
        .map((route) => route.destination)
        .filter((destination) => destination !== form.from),
    );
  }, [form.from, routes]);

  useEffect(() => {
    if (routes.length > 0 && form.to && !toOptions.includes(form.to)) {
      setForm((current) => ({ ...current, to: '' }));
    }
  }, [form.to, routes.length, toOptions]);

  const visibleFromOptions = useMemo(
    () => (form.from && !fromOptions.includes(form.from) ? [form.from, ...fromOptions] : fromOptions),
    [form.from, fromOptions],
  );

  const visibleToOptions = useMemo(
    () => (form.to && !toOptions.includes(form.to) ? [form.to, ...toOptions] : toOptions),
    [form.to, toOptions],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => {
      if (name === 'from') {
        const nextToOptions = uniqueSorted(
          routes
            .filter((route) => !value || route.origin === value)
            .map((route) => route.destination)
            .filter((destination) => destination !== value),
        );

        return {
          ...current,
          from: value,
          to: nextToOptions.includes(current.to) ? current.to : '',
        };
      }

      return { ...current, [name]: value };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const date = form.date || todayLocal();
    const params = new URLSearchParams({ ...form, date }).toString();
    navigate(`/search?${params}`);
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-[#f0f7ff] via-[#eff6ff] to-[#f0fdf4] text-gray-900 dark:bg-hero-gradient dark:text-white py-20">
        <div className="container-page text-center">
          <span className="badge-accent mb-4">{t('searchTripsBadge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('searchTripsTitle')}</h1>
          <p className="text-gray-600 dark:text-slate-300 text-lg max-w-xl mx-auto">{t('searchTripsSubtitle')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#112040] rounded-2xl shadow-brand border border-[#dbeafe] dark:border-[#1e3a5f] p-8"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('searchTripsWhereGoing')}</h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label">{t('from')}</label>
                <select
                  name="from"
                  value={form.from}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">{t('searchTripsFromPlaceholder')}</option>
                  {visibleFromOptions.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{t('to')}</label>
                <select
                  name="to"
                  value={form.to}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">{t('searchTripsToPlaceholder')}</option>
                  {visibleToOptions.map((destination) => (
                    <option key={destination} value={destination}>
                      {destination}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{t('searchTripsTravelDate')}</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  min={todayLocal()}
                  className="input"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('searchTripsDateHint')}</p>
              </div>

              <div>
                <label className="label">{t('passengers')}</label>
                <select
                  name="passengers"
                  value={form.passengers}
                  onChange={handleChange}
                  className="input"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? t('homePassengerN', { n }) : t('homePassengersN', { n })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
              <Link to="/routes" className="btn-secondary text-center">
                {t('searchTripsBrowseRoutes')}
              </Link>
              <button type="submit" className="btn-green px-10">
                {t('searchTripsSearchBtn')}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">
              {t('searchTripsPopularRoutes')}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { from: 'NYABUGOGO', to: 'MUSANZE'   },
                { from: 'NYABUGOGO', to: 'NYAGATARE' },
                { from: 'NYABUGOGO', to: 'GICUMBI'   },
                { from: 'NYABUGOGO', to: 'GATUNA'    },
                { from: 'MUSANZE',   to: 'RUBAVU'    },
                { from: 'GICUMBI',   to: 'MUSANZE'   },
              ].map((r) => (
                <button
                  key={`${r.from}-${r.to}`}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, from: r.from, to: r.to }))}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#dbeafe] dark:border-[#1e3a5f]
                             bg-[#f0f7ff] dark:bg-[#0d1f3c] text-gray-600 dark:text-slate-300
                             hover:bg-brand-50 dark:hover:bg-brand-950 hover:border-brand-400 transition-colors"
                >
                  {r.from} → {r.to}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
