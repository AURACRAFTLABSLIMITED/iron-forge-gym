/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/scheduled/expireMemberships.js
 * Purpose: Daily scheduled function that transitions active memberships past their
 *          planExpiryDate to membershipStatus: "expired".
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db, FieldValue } from '../utils/firebaseAdmin.js';
import { toIsoDate } from '../utils/validators.js';

export const expireMemberships = onSchedule(
  {
    schedule: '0 1 * * *',
    timeZone: 'America/Los_Angeles',
    region: 'us-central1',
  },
  async () => {
    const today = toIsoDate(new Date());
    const snap = await db
      .collection('users')
      .where('membershipStatus', '==', 'active')
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    let expiredCount = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data.planExpiryDate && data.planExpiryDate < today) {
        batch.update(docSnap.ref, {
          membershipStatus: 'expired',
          updatedAt: FieldValue.serverTimestamp(),
        });
        expiredCount += 1;
      }
    }

    if (expiredCount > 0) {
      await batch.commit();
    }
    console.log(`Marked ${expiredCount} memberships as expired (cutoff ${today}).`);
  }
);
