import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

/**
 * Handles the redirect back from the Flutterwave hosted payment page.
 *
 * Flutterwave appends these query params on redirect:
 *   ?status=successful|cancelled|failed|pending&tx_ref=...&transaction_id=...
 *
 * States:
 *   verifying  — calling our /api/payments/verify endpoint
 *   pending    — async payment method; webhook will confirm server-side
 *   cancelled  — user cancelled at Flutterwave; booking stays PENDING
 *   failed     — verification call returned a failure; webhook may still confirm
 */
export default function PaymentCallbackPage() {
  const { t }              = useLanguage();
  const [searchParams]     = useSearchParams();
  const navigate           = useNavigate();
  const [uiState, setUiState] = useState('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const txRef     = searchParams.get('tx_ref');
    const flwStatus = searchParams.get('status');

    if (!txRef) {
      setErrorMsg(t('paymentCallbackNoRef'));
      setUiState('failed');
      return;
    }

    if (flwStatus === 'cancelled') {
      setUiState('cancelled');
      return;
    }

    if (flwStatus === 'pending') {
      // Async payment method (e.g. bank transfer) — webhook will confirm
      setUiState('pending');
      return;
    }

    // For 'successful', 'failed', or any unknown status: verify server-side.
    // Even on 'failed' redirect, try verifying — the webhook may have already confirmed it.
    bookingService.verifyPayment(txRef)
      .then((res) => {
        navigate('/passenger/booking-confirm', {
          state:   { booking: res.data.booking, payment: res.data.payment },
          replace: true,
        });
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.message || t('paymentCallbackError'));
        setUiState('failed');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (uiState === 'verifying') {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('paymentCallbackVerifying')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
          {t('paymentCallbackVerifyingText')}
        </p>
      </div>
    );
  }

  if (uiState === 'pending') {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-5xl mb-4">🕐</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('paymentCallbackPending')}
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">
          {t('paymentCallbackPendingText')}
        </p>
        <Link to="/passenger/bookings" className="btn-gradient">
          {t('paymentCallbackCheckBookings')}
        </Link>
      </div>
    );
  }

  if (uiState === 'cancelled') {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-5xl mb-4">↩️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('paymentCallbackCancelled')}
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">
          {t('paymentCallbackCancelledText')}
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/passenger/bookings" className="btn-gradient">
            {t('paymentCallbackCheckBookings')}
          </Link>
          <Link to="/" className="btn-secondary">
            {t('paymentSearchTrips')}
          </Link>
        </div>
      </div>
    );
  }

  // failed state
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {t('paymentCallbackFailed')}
      </h2>
      <p className="text-gray-500 dark:text-slate-400 mb-2">
        {errorMsg || t('paymentCallbackFailedText')}
      </p>
      <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">
        {t('paymentCallbackFailedHint')}
      </p>
      <div className="flex flex-col gap-3">
        <Link to="/passenger/bookings" className="btn-gradient">
          {t('paymentCallbackCheckBookings')}
        </Link>
        <Link to="/" className="btn-secondary">
          {t('paymentSearchTrips')}
        </Link>
      </div>
    </div>
  );
}
