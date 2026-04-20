import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { ServiceTypesService } from "../service-types/service-types.service";
import { DispatcherService } from "./dispatcher.service";
import { computePrice } from "./pricing";
import type { CategoryCode, TimeSlot } from "@rumacare/shared";

export interface CreateBookingInput {
  customerId: string;
  categoryCode: CategoryCode;
  serviceTypeId: string;
  scheduledFor: Date;
  slot?: TimeSlot;
  durationHours?: number;
  lat: number;
  lng: number;
  address: string;
  notes?: string;
  discountPercent?: number;
  recurringSubscriptionId?: string;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly serviceTypes: ServiceTypesService,
    private readonly dispatcher: DispatcherService,
  ) {}

  async create(input: CreateBookingInput) {
    const serviceType = await this.serviceTypes.get(input.serviceTypeId);
    if (!serviceType.enabled) {
      throw new BadRequestException("Service type is disabled");
    }
    const settings = await this.settings.get();
    const holiday = await this.prisma.publicHoliday.findUnique({
      where: { date: new Date(input.scheduledFor.toDateString()) },
    });
    const price = computePrice({
      serviceType,
      settings,
      scheduledFor: input.scheduledFor,
      slot: input.slot,
      durationHours: input.durationHours,
      discountPercent: input.discountPercent,
      isPublicHoliday: !!holiday,
    });
    const booking = await this.prisma.booking.create({
      data: {
        categoryCode: input.categoryCode,
        serviceTypeId: input.serviceTypeId,
        customerId: input.customerId,
        scheduledFor: input.scheduledFor,
        slot: input.slot ?? null,
        durationHours: input.durationHours ?? null,
        lat: input.lat,
        lng: input.lng,
        address: input.address,
        notes: input.notes,
        totalAmount: price.totalAmount,
        workerAmount: price.workerAmount,
        adminAmount: price.adminAmount,
        multiplierApplied: price.multiplier,
        discountPercent: price.discountPercent,
        recurringSubscriptionId: input.recurringSubscriptionId,
      },
    });
    await this.dispatcher.broadcast(booking);
    return this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: { offers: true },
    });
  }

  async cancel(id: string, customerId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.customerId !== customerId) {
      throw new BadRequestException("Not your booking");
    }
    if (!["PERSONAL_NURSING", "CLEANING", "NANNY"].includes(booking.categoryCode)) {
      throw new BadRequestException("This service cannot be cancelled by the customer");
    }
    if (booking.status === "COMPLETED") {
      throw new BadRequestException("Booking already completed");
    }
    return this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),
      this.prisma.bookingOffer.updateMany({
        where: { bookingId: id, status: "PENDING" },
        data: { status: "RECALLED" },
      }),
    ]);
  }

  async complete(id: string, workerId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException();
    if (booking.workerId !== workerId) {
      throw new BadRequestException("Not your booking");
    }
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
    await this.prisma.payment.createMany({
      data: [
        {
          bookingId: id,
          userId: booking.customerId,
          kind: "CUSTOMER_CHARGE",
          amount: booking.totalAmount,
        },
        {
          bookingId: id,
          userId: workerId,
          kind: "WORKER_PAYOUT",
          amount: booking.workerAmount,
        },
      ],
    });
    return updated;
  }

  async rate(bookingId: string, customerId: string, stars: number, comment?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException();
    if (booking.customerId !== customerId) throw new BadRequestException();
    if (!booking.workerId) throw new BadRequestException("No worker on this booking");
    if (stars < 1 || stars > 5) throw new BadRequestException();
    const rating = await this.prisma.rating.create({
      data: {
        bookingId,
        customerId,
        workerId: booking.workerId,
        stars,
        comment,
      },
    });
    // update worker's average rating on profile
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId: booking.workerId },
    });
    if (workerProfile) {
      const newCount = workerProfile.ratingCount + 1;
      const newAvg =
        (workerProfile.averageRating * workerProfile.ratingCount + stars) / newCount;
      await this.prisma.workerProfile.update({
        where: { userId: booking.workerId },
        data: { averageRating: newAvg, ratingCount: newCount },
      });
    }
    return rating;
  }

  async requestTutorChange(customerId: string, subscriptionId: string, reason?: string) {
    const sub = await this.prisma.recurringSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) throw new NotFoundException();
    if (sub.customerId !== customerId) throw new BadRequestException();
    if (sub.categoryCode !== "TUITION") {
      throw new BadRequestException("Tutor change only applies to Tuition");
    }
    const monthInMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - sub.startDate.getTime() < monthInMs) {
      throw new BadRequestException(
        "Tutor change can only be requested after 1 month of service",
      );
    }
    return this.prisma.tutorChangeRequest.create({
      data: { customerId, subscriptionId, reason },
    });
  }

  async listForCustomer(customerId: string) {
    return this.prisma.booking.findMany({
      where: { customerId },
      orderBy: { scheduledFor: "desc" },
    });
  }
}
