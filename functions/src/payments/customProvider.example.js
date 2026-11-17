/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/payments/customProvider.example.js
 * Purpose: Starter template showing how to plug in any regional or local payment gateway
 *          (e.g., JazzCash, Easypaisa, Safepay, PayFast, Razorpay, Paystack) when Stripe
 *          is not available in a gym client's country.
 *
 * HOW TO USE THIS TEMPLATE:
 * 1. Copy this file to `functions/src/payments/customProvider.js` (or edit directly).
 * 2. Define any required API secret keys using `defineSecret('CUSTOM_GATEWAY_SECRET')`.
 * 3. Implement `createCheckout(order)` to call your gateway's checkout/token API and return `{ sessionId, sessionUrl }`.
 * 4. Implement `verifyWebhook(request)` to verify the gateway's HMAC/RSA callback signature and return `{ eventId, paid, orderId }`.
 * 5. Update `providerFactory.js` to return `new CustomProvider()` when `paymentProvider === 'custom'`.
 */

import crypto from 'node:crypto';
import { defineSecret } from 'firebase-functions/params';
import { PaymentProvider } from './paymentProvider.js';

// CUSTOMIZE: Define your gateway's secret key in Firebase Secret Manager:
//   firebase functions:secrets:set CUSTOM_GATEWAY_SECRET
export const customGatewaySecret = defineSecret('CUSTOM_GATEWAY_SECRET');

export class CustomProviderExample extends PaymentProvider {
  constructor() {
    super('custom');
  }

  /**
   * Step 1: Create a hosted payment session with your regional gateway.
   * Example gateways:
   *  - JazzCash / Easypaisa: generate secure integrity hash (HMAC-SHA256) and return redirect URL.
   *  - Safepay / PayFast: POST order total + reference to tracker endpoint, return hosted URL.
   */
  async createCheckout(order) {
    // CUSTOMIZE: Replace with your real gateway API call
    const secret = customGatewaySecret.value() || process.env.CUSTOM_GATEWAY_SECRET || '';
    if (!secret) {
      throw new Error(
        'Custom payment provider is selected, but CUSTOM_GATEWAY_SECRET is not configured yet.'
      );
    }

    // Example signature payload (adapt fields to your gateway documentation)
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${order.orderId}:${order.total}`)
      .digest('hex');

    // CUSTOMIZE: Replace with the gateway's real hosted payment page URL
    const gatewayCheckoutUrl = `https://your-gateway-checkout.example/pay?ref=${encodeURIComponent(
      order.orderId
    )}&amount=${order.total}&sig=${signature}&success=${encodeURIComponent(
      `${order.successUrl}?orderId=${order.orderId}`
    )}&cancel=${encodeURIComponent(`${order.cancelUrl}?orderId=${order.orderId}`)}`;

    return {
      sessionId: `custom_${order.orderId}`,
      sessionUrl: gatewayCheckoutUrl,
    };
  }

  /**
   * Step 2: Verify the incoming IPN/webhook callback from your gateway.
   * Always verify HMAC/RSA signatures using a constant-time comparison before returning `paid: true`.
   */
  async verifyWebhook(request) {
    const secret = customGatewaySecret.value() || process.env.CUSTOM_GATEWAY_SECRET || '';
    const payload = request.body || {};
    const receivedSig = String(request.headers['x-gateway-signature'] || payload.signature || '');

    // CUSTOMIZE: Match your gateway's exact signature formula
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${payload.orderId || ''}:${payload.status || ''}`)
      .digest('hex');

    const isValid =
      receivedSig.length === expectedSig.length &&
      crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));

    if (!isValid) {
      throw new Error('Invalid custom gateway webhook signature.');
    }

    return {
      eventId: String(payload.transactionId || payload.eventId || payload.orderId),
      paid: payload.status === 'PAID' || payload.status === 'SUCCESS',
      orderId: String(payload.orderId || ''),
      providerRef: String(payload.transactionId || ''),
    };
  }
}
