/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/storageService.ts
 * Purpose: Handles compressed image uploads to Firebase Storage.
 *          Components never interact with Firebase Storage directly.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase.js';
import { compressImageFile } from '../utils/helpers';

/**
 * Compresses and uploads an image file to Firebase Storage under the requested folder.
 * Returns the public download URL.
 */
export async function uploadImage(
  file: File,
  folder:
    | 'packages'
    | 'classes'
    | 'trainers'
    | 'posts'
    | 'gallery'
    | 'events'
    | 'products'
    | 'branding'
    | `avatars/${string}`
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files (JPG, PNG, WebP) can be uploaded.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image file must be smaller than 10MB.');
  }

  const compressedBlob = await compressImageFile(file, 1280, 0.82);
  const contentType = compressedBlob.type || 'image/jpeg';
  const extByType: Record<string, string> = {
    'image/webp': 'webp',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
  };
  const ext = extByType[contentType] || 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_') || 'image';
  const filePath = `${folder}/${Date.now()}_${baseName}.${ext}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, compressedBlob, {
    contentType,
    cacheControl: 'public,max-age=31536000',
  });

  return getDownloadURL(storageRef);
}
