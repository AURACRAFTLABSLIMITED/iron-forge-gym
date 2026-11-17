/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/authService.ts
 * Purpose: Encapsulates all Firebase Authentication and user profile/role Firestore calls.
 *          Handles Google Sign-In, Email/Password Auth, password reset, profile updates,
 *          and server-verified admin role checks.
 */

import {
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase.js';
import { MemberProfile } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

// Bootstrapped primary admin email for initial workspace evaluation.
// Additional admins are stored in Firestore `/admins/{uid}`.
// If you remove this check without creating `/admins/{uid}` documents, no admin can enter `/admin`.
const BOOTSTRAP_ADMIN_EMAIL = 'officalceoaliimran@gmail.com';

/**
 * Ensures a Firestore member profile exists for the authenticated user on first sign-in.
 */
export async function ensureUserProfile(user: User, extraName?: string): Promise<MemberProfile> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as MemberProfile) };
    }

    const newProfile: MemberProfile = {
      uid: user.uid,
      displayName: clampText(extraName || user.displayName || 'Club Member', 120),
      email: clampText(user.email || '', 254),
      phone: '',
      photoURL: clampText(user.photoURL || '', 2000),
      emergencyContact: '',
      planId: '',
      planName: 'No Active Plan',
      planStartDate: '',
      planExpiryDate: '',
      membershipStatus: 'none',
    };

    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: user.uid, ...newProfile };
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Signs in via Google popup and initializes the member profile if new.
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

/**
 * Signs in via Facebook popup and initializes the member profile if new.
 */
export async function signInWithFacebook(): Promise<User> {
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  await ensureUserProfile(result.user);
  return result.user;
}

/**
 * Signs in via X (Twitter) popup and initializes the member profile if new.
 * Note: X often does not share an email address, so the profile email may be empty.
 */
export async function signInWithTwitter(): Promise<User> {
  const provider = new TwitterAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await ensureUserProfile(result.user);
  return result.user;
}

/**
 * Signs in an existing member or admin using Email + Password.
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureUserProfile(result.user);
  return result.user;
}

/**
 * Registers a new member account using Email + Password and creates their Firestore profile.
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  phone = ''
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) {
    await updateProfile(result.user, { displayName: name.trim() });
  }
  const userRef = doc(db, 'users', result.user.uid);
  const path = `users/${result.user.uid}`;
  try {
    await setDoc(userRef, {
      uid: result.user.uid,
      displayName: clampText(name || 'Club Member', 120),
      email: clampText(email.trim(), 254),
      phone: clampText(phone, 40),
      photoURL: '',
      emergencyContact: '',
      planId: '',
      planName: 'No Active Plan',
      planStartDate: '',
      planExpiryDate: '',
      membershipStatus: 'none',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
  return result.user;
}

/**
 * Sends a Firebase password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Signs out the current user.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetches the current user's profile from Firestore.
 */
export async function getMemberProfile(uid: string): Promise<MemberProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as MemberProfile) };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Allows a member to update ONLY their own editable contact/avatar fields.
 * Membership plan/status fields cannot be altered here (enforced in firestore.rules).
 */
export async function updateOwnProfile(
  uid: string,
  updates: {
    displayName: string;
    phone: string;
    photoURL: string;
    emergencyContact: string;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: clampText(updates.displayName, 120),
      phone: clampText(updates.phone, 40),
      photoURL: clampText(updates.photoURL, 2000),
      emergencyContact: clampText(updates.emergencyContact, 200),
      updatedAt: serverTimestamp(),
    });
    if (auth.currentUser && updates.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: clampText(updates.displayName, 120),
        photoURL: updates.photoURL || auth.currentUser.photoURL || undefined,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Checks whether the current user holds the admin role via custom Auth claim (`role === 'admin'`),
 * `/admins/{uid}` marker document, or verified bootstrap email.
 */
export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (
    user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
    user.emailVerified
  ) {
    return true;
  }
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims?.role === 'admin') {
      return true;
    }
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}
