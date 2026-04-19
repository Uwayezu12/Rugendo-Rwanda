import axios from 'axios';
import { env } from '../config/env.js';

// Axios instance bound to the configured Flutterwave base URL.
// All requests carry the secret key as a Bearer token.
const flwClient = axios.create({
  baseURL: env.flwBaseUrl,
  headers: {
    Authorization: `Bearer ${env.flwSecretKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Initiate a Flutterwave Standard hosted-redirect payment.
 *
 * @param {object} params
 * @param {string} params.txRef        - Our unique transaction reference.
 * @param {number} params.amount       - Amount as a JS number (explicit Number() cast from Prisma Decimal).
 * @param {string} params.currency     - Currency code, e.g. "RWF".
 * @param {string} params.redirectUrl  - URL FLW redirects to after payment.
 * @param {object} params.customer     - { email, name, phone_number? }
 * @param {object} [params.customizations] - { title, description, logo? }
 * @param {object} [params.meta]       - Arbitrary key-value metadata.
 *
 * Returns the full FLW response. On success: response.data.link is the hosted checkout URL.
 */
export async function initializePayment({ txRef, amount, currency, redirectUrl, customer, customizations, meta }) {
  const { data } = await flwClient.post('/v3/payments', {
    tx_ref:       txRef,
    amount,
    currency,
    redirect_url: redirectUrl,
    customer,
    customizations,
    meta,
  });
  return data;
}

/**
 * Verify a transaction by our tx_ref using the Flutterwave server-side API.
 * This is the trusted source of truth — do not confirm payments using only webhook payloads.
 *
 * @param {string} txRef - The tx_ref we generated when initializing payment.
 * Returns the full FLW response. Trusted data is in response.data.
 */
export async function verifyTransactionByRef(txRef) {
  const { data } = await flwClient.get('/v3/transactions/verify_by_reference', {
    params: { tx_ref: txRef },
  });
  return data;
}
