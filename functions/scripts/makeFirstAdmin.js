/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/scripts/makeFirstAdmin.js
 * Purpose: One-time CLI bootstrap script to promote your very first admin user by UID or email.
 *
 * USAGE:
 *   1. Download a Firebase service account JSON key from Firebase Console -> Project Settings -> Service accounts.
 *   2. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   3. Run from /functions:
 *        node scripts/makeFirstAdmin.js admin@yourgym.com
 *      (or pass a Firebase Auth UID directly)
 */

import { adminAuth, db, FieldValue } from '../src/utils/firebaseAdmin.js';

async function run() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error('Usage: node scripts/makeFirstAdmin.js <USER_EMAIL_OR_UID>');
    process.exit(1);
  }

  const user = identifier.includes('@')
    ? await adminAuth.getUserByEmail(identifier.trim())
    : await adminAuth.getUser(identifier.trim());

  await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' });

  await db.collection('admins').doc(user.uid).set({
    uid: user.uid,
    email: user.email || '',
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(user.uid).set(
    {
      role: 'admin',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`SUCCESS: Granted role="admin" to ${user.email || user.uid} (UID: ${user.uid}).`);
  console.log('Ask the user to sign out and sign back in to refresh their Auth token.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to bootstrap admin:', err);
  process.exit(1);
});
