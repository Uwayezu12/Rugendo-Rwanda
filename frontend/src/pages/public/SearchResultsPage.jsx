import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(durationMin) {
  if (!durationMin) return null;
  const h = Math.floor(durationMin / 60);
  const m = durationMin % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function ScheduleCard({ schedule }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isFull = schedule.seatsAvailable === 0;
  const departure = formatTime(schedule.departureTime);
  const arrival   = formatTime(schedule.arrivalTime);
  const duration  = formatDuration(schedule.route?.durationMin);
  const price     = parseFloat(schedule.price);

  function handleSelect() {
    navigate(`/passenger/book?scheduleId=${schedule.id}`);
  }

  const seatsLabel = schedule.seatsAvailable === 1
    ? t('searchResultsSeatsLeft', { n: schedule.seatsAvailable })
    : t('searchResultsSeatsLeftPlural', { n: schedule.seatsAvailable });

  return (
    <div className={`card flex flex-col sm:flex-row sm:items-center gap-4 ${isFull ? 'opacity-60' : ''}`}>
      <div className="sm:w-44 shrink-0">
        <p className="font-semibold text-gray-900 dark:text-white">{schedule.company?.name}</p>
        {schedule.bus?.model && (
          <span className="badge-brand text-xs">{schedule.bus.model}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-1">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-white">{departure}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">{schedule.route?.origin}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          {duration && (
            <p className="text-xs text-gray-400 dark:text-slate-500">{duration}</p>
          )}
          <div className="w-full h-px bg-[#e8e3ff] dark:bg-[#2d1a5e] relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-600" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-white">{arrival}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">{schedule.route?.destination}</p>
        </div>
      </div>

      <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
        <div>
          <p className="text-xl font-bold text-brand-600 dark:text-brand-400">
            RWF {price.toLocaleString()}
          </p>
          <p className={`text-xs mt-0.5 ${isFull ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}>
            {isFull ? t('searchResultsSoldOut') : seatsLabel}
          </p>
        </div>
        {isFull ? (
          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{t('searchResultsUnavailable')}</span>
        ) : (
          <button onClick={handleSelect} className="btn-primary text-sm px-4 py-2">
            {t('searchResultsSelect')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const from       = searchParams.get('from') || '';
  const to         = searchParams.get('to') || '';
  const date       = searchParams.get('date') || todayLocal();
  const passengers = searchParams.get('passengers') || '1';

  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [sortBy,   setSortBy]   = useState('departure');

  const fetchSchedules = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.searchSchedules({
        from,
        to,
        date,
        seats: parseInt(passengers, 10) || 1,
      });
      setResults(res.data || []);
    } catch (err) {
      const errData = err?.response?.data;
      const msg = errData?.errors
        ? Object.values(errData.errors).flat().join('. ')
        : errData?.message || 'Failed to load schedules. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [from, to, date, passengers]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'price')     return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === 'departure') return new Date(a.departureTime) - new Date(b.departureTime);
    return 0;
  });

  const tripsLabel = sorted.length === 1
    ? t('searchResultsTripFound')
    : t('searchResultsTripsFound', { n: sorted.length });

  return (
    <div>
      <div className="bg-[#f8f7ff] dark:bg-[#130d2e] border-b border-[#e8e3ff] dark:border-[#2d1a5e] py-5">
        <div className="container-page flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            {from && to ? (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {from} <span className="text-accent-500">→</span> {to}
                {date && <span className="text-sm font-normal text-gray-400 dark:text-slate-500 ml-2">{date}</span>}
                {parseInt(passengers) > 1 && (
                  <span className="text-sm font-normal text-gray-400 dark:text-slate-500 ml-1">
                    · {t('searchResultsPassengers', { n: passengers })}
                  </span>
                )}
              </h1>
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('searchResultsResults')}</h1>
            )}
            {!loading && !error && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{tripsLabel}</p>
            )}
          </div>
          <Link
            to={`/search-trips?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&passengers=${encodeURIComponent(passengers)}`}
            className="btn-secondary text-sm"
          >
            {t('searchResultsModifySearch')}
          </Link>
        </div>
      </div>

      <div className="container-page py-8">
        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-slate-400">{t('searchResultsSearching')}</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('searchResultsError')}</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">{error}</p>
            <button onClick={fetchSchedules} className="btn-gradient">{t('searchResultsTryAgain')}</button>
          </div>
        )}

        {!loading && !error && (!from || !to) && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('searchResultsEnterSearch')}</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">{t('searchResultsChooseOriginDest')}</p>
            <Link to="/search-trips" className="btn-gradient">{t('navSearchTrips')}</Link>
          </div>
        )}

        {!loading && !error && from && to && (
          <>
            {sorted.length > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm text-gray-500 dark:text-slate-400">{t('searchResultsSortBy')}</span>
                {['departure', 'price'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      sortBy === opt
                        ? 'bg-brand-600 text-white'
                        : 'bg-[#f8f7ff] dark:bg-[#1a1035] text-gray-600 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-950'
                    }`}
                  >
                    {opt === 'departure' ? t('searchResultsSortDeparture') : t('searchResultsSortPrice')}
                  </button>
                ))}
              </div>
            )}

            {sorted.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🚌</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('searchResultsNoTrips')}</h2>
                <p className="text-gray-500 dark:text-slate-400 mb-6">
                  {t('searchResultsNoTripsDesc', { date })}
                </p>
                <Link to="/search-trips" className="btn-gradient">{t('searchResultsSearchAgain')}</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sorted.map((s) => (
                  <ScheduleCard key={s.id} schedule={s} />
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-slate-600 mt-8 text-center">
              {t('searchResultsPriceNote')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
