/**
 * File: functions/src/payments/safepayProvider.js
 * Purpose: Safepay (Pakistan) hosted card checkout (Visa / Mastercard) implementing the
 *          PaymentProvider contract. Uses the official `@sfpy/node-sdk` package.
 *
 * Secrets (Firebase Secret Manager):
 *   firebase functions:secrets:set SAFEPAY_API_KEY          (merchant secret key, starts with sec_)
 *   firebase functions:secrets:set SAFEPAY_V1_SECRET        (v1 secret from Safepay dashboard)
 *   firebase functions:secrets:set SAFEPAY_WEBHOOK_SECRET   (webhook shared secret)
 * Optional env (functions/.env):
 *   SAFEPAY_ENV=sandbox | production      (default: sandbox)
 *   SAFEPAY_AMOUNT_MULTIPLIER=1           (set to 100 only if Safepay shows amounts 100x too small)
 *
 * SAFETY: an order is only marked paid when (1) the SDK verifies Safepay's webhook signature,
 * (2) the payload contains a tracker that matches one of OUR orders, and (3) the payload state
 * is PAID. Anything unrecognised is ignored and logged, never treated as paid.
 */

import * as sdk from '@sfpy/node-sdk';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { PaymentProvider } from './paymentProvider.js';
import { db } from '../utils/firebaseAdmin.js';

export const safepayApiKey = defineSecret('SAFEPAY_API_KEY');
export const safepayV1Secret = defineSecret('SAFEPAY_V1_SECRET');
export const safepayWebhookSecret = defineSecret('SAFEPAY_WEBHOOK_SECRET');

function getClient() {
  const Safepay = sdk.Safepay || (sdk.default && sdk.default.Safepay) || sdk.default;
  if (typeof Safepay !== 'function') {
    throw new Error('The @sfpy/node-sdk package could not be loaded. Run "npm install" in functions/.');
  }
  const apiKey = safepayApiKey.value() || process.env.SAFEPAY_API_KEY;
  const v1Secret = safepayV1Secret.value() || process.env.SAFEPAY_V1_SECRET;
  const webhookSecret = safepayWebhookSecret.value() || process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!apiKey || !v1Secret || !webhookSecret) {
    throw new Error(
      'SAFEPAY_API_KEY / SAFEPAY_V1_SECRET / SAFEPAY_WEBHOOK_SECRET is not configured.'
    );
  }
  return new Safepay({
    environment: process.env.SAFEPAY_ENV === 'production' ? 'production' : 'sandbox',
    apiKey,
    v1Secret,
    webhookSecret,
  });
}

/** Maps the gym's currency symbol to a currency Safepay supports. */
export function resolveSafepayCurrency(currencySymbol = 'Rs.') {
  const map = { 'Rs.': 'PKR', PKR: 'PKR', $: 'USD', USD: 'USD' };
  const currency = map[currencySymbol];
  if (!currency) {
    throw new Error(`Currency "${currencySymbol}" is not supported by Safepay (use PKR or USD).`);
  }
  return currency;
}

/** Walks any JSON payload, collecting every string value and every state/status value. */
function scanPayload(node, out = { strings: [], states: [], orderIds: [] }, depth = 0) {
  if (depth > 8 || node == null) return out;
  if (typeof node === 'string') {
    out.strings.push(node);
  } else if (Array.isArray(node)) {
    node.forEach((n) => scanPayload(n, out, depth + 1));
  } else if (typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string') {
        const k = key.toLowerCase();
        if (k === 'state' || k === 'status') out.states.push(value.toUpperCase());
        if (k === 'order_id' || k === 'orderid') out.orderIds.push(value);
      }
      scanPayload(value, out, depth + 1);
    }
  }
  return out;
}

export class SafepayProvider extends PaymentProvider {
  constructor() {
    super('safepay');
  }

  async createCheckout(order) {
    const safepay = getClient();
    const currency = resolveSafepayCurrency(order.currencySymbol);
    const multiplier = Number(process.env.SAFEPAY_AMOUNT_MULTIPLIER) || 1;
    const amount = Math.round(Number(order.total) * multiplier * 100) / 100;

    const created = await safepay.payments.create({ amount, currency });
    const token = created?.token || created?.data?.token;
    if (!token) {
      throw new Error('Safepay did not return a payment token.');
    }

    const orderParam = encodeURIComponent(order.orderId);
    const url = await safepay.checkout.create({
      token,
      orderId: order.orderId,
      cancelUrl: `${order.cancelUrl}?orderId=${orderParam}`,
      redirectUrl: `${order.successUrl}?orderId=${orderParam}`,
      source: 'custom',
      webhooks: true,
    });

    return { sessionId: token, sessionUrl: url };
  }

  async verifyWebhook(request) {
    const safepay = getClient();

    let valid = false;
    try {
      valid = await safepay.verify.webhook(request);
    } catch (err) {
      logger.warn('Safepay webhook verification threw', err);
    }
    if (!valid) {
      throw new Error('Invalid Safepay webhook signature.');
    }

    const body = request.body || {};
    const scan = scanPayload(body);

    // 1) Find OUR order via the tracker token we stored as providerSessionId at checkout.
    let orderId = '';
    let tracker = '';
    for (const candidate of new Set(scan.strings.filter((s) => s.startsWith('track_')))) {
      const snap = await db
        .collection('orders')
        .where('providerSessionId', '==', candidate)
        .limit(1)
        .get();
      if (!snap.empty) {
        orderId = snap.docs[0].id;
        tracker = candidate;
        break;
      }
    }
    // 2) Fallback: an order_id field in the payload that points at an existing order.
    if (!orderId) {
      for (const candidate of scan.orderIds) {
        const doc = await db.collection('orders').doc(String(candidate)).get();
        if (doc.exists) {
          orderId = doc.id;
          tracker = String(doc.data()?.providerSessionId || '');
          break;
        }
      }
    }

    const paid = scan.states.includes('PAID');
    if (!orderId || !paid) {
      logger.info('Safepay webhook ignored (no matching order or not PAID)', {
        matchedOrder: Boolean(orderId),
        states: scan.states,
        payload: JSON.stringify(body).slice(0, 1500),
      });
    }

    return {
      eventId: `safepay_${tracker || orderId || 'unknown'}_${paid ? 'paid' : 'other'}`,
      paid: Boolean(orderId && paid),
      orderId,
      providerRef: tracker,
    };
  }
}
