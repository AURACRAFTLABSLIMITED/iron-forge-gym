/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/payments/stripeProvider.js
 * Purpose: Production Stripe Checkout implementation of PaymentProvider using Firebase Secrets.
 */

import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';
import { PaymentProvider } from './paymentProvider.js';

// Stored securely in Firebase Secret Manager (never committed to source code).
// Set via: firebase functions:secrets:set STRIPE_SECRET_KEY
//          firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
export const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
export const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

function getStripeClient() {
  const key = stripeSecretKey.value() || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY secret is not configured.');
  }
  return new Stripe(key);
}

// CUSTOMIZE: Map your gym's display currency symbol to its 3-letter ISO currency code for Stripe.
export function resolveIsoCurrency(currencySymbol = 'Rs.') {
  const map = {
    $: 'usd',
    '£': 'gbp',
    '€': 'eur',
    'Rs.': 'pkr',
    PKR: 'pkr',
    '₹': 'inr',
    AED: 'aed',
  };
  return map[currencySymbol] || 'usd';
}

export class StripeProvider extends PaymentProvider {
  constructor() {
    super('stripe');
  }

  async createCheckout(order) {
    const stripe = getStripeClient();
    const currency = resolveIsoCurrency(order.currencySymbol);

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
        },
        // Stripe expects amounts in smallest currency unit (cents)
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.customerEmail || undefined,
      client_reference_id: order.orderId,
      line_items: lineItems,
      metadata: {
        orderId: order.orderId,
        userId: order.userId,
        orderType: order.orderType,
        packageId: order.packageId || '',
      },
      success_url: `${order.successUrl}?orderId=${encodeURIComponent(order.orderId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${order.cancelUrl}?orderId=${encodeURIComponent(order.orderId)}`,
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
    };
  }

  async verifyWebhook(request) {
    const stripe = getStripeClient();
    const webhookSecret = stripeWebhookSecret.value() || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET secret is not configured.');
    }

    const signature = request.headers['stripe-signature'];
    if (!signature) {
      throw new Error('Missing stripe-signature header.');
    }

    // Cloud Functions v2 provides request.rawBody Buffer needed by Stripe signature verification.
    // If you use request.body instead of request.rawBody, Stripe signature verification will fail.
    const event = stripe.webhooks.constructEvent(request.rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id || '';
      return {
        eventId: event.id,
        paid: session.payment_status === 'paid',
        orderId,
        providerRef: session.id,
      };
    }

    return {
      eventId: event.id,
      paid: false,
      orderId: '',
    };
  }
}
