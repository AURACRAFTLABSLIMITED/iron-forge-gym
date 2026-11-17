/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/common/Toast.tsx
 * Purpose: Renders non-blocking feedback notifications triggered via SiteContext.showToast().
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useSite();
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'error'
            ? AlertCircle
            : toast.type === 'info'
            ? Info
            : CheckCircle2;

        const accentBorder =
          toast.type === 'error'
            ? 'border-red-500/40'
            : toast.type === 'info'
            ? 'border-white/20'
            : 'border-[var(--accent)]/50';

        const iconColor =
          toast.type === 'error'
            ? 'text-red-400'
            : toast.type === 'info'
            ? 'text-neutral-300'
            : 'text-[var(--accent)]';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg bg-[#14171A] border ${accentBorder} shadow-xl text-sm text-white`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-neutral-400 hover:text-white p-0.5"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
