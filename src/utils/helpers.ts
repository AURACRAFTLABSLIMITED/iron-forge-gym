/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/utils/helpers.ts
 * Purpose: Pure helper utilities for currency formatting, date/days-left calculations,
 *          URL slug generation, image compression, and structured Firestore error reporting.
 */

import { auth } from '../config/firebase.js';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Formats Firestore permission/network errors into structured JSON context for diagnostics.
 * If you remove this handler, permission errors become opaque and harder to debug.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Formats a numeric price using the configured currency symbol.
 */
export function formatCurrency(amount: number, currencySymbol = 'Rs.'): string {
  return `${currencySymbol} ${formatAmount(amount)}`;
}

/**
 * Formats just the number part: 16500 -> "16,500" (paisa shown only if the price has them).
 */
export function formatAmount(amount: number): string {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Converts Firestore Timestamp, ISO string, or Date into a readable short date.
 */
export function formatDate(value: unknown): string {
  if (!value) return '—';
  let date: Date | null = null;
  if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (value instanceof Date) {
    date = value;
  }
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculates whole days remaining until an expiry date string (YYYY-MM-DD or ISO).
 */
export function getDaysRemaining(expiryDateStr?: string): number {
  if (!expiryDateStr) return 0;
  const expiry = new Date(expiryDateStr);
  if (Number.isNaN(expiry.getTime())) return 0;
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Generates an ISO date string N days from today (used when assigning/renewing memberships).
 */
export function addDaysToToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(1, Number(days) || 30));
  return date.toISOString().split('T')[0];
}

/**
 * Generates a URL-safe slug from a blog post title.
 */
export function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Compresses an uploaded image file client-side via HTML5 Canvas (output: WebP) before Storage upload.
 * Keeps uploads fast and ensures Lighthouse performance stays high.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else resolve(file);
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode selected image file.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Sanitizes string payloads to stay well within Firestore blueprint maxLength limits.
 */
export function clampText(value: string, maxLength: number): string {
  return String(value || '').trim().slice(0, maxLength);
}
