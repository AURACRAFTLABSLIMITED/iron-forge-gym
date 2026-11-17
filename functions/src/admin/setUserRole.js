/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/admin/setUserRole.js
 * Purpose: Admin-only callable Cloud Function that assigns Firebase Auth custom claims
 *          (`role: 'admin' | 'member'`) and keeps `/admins/{uid}` and `/users/{uid}` in sync.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { adminAuth, db, FieldValue } from '../utils/firebaseAdmin.js';
import { isNonEmptyString } from '../utils/validators.js';

export const setUserRole = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    // Verify caller holds admin privileges via custom claim or /admins/{uid} marker doc
    const callerUid = request.auth.uid;
    const callerClaimAdmin = request.auth.token?.role === 'admin';
    const callerMarkerSnap = await db.collection('admins').doc(callerUid).get();

    if (!callerClaimAdmin && !callerMarkerSnap.exists) {
      throw new HttpsError('permission-denied', 'Only admins can update user roles.');
    }

    const { uid, role } = request.data || {};
    if (!isNonEmptyString(uid, 128)) {
      throw new HttpsError('invalid-argument', 'A valid target user uid is required.');
    }
    if (role !== 'admin' && role !== 'member') {
      throw new HttpsError('invalid-argument', 'Role must be either "admin" or "member".');
    }

    const targetUser = await adminAuth.getUser(uid);
    await adminAuth.setCustomUserClaims(uid, { role });

    const adminRef = db.collection('admins').doc(uid);
    const userRef = db.collection('users').doc(uid);

    if (role === 'admin') {
      await adminRef.set({
        uid,
        email: targetUser.email || '',
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      await adminRef.delete().catch(() => {});
    }

    await userRef.set(
      {
        role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      uid,
      role,
      note: 'User must refresh their ID token (sign out and back in) to receive the updated claim.',
    };
  }
);
