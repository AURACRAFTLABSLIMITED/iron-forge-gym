/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/shopService.ts
 * Purpose: Firestore CRUD service for shop products and customer/member orders.
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
import { Order, OrderItem, OrderStatus, Product } from '../types/models';
import { clampText, handleFirestoreError, OperationType } from '../utils/helpers';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

export async function getProducts(maxItems = 50): Promise<Product[]> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name', 'asc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createProduct(
  payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      name: clampText(payload.name, 160),
      category: clampText(payload.category || 'Gear', 60),
      price: Math.max(0, Number(payload.price) || 0),
      compareAtPrice: Math.max(0, Number(payload.compareAtPrice) || 0),
      stock: Math.max(0, Math.floor(Number(payload.stock) || 0)),
      description: clampText(payload.description, 3000),
      imageUrl: clampText(payload.imageUrl || '', 2000),
      featured: Boolean(payload.featured),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, PRODUCTS_COLLECTION);
  }
}

export async function updateProduct(
  id: string,
  payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
      name: clampText(payload.name, 160),
      category: clampText(payload.category || 'Gear', 60),
      price: Math.max(0, Number(payload.price) || 0),
      compareAtPrice: Math.max(0, Number(payload.compareAtPrice) || 0),
      stock: Math.max(0, Math.floor(Number(payload.stock) || 0)),
      description: clampText(payload.description, 3000),
      imageUrl: clampText(payload.imageUrl || '', 2000),
      featured: Boolean(payload.featured),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Places a new shop or membership subscription order in Firestore.
 */
export async function createOrder(payload: {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  orderType: 'shop' | 'membership';
  packageId?: string;
  notes?: string;
}): Promise<string> {
  try {
    const safeItems = payload.items.slice(0, 30).map((item) => ({
      id: clampText(item.id, 128),
      name: clampText(item.name, 160),
      price: Number(item.price) || 0,
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }));

    const ref = await addDoc(collection(db, ORDERS_COLLECTION), {
      userId: clampText(payload.userId, 128),
      customerName: clampText(payload.customerName, 120),
      customerEmail: clampText(payload.customerEmail, 254),
      customerPhone: clampText(payload.customerPhone, 40),
      shippingAddress: clampText(payload.shippingAddress || 'Gym Front Desk Pickup', 400),
      items: safeItems,
      total: Math.max(0, Number(payload.total) || 0),
      paymentMethod: clampText(payload.paymentMethod || 'Pay at gym / Cash on delivery', 80),
      paymentProvider: 'cash',
      paymentStatus: 'unpaid',
      orderType: payload.orderType,
      ...(payload.packageId ? { packageId: clampText(payload.packageId, 128) } : {}),
      status: 'pending',
      notes: clampText(payload.notes || '', 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
  }
}

export async function getMemberOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(40)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
  }
}

export async function getAllOrdersAdmin(maxItems = 80): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
