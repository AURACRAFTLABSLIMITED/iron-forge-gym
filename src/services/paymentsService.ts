/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/paymentsService.ts
 * Purpose: Encapsulates all Cloud Function calls for online checkout, order payment status
 *          retrieval, manual cash payment confirmation, and admin role assignment.
 */

import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '../config/firebase.js';
import { Order } from '../types/models';
import { handleFirestoreError, OperationType } from '../utils/helpers';

/**
 * Starts an online checkout session via Cloud Functions.
 * Sends ONLY item IDs + quantities or packageId — prices are always fetched server-side.
 */
export async function startOnlineCheckout(payload: {
  orderType: 'shop' | 'membership';
  packageId?: string;
  items?: { id: string; quantity: number }[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  notes?: string;
}): Promise<{ orderId: string; sessionId: string; sessionUrl: string }> {
  const callable = httpsCallable<
    typeof payload & { successUrl: string; cancelUrl: string },
    { orderId: string; sessionId: string; sessionUrl: string }
  >(functions, 'createCheckoutSession');

  const origin = window.location.origin;
  const response = await callable({
    ...payload,
    successUrl: `${origin}/checkout/success`,
    cancelUrl: `${origin}/checkout/cancel`,
  });

  return response.data;
}

/**
 * Reads a single order by ID from Firestore for Success and Cancel status pages.
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const path = `orders/${orderId}`;
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Allows an Admin to mark a cash / pay-at-gym order as paid in Firestore.
 */
export async function markOrderPaidAdmin(orderId: string, orderType: 'shop' | 'membership') {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      paymentStatus: 'paid',
      status: orderType === 'membership' ? 'completed' : 'processing',
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Calls the admin-only `setUserRole` Cloud Function to grant or revoke the admin custom claim.
 */
export async function setUserRoleAdmin(uid: string, role: 'admin' | 'member') {
  const callable = httpsCallable<
    { uid: string; role: 'admin' | 'member' },
    { success: boolean; uid: string; role: string; note: string }
  >(functions, 'setUserRole');
  const res = await callable({ uid, role });
  return res.data;
}
