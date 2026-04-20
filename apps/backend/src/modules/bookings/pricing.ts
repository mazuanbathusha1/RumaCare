import type { ServiceType, Settings } from "@prisma/client";
import type { TimeSlot } from "@rumacare/shared";

export interface PriceInput {
  serviceType: ServiceType;
  settings: Settings;
  scheduledFor: Date;
  slot?: TimeSlot | null;
  durationHours?: number | null;
  discountPercent?: number;
  isPublicHoliday?: boolean;
}

export interface PriceResult {
  baseAmount: number;
  multiplier: number;
  discountPercent: number;
  totalAmount: number;
  workerAmount: number;
  adminAmount: number;
}

/** Returns 0 Sun, 1 Mon .. 6 Sat (JS style). */
function dayOfWeek(d: Date): number {
  return d.getDay();
}

export function computeMultiplier(
  scheduledFor: Date,
  isPublicHoliday: boolean,
  settings: Settings,
): number {
  if (isPublicHoliday) return settings.multiplierPublicHoliday;
  const dow = dayOfWeek(scheduledFor);
  if (dow === 6) return settings.multiplierSat;
  if (dow === 0) return settings.multiplierSun;
  return 1;
}

export function resolveBaseAmount(
  serviceType: ServiceType,
  slot: TimeSlot | null | undefined,
  durationHours: number | null | undefined,
): number {
  switch (serviceType.rateModel) {
    case "HOURLY": {
      const hours = durationHours ?? 1;
      return (serviceType.hourlyRate ?? 0) * hours;
    }
    case "HALF_OR_FULL_DAY": {
      switch (slot) {
        case "AM":
          return serviceType.rateAmSlot ?? 0;
        case "PM":
          return serviceType.ratePmSlot ?? 0;
        case "EVENING":
          return serviceType.rateEveningSlot ?? 0;
        case "FULL_DAY":
          return serviceType.rateFullDay ?? 0;
        default:
          return serviceType.rateAmSlot ?? 0;
      }
    }
    case "PACKAGE":
    case "PER_SUBJECT":
      // Package/subject pricing is computed elsewhere using subject table.
      return serviceType.hourlyRate ?? 0;
    case "FIXED_WORKER_FEE":
      return 0;
    default:
      return 0;
  }
}

export function computePrice(input: PriceInput): PriceResult {
  const baseAmount = resolveBaseAmount(input.serviceType, input.slot, input.durationHours);
  const multiplier = computeMultiplier(
    input.scheduledFor,
    Boolean(input.isPublicHoliday),
    input.settings,
  );
  const discountPercent = input.discountPercent ?? 0;
  const multiplied = Math.round(baseAmount * multiplier);
  const totalAmount = Math.round(multiplied * (1 - discountPercent / 100));
  const workerAmount = Math.round(totalAmount * (input.settings.revenueSplitWorkerPercent / 100));
  const adminAmount = totalAmount - workerAmount;
  return {
    baseAmount,
    multiplier,
    discountPercent,
    totalAmount,
    workerAmount,
    adminAmount,
  };
}
