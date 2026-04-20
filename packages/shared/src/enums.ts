export const UserRole = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
  WORKER: "WORKER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RateModel = {
  HOURLY: "HOURLY",
  HALF_OR_FULL_DAY: "HALF_OR_FULL_DAY",
  PER_SUBJECT: "PER_SUBJECT",
  PACKAGE: "PACKAGE",
  FIXED_WORKER_FEE: "FIXED_WORKER_FEE",
} as const;
export type RateModel = (typeof RateModel)[keyof typeof RateModel];

export const TimeSlot = {
  AM: "AM", // 08:00 - 12:00
  PM: "PM", // 13:00 - 17:00
  EVENING: "EVENING", // 18:00 - 22:00
  FULL_DAY: "FULL_DAY",
} as const;
export type TimeSlot = (typeof TimeSlot)[keyof typeof TimeSlot];

export const BookingStatus = {
  PENDING_DISPATCH: "PENDING_DISPATCH",
  OFFERED: "OFFERED",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  UNASSIGNED: "UNASSIGNED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const OfferStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  RECALLED: "RECALLED",
  EXPIRED: "EXPIRED",
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  RENEWAL_PROMPTED: "RENEWAL_PROMPTED",
  RENEWED: "RENEWED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PartnerApplicationStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type PartnerApplicationStatus =
  (typeof PartnerApplicationStatus)[keyof typeof PartnerApplicationStatus];
