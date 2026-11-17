/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/payments/providerFactory.js
 * Purpose: Resolves the active PaymentProvider configured in Firestore `settings/site`
 *          or environment configuration ("cash" | "stripe" | "custom").
 */

import { db } from '../utils/firebaseAdmin.js';
import { StripeProvider } from './stripeProvider.js';
import { SafepayProvider } from './safepayProvider.js';

/**
 * Returns the configured payment provider name and instance.
 */
export async function resolvePaymentProvider() {
  const settingsSnap = await db.doc('settings/site').get();
  const configured =
    (settingsSnap.exists && settingsSnap.data()?.paymentProvider) ||
    process.env.PAYMENT_PROVIDER ||
    'cash';

  if (configured === 'stripe') {
    return { mode: 'stripe', provider: new StripeProvider() };
  }
  if (configured === 'custom') {
    // "custom" = Safepay card gateway (Visa / Mastercard) for Pakistan.
    return { mode: 'custom', provider: new SafepayProvider() };
  }
  return { mode: 'cash', provider: null };
}
