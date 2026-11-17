/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/common/MediaFrame.tsx
 * Purpose: Resilient image component enforcing lazy loading, referrerPolicy="no-referrer",
 *          and a styled fallback container so zero broken images ever render.
 */

import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface MediaFrameProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function MediaFrame({
  src,
  alt,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
}: MediaFrameProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#161A1D] to-[#0B0D0E] text-neutral-500 p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Dumbbell size={28} className="text-[var(--accent)] opacity-70" />
        <span className="text-xs text-center text-neutral-400 line-clamp-2 max-w-[180px]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
