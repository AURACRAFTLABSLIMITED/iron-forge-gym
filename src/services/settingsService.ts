/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/services/settingsService.ts
 * Purpose: Loads and saves white-label site settings from Firestore (`settings/site`),
 *          merging cleanly with gymConfig.js defaults so branding works on first boot.
 */

import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { gymConfig } from '../config/gymConfig.js';
import { SiteSettings } from '../types/models';
import { handleFirestoreError, OperationType } from '../utils/helpers';

const SETTINGS_DOC_PATH = 'settings/site';

/**
 * Builds default SiteSettings from the white-label src/config/gymConfig.js file.
 */
export function getDefaultSettings(): SiteSettings {
  return {
    gymName: gymConfig.gymName,
    shortName: gymConfig.shortName,
    tagline: gymConfig.tagline,
    description: gymConfig.description,
    logoUrl: gymConfig.logoUrl,
    accentColor: gymConfig.accentColor,
    currencySymbol: gymConfig.currencySymbol,
    paymentProvider:
      gymConfig.paymentProvider === 'stripe' || gymConfig.paymentProvider === 'custom'
        ? gymConfig.paymentProvider
        : 'cash',
    phone: gymConfig.phone,
    email: gymConfig.email,
    address: gymConfig.address,
    mapEmbedUrl: gymConfig.mapEmbedUrl,
    workingHours: gymConfig.workingHours,
    heroSlides: gymConfig.heroSlides,
    classCategories: gymConfig.classCategories,
    socialLinks: gymConfig.socialLinks,
  };
}

/**
 * Fetches SiteSettings once, falling back to gymConfig.js if Firestore doc is not created yet.
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    if (!snap.exists()) return getDefaultSettings();
    return { ...getDefaultSettings(), ...(snap.data() as Partial<SiteSettings>) };
  } catch (error) {
    console.warn('Using default gymConfig settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Subscribes to live SiteSettings changes so Admin updates reflect immediately across pages.
 */
export function subscribeSiteSettings(
  onChange: (settings: SiteSettings) => void
): () => void {
  return onSnapshot(
    doc(db, 'settings', 'site'),
    (snap) => {
      if (!snap.exists()) {
        onChange(getDefaultSettings());
      } else {
        onChange({ ...getDefaultSettings(), ...(snap.data() as Partial<SiteSettings>) });
      }
    },
    (error) => {
      console.warn('Site settings subscription fallback:', error.message);
      onChange(getDefaultSettings());
    }
  );
}

/**
 * Persists Admin Site Settings changes to Firestore.
 */
export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'site'), {
      gymName: settings.gymName.trim(),
      shortName: (settings.shortName || settings.gymName).trim(),
      tagline: settings.tagline.trim(),
      description: (settings.description || '').trim(),
      logoUrl: (settings.logoUrl || '').trim(),
      accentColor: settings.accentColor.trim() || '#A4D614',
      currencySymbol: settings.currencySymbol.trim() || 'Rs.',
      paymentProvider: settings.paymentProvider || 'cash',
      phone: settings.phone.trim(),
      email: settings.email.trim(),
      address: settings.address.trim(),
      mapEmbedUrl: settings.mapEmbedUrl.trim(),
      workingHours: settings.workingHours,
      heroSlides: settings.heroSlides,
      classCategories: settings.classCategories,
      socialLinks: settings.socialLinks,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC_PATH);
  }
}
