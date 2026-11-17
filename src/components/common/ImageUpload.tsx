/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/common/ImageUpload.tsx
 * Purpose: Compresses and uploads images to Firebase Storage via storageService.ts,
 *          and also supports pasting an external/bundled image URL as an instant fallback.
 */

import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadImage } from '../../services/storageService';
import { MediaFrame } from './MediaFrame';

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder:
    | 'packages'
    | 'classes'
    | 'trainers'
    | 'posts'
    | 'gallery'
    | 'events'
    | 'products'
    | 'branding'
    | `avatars/${string}`;
}

export function ImageUpload({
  label = 'Image',
  value,
  onChange,
  folder,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload failed. Ensure Firebase Storage is enabled or paste an image URL below.'
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-neutral-300">{label}</label>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {value ? (
          <div className="w-24 h-16 rounded overflow-hidden border border-white/10 shrink-0">
            <MediaFrame src={value} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="flex-1 w-full space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste image URL or upload file..."
              className="flex-1 min-h-[42px] px-3 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white placeholder-neutral-500 focus:border-[var(--accent)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="min-h-[42px] px-4 rounded bg-[#1C2024] border border-white/15 text-xs font-semibold text-white hover:border-[var(--accent)] inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Upload size={15} />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
