/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/attendanceService.ts
 * Purpose: Firestore service for front-desk member check-ins and attendance history.
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { AttendanceRecord } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const COLLECTION = 'attendance';

export async function checkInMember(params: {
  memberId: string;
  memberName: string;
  memberPhone?: string;
  checkedInBy: string;
  notes?: string;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      memberId: clampText(params.memberId, 128),
      memberName: clampText(params.memberName, 120),
      memberPhone: clampText(params.memberPhone || '', 40),
      checkedInBy: clampText(params.checkedInBy, 128),
      notes: clampText(params.notes || '', 300),
      checkInTime: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
}

export async function getMemberAttendance(memberId: string): Promise<AttendanceRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('memberId', '==', memberId),
      orderBy('checkInTime', 'desc'),
      limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export async function getAllAttendanceAdmin(maxItems = 100): Promise<AttendanceRecord[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('checkInTime', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}
