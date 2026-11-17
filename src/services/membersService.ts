/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/membersService.ts
 * Purpose: Admin-only Firestore service for managing gym members, assigning plans,
 *          and renewing memberships.
 */

import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { GymPackage, MemberProfile, MembershipStatus } from '../types/models';
import { addDaysToToday, clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const COLLECTION = 'users';

export async function getAllMembersAdmin(maxItems = 100): Promise<MemberProfile[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MemberProfile) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

/**
 * Allows an Admin to manually add a walk-in member record (before they sign up online)
 * or update an existing member's details.
 */
export async function saveMemberAdmin(
  memberId: string | null,
  payload: {
    displayName: string;
    email: string;
    phone?: string;
    emergencyContact?: string;
    membershipStatus: MembershipStatus;
    planId?: string;
    planName?: string;
    planStartDate?: string;
    planExpiryDate?: string;
  }
): Promise<string> {
  const targetId = memberId || `member_${Date.now()}`;
  const path = `${COLLECTION}/${targetId}`;
  try {
    if (memberId) {
      await updateDoc(doc(db, COLLECTION, targetId), {
        displayName: clampText(payload.displayName, 120),
        email: clampText(payload.email, 254),
        phone: clampText(payload.phone || '', 40),
        emergencyContact: clampText(payload.emergencyContact || '', 200),
        membershipStatus: payload.membershipStatus,
        planId: clampText(payload.planId || '', 128),
        planName: clampText(payload.planName || 'No Active Plan', 120),
        planStartDate: clampText(payload.planStartDate || '', 40),
        planExpiryDate: clampText(payload.planExpiryDate || '', 40),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, COLLECTION, targetId), {
        uid: targetId,
        displayName: clampText(payload.displayName, 120),
        email: clampText(payload.email, 254),
        phone: clampText(payload.phone || '', 40),
        photoURL: '',
        emergencyContact: clampText(payload.emergencyContact || '', 200),
        membershipStatus: payload.membershipStatus || 'none',
        planId: clampText(payload.planId || '', 128),
        planName: clampText(payload.planName || 'No Active Plan', 120),
        planStartDate: clampText(payload.planStartDate || '', 40),
        planExpiryDate: clampText(payload.planExpiryDate || '', 40),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return targetId;
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Assigns or renews a membership package for a member starting today.
 */
export async function assignPackageToMember(
  memberId: string,
  pkg: GymPackage
): Promise<{ startDate: string; expiryDate: string }> {
  const startDate = new Date().toISOString().split('T')[0];
  const expiryDate = addDaysToToday(pkg.durationDays || 30);
  const path = `${COLLECTION}/${memberId}`;
  try {
    await updateDoc(doc(db, COLLECTION, memberId), {
      planId: pkg.id,
      planName: clampText(pkg.name, 120),
      planStartDate: startDate,
      planExpiryDate: expiryDate,
      membershipStatus: 'active',
      updatedAt: serverTimestamp(),
    });
    return { startDate, expiryDate };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMemberAdmin(memberId: string): Promise<void> {
  const path = `${COLLECTION}/${memberId}`;
  try {
    await deleteDoc(doc(db, COLLECTION, memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
