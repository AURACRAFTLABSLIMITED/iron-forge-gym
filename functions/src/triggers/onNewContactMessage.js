/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/triggers/onNewContactMessage.js
 * Purpose: Firestore trigger that emails the gym owner whenever a new public contact
 *          inquiry is created in `messages/{messageId}`.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { DATABASE_ID, db, FieldValue, getClubBranding } from '../utils/firebaseAdmin.js';
import { buildContactNotificationEmail } from '../emails/templates.js';

export const onNewContactMessage = onDocumentCreated(
  {
    document: 'messages/{messageId}',
    database: DATABASE_ID,
    region: 'us-central1',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const msg = snap.data();
    const branding = await getClubBranding();
    if (!branding.ownerEmail) {
      console.warn('No owner email configured in settings/site or GYM_OWNER_EMAIL.');
      return;
    }

    await db.collection('mail').add({
      to: [branding.ownerEmail],
      replyTo: msg.email || undefined,
      message: buildContactNotificationEmail({
        gymName: branding.gymName,
        accentColor: branding.accentColor,
        name: msg.name,
        email: msg.email,
        phone: msg.phone,
        subject: msg.subject,
        message: msg.message,
      }),
      createdAt: FieldValue.serverTimestamp(),
    });
  }
);
