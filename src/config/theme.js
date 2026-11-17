/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/config/theme.js
 * Purpose: Single-file theme controller. Computes contrasting text and subtle tint tokens
 *          from the configured accentColor and applies them to document.documentElement CSS variables.
 */

import { gymConfig } from './gymConfig.js';

// CUSTOMIZE: Base palette tokens. Change canvas/surface hexes here to adjust the global dark theme.
export const themeDefaults = {
  bgCanvas: '#0B0D0E',
  bgSurface: '#14171A',
  bgElevated: '#1C2024',
  textPrimary: '#F4F5F6',
  textMuted: '#9CA3AF',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  accentColor: gymConfig.accentColor || '#A4D614',
};

/**
 * Converts a hex color (#A4D614) into an "r, g, b" string for rgba() CSS rules.
 */
function hexToRgbString(hex) {
  const cleaned = String(hex || '#A4D614').replace('#', '').trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return '164, 214, 20';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

/**
 * Computes whether black or white text has stronger WCAG contrast on top of a given hex background.
 */
function getContrastInk(hex) {
  const cleaned = String(hex || '#A4D614').replace('#', '').trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return '#0B0D0E';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  // Relative luminance formula (W3C)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0B0D0E' : '#FFFFFF';
}

/**
 * Applies the active accent color to root CSS custom properties.
 * If you remove this function call from App/Settings, Admin color changes will not reflect live in the UI.
 */
export function applyThemeAccent(accentHex) {
  if (typeof document === 'undefined') return;
  const color = /^#[0-9A-Fa-f]{3,6}$/.test(String(accentHex || ''))
    ? accentHex
    : themeDefaults.accentColor;
  const root = document.documentElement;
  root.style.setProperty('--accent', color);
  root.style.setProperty('--accent-rgb', hexToRgbString(color));
  root.style.setProperty('--accent-ink', getContrastInk(color));
}
