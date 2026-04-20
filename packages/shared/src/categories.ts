import type { RateModel } from "./enums";

export const CATEGORY_CODES = {
  PERSONAL_NURSING: "PERSONAL_NURSING",
  CLEANING: "CLEANING",
  NANNY: "NANNY",
  TUITION: "TUITION",
  HOME_SERVICES: "HOME_SERVICES",
  PARTNER: "PARTNER",
} as const;
export type CategoryCode = (typeof CATEGORY_CODES)[keyof typeof CATEGORY_CODES];

export interface CategoryDef {
  code: CategoryCode;
  order: number;
  name: string;
  description: string;
  bookable: boolean;
  /** Whether this category has per-service-type rate config in Admin list-mgmt. */
  hasServiceTypes: boolean;
  /** True for the Yellow-Pages style category (#5) where workers pay per contact view. */
  isDirectory: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  {
    code: "PERSONAL_NURSING",
    order: 1,
    name: "Home Personal & Nursing Care",
    description:
      "Wound care, post-surgical care, therapy, personal care, and accompaniment services.",
    bookable: true,
    hasServiceTypes: true,
    isDirectory: false,
  },
  {
    code: "CLEANING",
    order: 2,
    name: "Cleaning",
    description: "Half-day or full-day home cleaning.",
    bookable: true,
    hasServiceTypes: true,
    isDirectory: false,
  },
  {
    code: "NANNY",
    order: 3,
    name: "Super Nanny",
    description: "Half-day or full-day childcare.",
    bookable: true,
    hasServiceTypes: true,
    isDirectory: false,
  },
  {
    code: "TUITION",
    order: 4,
    name: "Tuition & Private Tutoring",
    description: "Per-subject or 4-subject package home tuition on a monthly plan.",
    bookable: true,
    hasServiceTypes: true,
    isDirectory: false,
  },
  {
    code: "HOME_SERVICES",
    order: 5,
    name: "Home Services",
    description:
      "Yellow-pages directory of home-service workers. Workers pay a fixed fee each time a customer views their contact details.",
    bookable: false,
    hasServiceTypes: false,
    isDirectory: true,
  },
  {
    code: "PARTNER",
    order: 6,
    name: "Be our Partner",
    description: "Register as a RumaCare partner.",
    bookable: false,
    hasServiceTypes: false,
    isDirectory: false,
  },
];

export interface ServiceTypeSeed {
  code: string;
  name: string;
  rateModel: RateModel;
  /** Default rate in sen (MYR smallest unit). */
  defaultHourlyRate?: number;
  defaultRateAm?: number;
  defaultRatePm?: number;
  defaultRateEvening?: number;
  defaultRateFullDay?: number;
}

/**
 * Home Personal & Nursing Care service types.
 * 1.1 – 1.8 : hourly rate
 * 1.9 & 2.0 : half-day / full-day rate
 */
export const PERSONAL_NURSING_SERVICE_TYPES: ServiceTypeSeed[] = [
  { code: "PN_WOUND_CARE", name: "Wound Care & Dressing Changes", rateModel: "HOURLY", defaultHourlyRate: 8000 },
  { code: "PN_POST_SURGICAL", name: "Post Surgical Care & Stitch Removal", rateModel: "HOURLY", defaultHourlyRate: 9000 },
  { code: "PN_IV_THERAPY", name: "IV Therapy & Injections", rateModel: "HOURLY", defaultHourlyRate: 10000 },
  { code: "PN_CATHETER_OSTOMY", name: "Catheter or Ostomy Care", rateModel: "HOURLY", defaultHourlyRate: 9500 },
  { code: "PN_MEDICATION_ADMIN", name: "Medication Administration", rateModel: "HOURLY", defaultHourlyRate: 7000 },
  { code: "PN_PHYSIO", name: "Physiotherapy", rateModel: "HOURLY", defaultHourlyRate: 12000 },
  { code: "PN_OCCUPATIONAL", name: "Occupational Therapy", rateModel: "HOURLY", defaultHourlyRate: 12000 },
  { code: "PN_SPEECH", name: "Speech Therapy", rateModel: "HOURLY", defaultHourlyRate: 12000 },
  {
    code: "PN_PERSONAL_CARE",
    name: "Personal Care (Bathing, grooming, toileting, feeding, mobility)",
    rateModel: "HALF_OR_FULL_DAY",
    defaultRateAm: 12000,
    defaultRatePm: 12000,
    defaultRateEvening: 14000,
    defaultRateFullDay: 28000,
  },
  {
    code: "PN_ACCOMPANIMENT",
    name: "Accompaniment to Appointments / Work / Activities / Shopping",
    rateModel: "HALF_OR_FULL_DAY",
    defaultRateAm: 11000,
    defaultRatePm: 11000,
    defaultRateEvening: 13000,
    defaultRateFullDay: 26000,
  },
];

export const CLEANING_SERVICE_TYPES: ServiceTypeSeed[] = [
  {
    code: "CL_STANDARD",
    name: "Cleaning",
    rateModel: "HALF_OR_FULL_DAY",
    defaultRateAm: 10000,
    defaultRatePm: 10000,
    defaultRateEvening: 12000,
    defaultRateFullDay: 22000,
  },
];

export const NANNY_SERVICE_TYPES: ServiceTypeSeed[] = [
  {
    code: "NN_STANDARD",
    name: "Nanny",
    rateModel: "HALF_OR_FULL_DAY",
    defaultRateAm: 11000,
    defaultRatePm: 11000,
    defaultRateEvening: 13000,
    defaultRateFullDay: 26000,
  },
];

export const TUITION_SERVICE_TYPES: ServiceTypeSeed[] = [
  {
    code: "TU_PACKAGE_4",
    name: "Package (4 subjects)",
    rateModel: "PACKAGE",
    defaultHourlyRate: 60000, // per month
  },
];

export const DEFAULT_SUBJECTS = [
  "Mathematics",
  "Additional Mathematics",
  "English",
  "Bahasa Malaysia",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
];

export const DEFAULT_HOME_SERVICES = [
  "Gardening",
  "IT (Computer, Laptop & Printer)",
  "Plumber",
  "Typical Contractor (tiles, ceiling, waterproofing)",
  "Air-Conditioner Repair, Service & Relocation",
  "Painting",
  "Electric & Electronics (TV, Lights, Fan)",
  "Gas",
];
