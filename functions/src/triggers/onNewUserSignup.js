/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/triggers/onNewUserSignup.js
 * Purpose: Firestore trigger on new member profile creation (`users/{userId}`).
 *          Guarantees default `role: "member"` (both in Firestore and Auth custom claims if
 *          not already set) and queues a branded welcome email via `mail`.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import {
  adminAuth,
  DATABASE_ID,
  db,
  FieldValue,
  getClubBranding,
} from '../utils/firebaseAdmin.js';
import { buildWelcomeEmail } from '../emails/templates.js';

export const onNewUserSignup = onDocumentCreated(
  {
    document: 'users/{userId}',
    database: DATABASE_ID,
    region: 'us-central1',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const userId = event.params.userId;
    const data = snap.data();

    // Ensure profile has default role "member" without overwriting existing admin role
    const updates = {};
    if (!data.role) {
      updates.role = 'member';
    }
    if (Object.keys(updates).length > 0) {
      await snap.ref.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Also ensure Firebase Auth custom claim defaults to "member" if unset
    try {
      const authUser = await adminAuth.getUser(userId);
      if (!authUser.customClaims?.role) {
        await adminAuth.setCustomUserClaims(userId, { role: 'member' });
      }
    } catch {
      // Walk-in admin-created member records may not have an Auth UID yet; ignore safely.
    }

    if (data.email && !data.welcomeEmailSent) {
      const branding = await getClubBranding();
      await db.collection('mail').add({
        to: [data.email],
        message: buildWelcomeEmail({
          gymName: branding.gymName,
          accentColor: branding.accentColor,
          memberName: data.displayName,
          siteUrl: branding.siteUrl,
        }),
        createdAt: FieldValue.serverTimestamp(),
      });

      await snap.ref.update({ welcomeEmailSent: true });
    }
  }
);
