/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/scheduled/expiryReminders.js
 * Purpose: Daily 8:00 AM scheduled function that finds active members whose plan expires
 *          in 3 days, queues a reminder email in `mail`, and sets `reminderSent: true`
 *          so no member receives duplicate reminders.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db, FieldValue, getClubBranding } from '../utils/firebaseAdmin.js';
import { addDaysToDate } from '../utils/validators.js';
import { buildExpiryReminderEmail } from '../emails/templates.js';

export const sendExpiryReminders = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'America/Los_Angeles',
    region: 'us-central1',
  },
  async () => {
    const targetDate = addDaysToDate(3, new Date());
    const snap = await db
      .collection('users')
      .where('membershipStatus', '==', 'active')
      .where('planExpiryDate', '==', targetDate)
      .get();

    if (snap.empty) {
      console.log(`No memberships expiring on ${targetDate}.`);
      return;
    }

    const branding = await getClubBranding();
    const batch = db.batch();
    let count = 0;

    for (const userDoc of snap.docs) {
      const user = userDoc.data();
      if (user.reminderSent === true || !user.email) continue;

      const mailRef = db.collection('mail').doc();
      batch.set(mailRef, {
        to: [user.email],
        message: buildExpiryReminderEmail({
          gymName: branding.gymName,
          accentColor: branding.accentColor,
          memberName: user.displayName,
          planName: user.planName,
          expiryDate: user.planExpiryDate,
          siteUrl: branding.siteUrl,
        }),
        createdAt: FieldValue.serverTimestamp(),
      });

      // Mark reminderSent = true so the next run never sends a duplicate email
      batch.update(userDoc.ref, {
        reminderSent: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      count += 1;
    }

    if (count > 0) {
      await batch.commit();
    }
    console.log(`Queued ${count} expiry reminder emails for ${targetDate}.`);
  }
);
