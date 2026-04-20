import { TimeSlot } from "./enums";

/** Default platform settings; admin can override at runtime via `Settings` table. */
export const DEFAULT_SETTINGS = {
  revenueSplitWorkerPercent: 80, // admin takes 20%
  multiplierSat: 1.5,
  multiplierSun: 1.5,
  multiplierPublicHoliday: 2.0,
  defaultCurrency: "MYR",
  /** How many nearest workers to broadcast a new booking to. */
  broadcastFanout: 5,
  /** How long (minutes) an offer stays open before expiring. */
  offerTimeoutMinutes: 3,
  /** How many days into a monthly subscription to prompt for renewal. */
  renewalPromptAfterDays: 14,
  /** Default renewal discount % if the admin enables discount on a service type. */
  defaultDiscountPercent: 10,
};

export const SLOT_HOURS: Record<TimeSlot, { start: number; end: number }> = {
  AM: { start: 8, end: 12 },
  PM: { start: 13, end: 17 },
  EVENING: { start: 18, end: 22 },
  FULL_DAY: { start: 8, end: 22 },
};

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}
