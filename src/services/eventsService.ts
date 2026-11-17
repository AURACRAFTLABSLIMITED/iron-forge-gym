/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/eventsService.ts
 * Purpose: Firestore CRUD service for upcoming gym events and workshops.
 */

import {
  collection,
  getDocs,
  getDoc,
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
import { GymEvent } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const COLLECTION = 'events';

export async function getEvents(maxItems = 30): Promise<GymEvent[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('date', 'asc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GymEvent, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export async function getEventById(id: string): Promise<GymEvent | null> {
  const path = `${COLLECTION}/${id}`;
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<GymEvent, 'id'>) };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createEvent(
  payload: Omit<GymEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      title: clampText(payload.title, 160),
      date: clampText(payload.date, 40),
      time: clampText(payload.time, 40),
      location: clampText(payload.location, 160),
      category: clampText(payload.category || 'Competition', 60),
      description: clampText(payload.description, 4000),
      imageUrl: clampText(payload.imageUrl || '', 2000),
      price: Math.max(0, Number(payload.price) || 0),
      capacity: Math.max(1, Number(payload.capacity) || 40),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
}

export async function updateEvent(
  id: string,
  payload: Omit<GymEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      title: clampText(payload.title, 160),
      date: clampText(payload.date, 40),
      time: clampText(payload.time, 40),
      location: clampText(payload.location, 160),
      category: clampText(payload.category || 'Competition', 60),
      description: clampText(payload.description, 4000),
      imageUrl: clampText(payload.imageUrl || '', 2000),
      price: Math.max(0, Number(payload.price) || 0),
      capacity: Math.max(1, Number(payload.capacity) || 40),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
