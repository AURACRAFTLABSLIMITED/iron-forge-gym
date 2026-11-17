/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/payments/createCheckoutSession.js
 * Purpose: Callable Cloud Function v2 that creates a verified order in Firestore and returns
 *          an online checkout session URL. NEVER trusts prices or totals sent from the browser.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db, FieldValue, getClubBranding } from '../utils/firebaseAdmin.js';
import { resolvePaymentProvider } from './providerFactory.js';
import { stripeSecretKey } from './stripeProvider.js';
import { safepayApiKey, safepayV1Secret, safepayWebhookSecret } from './safepayProvider.js';
import { isNonEmptyString, isValidPositiveInt, isValidUrl } from '../utils/validators.js';

export const createCheckoutSession = onCall(
  {
    region: 'us-central1',
    // Include secrets so StripeProvider can read STRIPE_SECRET_KEY at runtime.
    secrets: [stripeSecretKey, safepayApiKey, safepayV1Secret, safepayWebhookSecret],
  },
  async (request) => {
    try {
      return await runCheckout(request);
    } catch (err) {
      // Known, user-safe errors pass straight through.
      if (err instanceof HttpsError) throw err;
      // Anything else would reach the browser as a useless "internal" error. Log the real
      // cause (Firebase Console -> Functions -> Logs) and return a readable message instead.
      logger.error('createCheckoutSession failed', err);
      throw new HttpsError('failed-precondition', friendlyCheckoutError(err));
    }
  }
);

/** Turns an unexpected server error into a short, secret-free message for the UI. */
function friendlyCheckoutError(err) {
  const raw = String((err && err.message) || err || 'Unknown error');
  const safe = raw.replace(/\b(sk|rk|pk|whsec)_[A-Za-z0-9_]+/g, '[hidden]').slice(0, 240);
  if (/SECRET(_KEY)?\b.*(not configured|not set)|is not configured/i.test(raw)) {
    return 'Online card payment is not set up yet (the payment gateway key is missing on the server). Please use Pay at Gym, or ask the gym owner to finish payment setup.';
  }
  if (/NOT_FOUND|database .* does not exist/i.test(raw)) {
    return 'The server could not find the Firestore database. Check FIRESTORE_DATABASE_ID in functions/.env and redeploy functions.';
  }
  if (/PERMISSION_DENIED/i.test(raw)) {
    return 'The server does not have permission to read/write Firestore. Check the Cloud Functions service account permissions.';
  }
  if (/Invalid API Key|api_key|authentication/i.test(raw)) {
    return 'The payment gateway rejected the server API key. Re-set the secret key and redeploy functions.';
  }
  return `Online checkout could not start: ${safe}`;
}

async function runCheckout(request) {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to start online checkout.');
    }

    const { mode, provider } = await resolvePaymentProvider();
    if (mode === 'cash' || !provider) {
      throw new HttpsError(
        'failed-precondition',
        'Online payments are disabled (paymentProvider is set to "cash"). Use Pay at Gym instead.'
      );
    }

    const data = request.data || {};
    const orderType = data.orderType === 'membership' ? 'membership' : 'shop';

    if (!isNonEmptyString(data.customerName, 120) || !isNonEmptyString(data.customerEmail, 254)) {
      throw new HttpsError('invalid-argument', 'Valid customer name and email are required.');
    }
    if (!isValidUrl(data.successUrl) || !isValidUrl(data.cancelUrl)) {
      throw new HttpsError('invalid-argument', 'Valid successUrl and cancelUrl are required.');
    }

    const branding = await getClubBranding();
    let verifiedItems = [];
    let authoritativeTotal = 0;
    let packageId = '';
    let packageDurationDays = 0;
    let packageName = '';

    if (orderType === 'membership') {
      if (!isNonEmptyString(data.packageId, 128)) {
        throw new HttpsError('invalid-argument', 'packageId is required for membership checkout.');
      }
      const pkgSnap = await db.collection('packages').doc(data.packageId).get();
      if (!pkgSnap.exists) {
        throw new HttpsError('not-found', 'Selected membership package does not exist.');
      }
      const pkg = pkgSnap.data();
      const price = Number(pkg.price) || 0;
      if (price <= 0) {
        throw new HttpsError('failed-precondition', 'Package price must be greater than zero.');
      }

      packageId = pkgSnap.id;
      packageDurationDays = Math.max(1, Number(pkg.durationDays) || 30);
      packageName = pkg.name;
      authoritativeTotal = price;
      verifiedItems = [
        {
          id: pkgSnap.id,
          name: `${pkg.name} (${pkg.billingCycle})`,
          price,
          quantity: 1,
        },
      ];
    } else {
      // Shop checkout: client sends ONLY { id, quantity } per item; prices come from Firestore.
      if (!Array.isArray(data.items) || data.items.length === 0 || data.items.length > 30) {
        throw new HttpsError('invalid-argument', 'Cart must contain between 1 and 30 items.');
      }

      for (const reqItem of data.items) {
        if (!isNonEmptyString(reqItem?.id, 128) || !isValidPositiveInt(reqItem?.quantity, 50)) {
          throw new HttpsError('invalid-argument', 'Each cart item must have a valid id and quantity.');
        }
        const prodSnap = await db.collection('products').doc(reqItem.id).get();
        if (!prodSnap.exists) {
          throw new HttpsError('not-found', `Product ${reqItem.id} no longer exists.`);
        }
        const prod = prodSnap.data();
        const stock = Number(prod.stock) || 0;
        if (stock < reqItem.quantity) {
          throw new HttpsError('failed-precondition', `Insufficient stock for ${prod.name}.`);
        }
        const unitPrice = Number(prod.price) || 0;
        authoritativeTotal += unitPrice * reqItem.quantity;
        verifiedItems.push({
          id: prodSnap.id,
          name: prod.name,
          price: unitPrice,
          quantity: reqItem.quantity,
        });
      }
    }

    authoritativeTotal = Math.round(authoritativeTotal * 100) / 100;

    // Create authoritative pending order via Admin SDK before redirecting to payment gateway
    const orderRef = db.collection('orders').doc();
    await orderRef.set({
      userId: request.auth.uid,
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.trim(),
      customerPhone: isNonEmptyString(data.customerPhone, 40) ? data.customerPhone.trim() : 'On file',
      shippingAddress: isNonEmptyString(data.shippingAddress, 400)
        ? data.shippingAddress.trim()
        : 'Front Desk Club Pickup',
      items: verifiedItems,
      total: authoritativeTotal,
      paymentMethod: `Online (${mode})`,
      paymentProvider: mode,
      paymentStatus: 'unpaid',
      orderType,
      packageId,
      packageName,
      packageDurationDays,
      status: 'pending',
      notes: isNonEmptyString(data.notes, 500) ? data.notes.trim() : '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    let session;
    try {
    session = await provider.createCheckout({
      orderId: orderRef.id,
      userId: request.auth.uid,
      customerEmail: data.customerEmail.trim(),
      items: verifiedItems,
      total: authoritativeTotal,
      currencySymbol: branding.currencySymbol,
      orderType,
      packageId,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
    });
    } catch (gatewayErr) {
      // Don't leave a dangling unpaid order behind when the gateway call fails.
      await orderRef.delete().catch(() => {});
      throw gatewayErr;
    }

    await orderRef.update({
      providerSessionId: session.sessionId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      orderId: orderRef.id,
      sessionId: session.sessionId,
      sessionUrl: session.sessionUrl,
    };
}
