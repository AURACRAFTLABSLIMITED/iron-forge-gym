/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/classesService.ts
 * Purpose: Firestore service for weekly class schedules and member class bookings.
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { ClassBooking, GymClass } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const CLASSES_COLLECTION = 'classes';
const BOOKINGS_COLLECTION = 'bookings';

export async function getClasses(maxItems = 100): Promise<GymClass[]> {
  try {
    const q = query(collection(db, CLASSES_COLLECTION), orderBy('startTime', 'asc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GymClass, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, CLASSES_COLLECTION);
  }
}

export async function createClass(
  payload: Omit<GymClass, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, CLASSES_COLLECTION), {
      title: clampText(payload.title, 120),
      category: clampText(payload.category, 60),
      trainerId: clampText(payload.trainerId || '', 128),
      trainerName: clampText(payload.trainerName, 120),
      dayOfWeek: payload.dayOfWeek,
      startTime: clampText(payload.startTime, 20),
      endTime: clampText(payload.endTime, 20),
      level: payload.level,
      capacity: Math.max(1, Number(payload.capacity) || 20),
      room: clampText(payload.room || 'Main Studio', 80),
      description: clampText(payload.description || '', 1000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, CLASSES_COLLECTION);
  }
}

export async function updateClass(
  id: string,
  payload: Omit<GymClass, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `${CLASSES_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, CLASSES_COLLECTION, id), {
      title: clampText(payload.title, 120),
      category: clampText(payload.category, 60),
      trainerId: clampText(payload.trainerId || '', 128),
      trainerName: clampText(payload.trainerName, 120),
      dayOfWeek: payload.dayOfWeek,
      startTime: clampText(payload.startTime, 20),
      endTime: clampText(payload.endTime, 20),
      level: payload.level,
      capacity: Math.max(1, Number(payload.capacity) || 20),
      room: clampText(payload.room || 'Main Studio', 80),
      description: clampText(payload.description || '', 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClass(id: string): Promise<void> {
  const path = `${CLASSES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CLASSES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Books a scheduled class for a logged-in member.
 */
export async function bookClass(params: {
  userId: string;
  userName: string;
  userEmail: string;
  gymClass: GymClass;
}): Promise<string> {
  try {
    const existingQ = query(
      collection(db, BOOKINGS_COLLECTION),
      where('userId', '==', params.userId),
      where('classId', '==', params.gymClass.id),
      where('status', '==', 'confirmed'),
      limit(1)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      throw new Error('You already have a confirmed booking for this class.');
    }

    const ref = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      userId: params.userId,
      userName: clampText(params.userName || 'Member', 120),
      userEmail: clampText(params.userEmail || '', 254),
      classId: params.gymClass.id,
      classTitle: clampText(params.gymClass.title, 120),
      dayOfWeek: params.gymClass.dayOfWeek,
      startTime: params.gymClass.startTime,
      trainerName: clampText(params.gymClass.trainerName, 120),
      status: 'confirmed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already have a confirmed booking')) {
      throw error;
    }
    return handleFirestoreError(error, OperationType.CREATE, BOOKINGS_COLLECTION);
  }
}

/**
 * Fetches all bookings belonging to a specific member.
 */
export async function getMemberBookings(userId: string): Promise<ClassBooking[]> {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClassBooking, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, BOOKINGS_COLLECTION);
  }
}

/**
 * Cancels an existing class booking.
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  const path = `${BOOKINGS_COLLECTION}/${bookingId}`;
  try {
    await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
