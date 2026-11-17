/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/utils/validators.ts
 * Purpose: Client-side form validation helpers synchronized with firebase-blueprint.json limits.
 */

export function isValidEmail(email: string): boolean {
  const trimmed = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254;
}

export function isValidPhone(phone: string): boolean {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return false;
  return /^[+\d\s().-]{7,30}$/.test(trimmed);
}

export function isNonEmpty(value: string, min = 1, max = 500): boolean {
  const len = String(value || '').trim().length;
  return len >= min && len <= max;
}

export function isPositiveNumber(value: unknown, min = 0): boolean {
  const num = Number(value);
  return Number.isFinite(num) && num >= min;
}

export function validateContactForm(data: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): string | null {
  if (!isNonEmpty(data.name, 2, 120)) return 'Please enter your full name (2–120 characters).';
  if (!isValidEmail(data.email)) return 'Please enter a valid email address.';
  if (data.phone && !isValidPhone(data.phone)) return 'Please enter a valid phone number.';
  if (!isNonEmpty(data.subject, 2, 200)) return 'Please enter a subject.';
  if (!isNonEmpty(data.message, 10, 4000)) return 'Message must be at least 10 characters.';
  return null;
}

export function validateCheckoutForm(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}): string | null {
  if (!isNonEmpty(data.customerName, 2, 120)) return 'Please enter your full name.';
  if (!isValidEmail(data.customerEmail)) return 'Please enter a valid email address.';
  if (!isValidPhone(data.customerPhone)) return 'Please enter a valid phone number for order pickup/delivery.';
  return null;
}
