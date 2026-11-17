/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/contactService.ts
 * Purpose: Firestore service for public contact inquiries, newsletter subscriptions,
 *          and admin inbox/subscriber management.
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
import { ContactMessage, NewsletterSubscriber } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const MESSAGES_COLLECTION = 'messages';
const NEWSLETTER_COLLECTION = 'newsletter';

export async function submitContactMessage(payload: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, MESSAGES_COLLECTION), {
      name: clampText(payload.name, 120),
      email: clampText(payload.email, 254),
      phone: clampText(payload.phone || '', 40),
      subject: clampText(payload.subject, 200),
      message: clampText(payload.message, 4000),
      read: false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, MESSAGES_COLLECTION);
  }
}

export async function getAllMessagesAdmin(maxItems = 100): Promise<ContactMessage[]> {
  try {
    const q = query(collection(db, MESSAGES_COLLECTION), orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContactMessage, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, MESSAGES_COLLECTION);
  }
}

export async function markMessageRead(id: string, read = true): Promise<void> {
  const path = `${MESSAGES_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, MESSAGES_COLLECTION, id), { read });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMessage(id: string): Promise<void> {
  const path = `${MESSAGES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, MESSAGES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function subscribeNewsletter(email: string): Promise<string> {
  try {
    const ref = await addDoc(collection(db, NEWSLETTER_COLLECTION), {
      email: clampText(email.toLowerCase(), 254),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, NEWSLETTER_COLLECTION);
  }
}

export async function getAllSubscribersAdmin(maxItems = 200): Promise<NewsletterSubscriber[]> {
  try {
    const q = query(
      collection(db, NEWSLETTER_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsletterSubscriber, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, NEWSLETTER_COLLECTION);
  }
}

export async function deleteSubscriber(id: string): Promise<void> {
  const path = `${NEWSLETTER_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, NEWSLETTER_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
