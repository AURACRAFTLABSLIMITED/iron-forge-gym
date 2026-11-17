/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/blogService.ts
 * Purpose: Firestore CRUD service for blog posts and training articles.
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
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { BlogPost } from '../types/models';
import { clampText, handleFirestoreError, OperationType, slugify } from '../utils/helpers';

const COLLECTION = 'posts';

export async function getPublishedPosts(maxItems = 30): Promise<BlogPost[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export async function getAllPostsAdmin(maxItems = 50): Promise<BlogPost[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, COLLECTION);
  }
}

export async function getPostByIdOrSlug(idOrSlug: string): Promise<BlogPost | null> {
  try {
    const direct = await getDoc(doc(db, COLLECTION, idOrSlug));
    if (direct.exists()) {
      return { id: direct.id, ...(direct.data() as Omit<BlogPost, 'id'>) };
    }
    const q = query(collection(db, COLLECTION), where('slug', '==', idOrSlug), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const found = snap.docs[0];
    return { id: found.id, ...(found.data() as Omit<BlogPost, 'id'>) };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${idOrSlug}`);
  }
}

export async function createPost(
  payload: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      title: clampText(payload.title, 200),
      slug: clampText(payload.slug || slugify(payload.title), 200),
      category: clampText(payload.category || 'Training', 60),
      excerpt: clampText(payload.excerpt, 400),
      content: clampText(payload.content, 20000),
      authorName: clampText(payload.authorName || 'Coaching Staff', 120),
      coverImage: clampText(payload.coverImage || '', 2000),
      readTime: clampText(payload.readTime || '4 min read', 40),
      published: payload.published !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
}

export async function updatePost(
  id: string,
  payload: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      title: clampText(payload.title, 200),
      slug: clampText(payload.slug || slugify(payload.title), 200),
      category: clampText(payload.category || 'Training', 60),
      excerpt: clampText(payload.excerpt, 400),
      content: clampText(payload.content, 20000),
      authorName: clampText(payload.authorName || 'Coaching Staff', 120),
      coverImage: clampText(payload.coverImage || '', 2000),
      readTime: clampText(payload.readTime || '4 min read', 40),
      published: payload.published !== false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePost(id: string): Promise<void> {
  const path = `${COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
