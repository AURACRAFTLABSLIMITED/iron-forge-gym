/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/common/Loader.tsx
 * Purpose: Minimalist loading spinner and skeleton states for async Firestore queries and lazy routes.
 */

import React from 'react';

export function Loader({
  fullScreen = false,
  label = 'Loading...',
}: {
  fullScreen?: boolean;
  label?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'min-h-[70vh]' : 'py-16'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className="w-9 h-9 rounded-full border-2 border-white/15 animate-spin"
        style={{ borderTopColor: 'var(--accent)' }}
      />
      <p className="text-sm text-neutral-400 tracking-wide">{label}</p>
    </div>
  );
}
