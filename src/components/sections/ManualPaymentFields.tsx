/**
 * File: src/components/sections/ManualPaymentFields.tsx
 * Purpose: Shows the client's Easypaisa / JazzCash / bank account details and collects the
 *          customer's transaction ID (TID) and sender number for manual payment verification.
 */

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ManualPaymentOption } from '../../utils/paymentOptions';
import { useSite } from '../../context/SiteContext';
import { formatCurrency } from '../../utils/helpers';

interface ManualPaymentFieldsProps {
  option: ManualPaymentOption;
  amount: number;
  tid: string;
  sender: string;
  onTidChange: (value: string) => void;
  onSenderChange: (value: string) => void;
}

const inputClass =
  'w-full min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white';

export function ManualPaymentFields({
  option,
  amount,
  tid,
  sender,
  onTidChange,
  onSenderChange,
}: ManualPaymentFieldsProps) {
  const { settings } = useSite();
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(option.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (older browsers / insecure context); the number is still visible.
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 rounded bg-[#0B0D0E] border border-[var(--accent)]/40 space-y-1.5">
        <p className="text-xs text-neutral-400">
          Send{' '}
          <span className="font-mono font-bold text-white">
            {formatCurrency(amount, settings.currencySymbol)}
          </span>{' '}
          to this {option.label} account:
        </p>
        {option.bankName ? <p className="text-xs text-neutral-300">{option.bankName}</p> : null}
        {option.accountTitle ? (
          <p className="text-sm font-semibold text-white">{option.accountTitle}</p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-lg font-bold tabular-nums text-[var(--accent)] break-all">
            {option.accountNumber}
          </span>
          <button
            type="button"
            onClick={copyNumber}
            aria-label="Copy account number"
            className="shrink-0 min-h-[36px] px-2.5 rounded bg-[#14171A] border border-white/15 text-xs text-neutral-200 inline-flex items-center gap-1.5 hover:border-[var(--accent)]"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          After paying, enter the transaction ID from your SMS below. Our team will verify it and
          confirm your order.
        </p>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Transaction ID (TID)</label>
        <input
          type="text"
          value={tid}
          onChange={(e) => onTidChange(e.target.value)}
          placeholder="e.g. 31245678901"
          autoComplete="off"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">
          Number you paid from ({option.label})
        </label>
        <input
          type="tel"
          value={sender}
          onChange={(e) => onSenderChange(e.target.value)}
          placeholder="03XX XXXXXXX"
          className={inputClass}
        />
      </div>
    </div>
  );
}
