/**
 * File: src/utils/paymentOptions.ts
 * Purpose: Reads the client's manual payment accounts (Easypaisa, JazzCash, bank transfer)
 *          from gymConfig.js and provides validation + formatting helpers for checkout.
 */

import { gymConfig } from '../config/gymConfig.js';

export interface ManualPaymentOption {
  id: string;
  label: string;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
}

interface RawAccount {
  enabled?: boolean;
  label?: string;
  accountTitle?: string;
  accountNumber?: string;
  bankName?: string;
}

/** Accounts that are switched on AND have an account number filled in. */
export function getManualPaymentOptions(): ManualPaymentOption[] {
  const raw =
    (gymConfig as unknown as { paymentAccounts?: Record<string, RawAccount> }).paymentAccounts ||
    {};
  const options: ManualPaymentOption[] = [];
  Object.keys(raw).forEach((id) => {
    const a = raw[id];
    const accountNumber = String(a?.accountNumber || '').trim();
    if (!a || !a.enabled || !accountNumber) return;
    options.push({
      id,
      label: String(a.label || id).trim(),
      accountTitle: String(a.accountTitle || '').trim(),
      accountNumber,
      bankName: a.bankName ? String(a.bankName).trim() : undefined,
    });
  });
  return options;
}

/** Returns an error message, or null when the transaction details look valid. */
export function validateManualPayment(tid: string, sender: string): string | null {
  const t = tid.trim();
  const s = sender.trim();
  if (t.length < 6 || t.length > 30 || !/^[A-Za-z0-9-]+$/.test(t)) {
    return 'Enter the transaction ID (TID) from your payment SMS or receipt.';
  }
  if (s.length < 7 || s.length > 20 || !/^[0-9+\-\s]+$/.test(s)) {
    return 'Enter the mobile or account number you sent the payment from.';
  }
  return null;
}

/** Short text stored in order.paymentMethod (max 80 chars) so staff see the TID in the order list. */
export function manualPaymentMethodLabel(
  option: ManualPaymentOption,
  tid: string,
  sender: string
): string {
  return `${option.label} | TID ${tid.trim()} | ${sender.trim()}`.slice(0, 80);
}

/** Longer note stored in order.notes. */
export function manualPaymentNote(
  option: ManualPaymentOption,
  tid: string,
  sender: string
): string {
  return `Manual ${option.label} payment. TID: ${tid.trim()}. Sent from: ${sender.trim()}. Awaiting staff verification.`;
}
