/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/payments/paymentWebhook.js
 * Purpose: HTTPS webhook endpoint that verifies payment gateway signatures, idempotently
 *          marks orders as "paid", activates/renews member packages, and sends receipt emails.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { db, FieldValue, getClubBranding } from '../utils/firebaseAdmin.js';
import { resolvePaymentProvider } from './providerFactory.js';
import { stripeSecretKey, stripeWebhookSecret } from './stripeProvider.js';
import { safepayApiKey, safepayV1Secret, safepayWebhookSecret } from './safepayProvider.js';
import { addDaysToDate, toIsoDate } from '../utils/validators.js';
import { buildOrderPaidEmail } from '../emails/templates.js';

export const paymentWebhook = onRequest(
  {
    region: 'us-central1',
    secrets: [
      stripeSecretKey,
      stripeWebhookSecret,
      safepayApiKey,
      safepayV1Secret,
      safepayWebhookSecret,
    ],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { provider } = await resolvePaymentProvider();
      if (!provider) {
        res.status(400).json({ error: 'Online payment provider is not enabled.' });
        return;
      }

      const event = await provider.verifyWebhook(req);
      if (!event.paid || !event.orderId) {
        res.status(200).json({ received: true, ignored: true });
        return;
      }

      const orderRef = db.collection('orders').doc(event.orderId);
      const eventRef = db.collection('webhookEvents').doc(event.eventId || event.orderId);

      // Transaction guarantees strict idempotency: duplicate webhooks cannot double-activate
      // a membership or decrement product stock twice.
      const outcome = await db.runTransaction(async (tx) => {
        const [eventSnap, orderSnap] = await Promise.all([tx.get(eventRef), tx.get(orderRef)]);

        if (eventSnap.exists) {
          return { duplicate: true };
        }
        if (!orderSnap.exists) {
          return { notFound: true };
        }

        const order = orderSnap.data();
        if (order.paymentStatus === 'paid') {
          tx.set(eventRef, {
            orderId: orderRef.id,
            processedAt: FieldValue.serverTimestamp(),
            note: 'Already paid',
          });
          return { duplicate: true };
        }

        const nextStatus = order.orderType === 'membership' ? 'completed' : 'processing';

        tx.update(orderRef, {
          paymentStatus: 'paid',
          status: nextStatus,
          providerRef: event.providerRef || '',
          paidAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // If membership checkout, activate or extend the member's active package
        if (order.orderType === 'membership' && order.userId) {
          const userRef = db.collection('users').doc(order.userId);
          const userSnap = await tx.get(userRef);
          const today = toIsoDate(new Date());
          let baseDate = new Date();

          // If member still has active days left, extend from their current expiry date
          if (userSnap.exists) {
            const existingExpiry = userSnap.data()?.planExpiryDate;
            if (existingExpiry && existingExpiry > today) {
              baseDate = new Date(`${existingExpiry}T00:00:00Z`);
            }
          }

          const newExpiry = addDaysToDate(order.packageDurationDays || 30, baseDate);
          tx.set(
            userRef,
            {
              planId: order.packageId || '',
              planName: order.packageName || order.items?.[0]?.name || 'Club Membership',
              planStartDate: today,
              planExpiryDate: newExpiry,
              membershipStatus: 'active',
              reminderSent: false,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        tx.set(eventRef, {
          orderId: orderRef.id,
          processedAt: FieldValue.serverTimestamp(),
        });

        return { duplicate: false, order };
      });

      if (outcome.duplicate) {
        res.status(200).json({ received: true, duplicate: true });
        return;
      }
      if (outcome.notFound) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      // Queue confirmation email via Firebase "Trigger Email from Firestore" extension
      const order = outcome.order;
      if (order?.customerEmail) {
        const branding = await getClubBranding();
        const emailContent = buildOrderPaidEmail({
          gymName: branding.gymName,
          accentColor: branding.accentColor,
          customerName: order.customerName,
          orderId: event.orderId,
          total: order.total,
          currencySymbol: branding.currencySymbol,
          orderType: order.orderType,
        });
        await db.collection('mail').add({
          to: [order.customerEmail],
          message: emailContent,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      res.status(200).json({ received: true, orderId: event.orderId });
    } catch (err) {
      console.error('Webhook verification/processing error:', err);
      res.status(400).json({ error: err instanceof Error ? err.message : 'Webhook failed.' });
    }
  }
);
