/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/utils/validators.js
 * Purpose: Server-side input validation and date calculation helpers for Cloud Functions.
 */

export function isNonEmptyString(val, maxLen = 200) {
  return typeof val === 'string' && val.trim().length > 0 && val.trim().length <= maxLen;
}

export function isValidPositiveInt(val, max = 100) {
  const num = Number(val);
  return Number.isInteger(num) && num >= 1 && num <= max;
}

export function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  return /^https?:\/\/.+/.test(url.trim()) && url.length <= 2000;
}

/**
 * Formats a Date object as YYYY-MM-DD in UTC.
 */
export function toIsoDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Returns a YYYY-MM-DD string `days` days from a given start date (defaults to today).
 */
export function addDaysToDate(days, fromDate = new Date()) {
  const copy = new Date(fromDate.getTime());
  copy.setUTCDate(copy.getUTCDate() + Math.max(1, Number(days) || 30));
  return toIsoDate(copy);
}
