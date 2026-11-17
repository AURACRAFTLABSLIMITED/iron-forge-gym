/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/packagesService.ts
 * Purpose: Firestore CRUD service for gym membership packages.
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { GymPackage } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const COLLECTION = 'packages';

export async function getPackages(maxItems = 25): Promise<GymPackage[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('price', 'asc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GymPackage, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export async function createPackage(
  payload: Omit<GymPackage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      name: clampText(payload.name, 120),
      audience: clampText(payload.audience || 'All Athletes', 120),
      price: Number(payload.price) || 0,
      billingCycle: payload.billingCycle,
      durationDays: Math.max(1, Number(payload.durationDays) || 30),
      badgeText: clampText(payload.badgeText || '', 40),
      featured: Boolean(payload.featured),
      features: (payload.features || []).slice(0, 12).map((f) => clampText(f, 160)),
      description: clampText(payload.description || '', 1000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
}

export async function updatePackage(
  id: string,
  payload: Omit<GymPackage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      name: clampText(payload.name, 120),
      audience: clampText(payload.audience || 'All Athletes', 120),
      price: Number(payload.price) || 0,
      billingCycle: payload.billingCycle,
      durationDays: Math.max(1, Number(payload.durationDays) || 30),
      badgeText: clampText(payload.badgeText || '', 40),
      featured: Boolean(payload.featured),
      features: (payload.features || []).slice(0, 12).map((f) => clampText(f, 160)),
      description: clampText(payload.description || '', 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePackage(id: string): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
