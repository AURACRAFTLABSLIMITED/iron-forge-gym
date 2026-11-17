/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/galleryService.ts
 * Purpose: Firestore service for gym photo gallery management.
 */

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { GalleryItem } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const COLLECTION = 'gallery';

export async function getGalleryItems(maxItems = 60): Promise<GalleryItem[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export async function createGalleryItem(
  payload: Omit<GalleryItem, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      title: clampText(payload.title, 120),
      category: clampText(payload.category || 'Strength Floor', 60),
      imageUrl: clampText(payload.imageUrl, 2000),
      caption: clampText(payload.caption || '', 300),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
