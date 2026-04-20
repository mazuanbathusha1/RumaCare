import type {
  BookingStatus,
  OfferStatus,
  PartnerApplicationStatus,
  RateModel,
  SubscriptionStatus,
  TimeSlot,
  UserRole,
} from "./enums";
import type { CategoryCode } from "./categories";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface UserDto {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface ServiceTypeDto {
  id: string;
  categoryCode: CategoryCode;
  code: string;
  name: string;
  rateModel: RateModel;
  hourlyRate: number | null;
  rateAmSlot: number | null;
  ratePmSlot: number | null;
  rateEveningSlot: number | null;
  rateFullDay: number | null;
  workerFeePerView: number | null;
  discountEnabled: boolean;
  discountPercent: number;
  enabled: boolean;
}

export interface BookingDto {
  id: string;
  categoryCode: CategoryCode;
  serviceTypeId: string;
  customerId: string;
  workerId: string | null;
  status: BookingStatus;
  scheduledFor: string; // ISO
  slot: TimeSlot | null;
  durationHours: number | null;
  location: LatLng;
  address: string;
  totalAmount: number;
  workerAmount: number;
  adminAmount: number;
  multiplierApplied: number;
  discountPercent: number;
  recurringSubscriptionId: string | null;
}

export interface OfferDto {
  id: string;
  bookingId: string;
  workerId: string;
  status: OfferStatus;
  expiresAt: string;
  distanceKm: number;
}

export interface SubscriptionDto {
  id: string;
  categoryCode: CategoryCode;
  customerId: string;
  workerId: string | null;
  serviceTypeId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  renewalPromptAt: string;
  discountPercent: number;
}

export interface PartnerApplicationDto {
  id: string;
  userId: string;
  status: PartnerApplicationStatus;
  categories: CategoryCode[];
  fullName: string;
  icNumber: string;
  addressLine: string;
  bankName: string;
  bankAccountNumber: string;
  ssmNumber?: string;
  nursingCertUrl?: string;
  icCopyUrl: string;
  selfieUrl: string;
  submittedAt: string | null;
}
