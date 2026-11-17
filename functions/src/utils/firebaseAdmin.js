/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/utils/firebaseAdmin.js
 * Purpose: Initializes the Firebase Admin SDK once for all Cloud Functions and exports
 *          the Firestore database instance, Auth admin handle, and FieldValue helpers.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

// CUSTOMIZE: Set FIRESTORE_DATABASE_ID in functions/.env or use '(default)' for standard Firestore.
// If you remove this named database check, Cloud Functions will target '(default)' instead of your named DB.
// The website (src/config/firebase.js + firebase-applet-config.json) uses the '(default)' database,
// so Cloud Functions must use the same one or checkout cannot find packages, products or settings.
export const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || '(default)';

export const db =
  DATABASE_ID && DATABASE_ID !== '(default)'
    ? getFirestore(DATABASE_ID)
    : getFirestore();

export const adminAuth = getAuth();
export { FieldValue };

/**
 * Loads gym branding settings from `settings/site` with safe fallback values
 * so emails and receipts always show the white-labeled gym name and accent color.
 */
export async function getClubBranding() {
  try {
    const snap = await db.doc('settings/site').get();
    const data = snap.exists ? snap.data() : {};
    return {
      gymName: data.gymName || process.env.GYM_NAME || 'IRONFORGE ATHLETICS',
      accentColor: data.accentColor || process.env.GYM_ACCENT_COLOR || '#A4D614',
      ownerEmail: data.email || process.env.GYM_OWNER_EMAIL || '',
      currencySymbol: data.currencySymbol || 'Rs.',
      siteUrl: process.env.GYM_SITE_URL || 'http://localhost:3000',
    };
  } catch {
    return {
      gymName: process.env.GYM_NAME || 'IRONFORGE ATHLETICS',
      accentColor: process.env.GYM_ACCENT_COLOR || '#A4D614',
      ownerEmail: process.env.GYM_OWNER_EMAIL || '',
      currencySymbol: 'Rs.',
      siteUrl: process.env.GYM_SITE_URL || 'http://localhost:3000',
    };
  }
}
