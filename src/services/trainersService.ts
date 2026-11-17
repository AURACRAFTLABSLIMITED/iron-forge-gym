/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/trainersService.ts
 * Purpose: Firestore CRUD service for gym trainers and coaches.
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
import { Trainer } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const COLLECTION = 'trainers';

export async function getTrainers(maxItems = 40): Promise<Trainer[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Trainer, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export async function createTrainer(
  payload: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      name: clampText(payload.name, 120),
      role: clampText(payload.role, 120),
      specialty: clampText(payload.specialty, 120),
      experienceYears: Math.max(0, Number(payload.experienceYears) || 1),
      bio: clampText(payload.bio, 1500),
      photoUrl: clampText(payload.photoUrl || '', 2000),
      certifications: clampText(payload.certifications || '', 400),
      instagram: clampText(payload.instagram || '', 200),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
}

export async function updateTrainer(
  id: string,
  payload: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      name: clampText(payload.name, 120),
      role: clampText(payload.role, 120),
      specialty: clampText(payload.specialty, 120),
      experienceYears: Math.max(0, Number(payload.experienceYears) || 1),
      bio: clampText(payload.bio, 1500),
      photoUrl: clampText(payload.photoUrl || '', 2000),
      certifications: clampText(payload.certifications || '', 400),
      instagram: clampText(payload.instagram || '', 200),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTrainer(id: string): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
