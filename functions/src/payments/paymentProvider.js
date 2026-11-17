/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/payments/paymentProvider.js
 * Purpose: Defines the pluggable PaymentProvider contract so each gym deployment can swap
 *          payment gateways (Stripe, JazzCash, Easypaisa, Safepay, PayFast, etc.) without
 *          changing checkout or webhook orchestration code.
 */

/**
 * Base payment provider interface.
 * Every custom provider module must implement `createCheckout(order)` and `verifyWebhook(request)`.
 * If you change method signatures here, update stripeProvider.js, customProvider.example.js,
 * createCheckoutSession.js, and paymentWebhook.js.
 */
export class PaymentProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Creates a hosted checkout session for a validated server-side order.
   * @param {object} order - Server-built order object including orderId, items, total, currency, urls.
   * @returns {Promise<{ sessionId: string, sessionUrl: string }>}
   */
  async createCheckout(order) {
    throw new Error(`[${this.name}] createCheckout(order) is not implemented.`);
  }

  /**
   * Verifies the incoming HTTP webhook signature and normalizes the paid event payload.
   * @param {import('firebase-functions/v2/https').Request} request
   * @returns {Promise<{ eventId: string, paid: boolean, orderId: string, providerRef?: string }>}
   */
  async verifyWebhook(request) {
    throw new Error(`[${this.name}] verifyWebhook(request) is not implemented.`);
  }
}
