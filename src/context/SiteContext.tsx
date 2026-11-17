/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/context/SiteContext.tsx
 * Purpose: Provides live white-label SiteSettings (merged from gymConfig.js + Firestore),
 *          updates CSS accent color variables dynamically, and manages global toast notifications.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SiteSettings } from '../types/models';
import { applyThemeAccent } from '../config/theme.js';
import { getDefaultSettings, subscribeSiteSettings } from '../services/settingsService';
import { testFirestoreConnection } from '../config/firebase.js';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface SiteContextValue {
  settings: SiteSettings;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const SiteContext = createContext<SiteContextValue>({
  settings: getDefaultSettings(),
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => getDefaultSettings());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    testFirestoreConnection();
    const unsub = subscribeSiteSettings((nextSettings) => {
      setSettings(nextSettings);
      applyThemeAccent(nextSettings.accentColor);
      if (typeof document !== 'undefined' && nextSettings.gymName) {
        document.title = `${nextSettings.gymName} — ${nextSettings.tagline}`;
      }
    });
    return () => unsub();
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  return (
    <SiteContext.Provider value={{ settings, toasts, showToast, dismissToast }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
