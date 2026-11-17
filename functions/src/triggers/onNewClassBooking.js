/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/triggers/onNewClassBooking.js
 * Purpose: Transactional Firestore triggers that enforce class capacity atomically on
 *          booking creation and release the spot when a booking is cancelled.
 *          Prevents overbooking even if two members book the final spot at the exact same millisecond.
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { DATABASE_ID, db, FieldValue } from '../utils/firebaseAdmin.js';

export const onNewClassBooking = onDocumentCreated(
  {
    document: 'bookings/{bookingId}',
    database: DATABASE_ID,
    region: 'us-central1',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const booking = snap.data();
    if (booking.status !== 'confirmed' || !booking.classId) return;

    const classRef = db.collection('classes').doc(booking.classId);

    await db.runTransaction(async (tx) => {
      const classSnap = await tx.get(classRef);
      if (!classSnap.exists) {
        tx.update(snap.ref, {
          status: 'cancelled',
          cancellationReason: 'Class no longer exists',
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const cls = classSnap.data();
      const capacity = Math.max(1, Number(cls.capacity) || 20);
      const currentBooked = Math.max(0, Number(cls.bookedCount) || 0);

      // Atomic capacity gate: reject overbooking if full
      if (currentBooked >= capacity) {
        tx.update(snap.ref, {
          status: 'cancelled',
          cancellationReason: 'Class reached maximum capacity',
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      tx.update(classRef, {
        bookedCount: currentBooked + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }
);

export const onBookingCancelled = onDocumentUpdated(
  {
    document: 'bookings/{bookingId}',
    database: DATABASE_ID,
    region: 'us-central1',
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    // Only release capacity when transitioning from confirmed -> cancelled
    if (before.status === 'confirmed' && after.status === 'cancelled' && after.classId) {
      // Skip decrement if the cancellation was caused by our own capacity gate
      if (after.cancellationReason === 'Class reached maximum capacity') return;

      const classRef = db.collection('classes').doc(after.classId);
      await db.runTransaction(async (tx) => {
        const classSnap = await tx.get(classRef);
        if (!classSnap.exists) return;
        const currentBooked = Math.max(0, Number(classSnap.data()?.bookedCount) || 0);
        tx.update(classRef, {
          bookedCount: Math.max(0, currentBooked - 1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    }
  }
);
