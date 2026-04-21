import { Injectable, Logger } from "@nestjs/common";
import type { Booking } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { NotificationsService } from "../notifications/notifications.service";
import { haversineKm } from "@rumacare/shared";

@Injectable()
export class DispatcherService {
  private readonly logger = new Logger(DispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Broadcast a new booking to the N nearest eligible workers.
   * Workers with `autoAccept` are auto-accepted (first one wins).
   */
  async broadcast(booking: Booking): Promise<void> {
    const settings = await this.settingsService.get();
    const candidates = await this.prisma.workerProfile.findMany({
      where: {
        categories: { some: { categoryCode: booking.categoryCode } },
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: { user: true },
    });

    const ranked = candidates
      .map((wp) => ({
        wp,
        distanceKm: haversineKm(
          { lat: booking.lat, lng: booking.lng },
          { lat: wp.currentLat!, lng: wp.currentLng! },
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, settings.broadcastFanout);

    if (ranked.length === 0) {
      this.logger.warn(
        `No eligible workers for booking ${booking.id} (${booking.categoryCode})`,
      );
      return;
    }

    const expiresAt = new Date(Date.now() + settings.offerTimeoutMinutes * 60_000);

    await this.prisma.$transaction([
      this.prisma.bookingOffer.createMany({
        data: ranked.map(({ wp, distanceKm }) => ({
          bookingId: booking.id,
          workerId: wp.userId,
          distanceKm,
          expiresAt,
        })),
        skipDuplicates: true,
      }),
      this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: "OFFERED" },
      }),
    ]);

    // Any worker with autoAccept=true that was selected: accept for the first one in distance order.
    const autoAccept = ranked.find(({ wp }) => wp.autoAccept);
    if (autoAccept) {
      await this.acceptOffer(booking.id, autoAccept.wp.userId);
      return;
    }

    // Notify the broadcasted workers that a new offer is waiting for them.
    await this.notifications.sendToUsers(
      ranked.map(({ wp }) => wp.userId),
      {
        title: "New job offer",
        body: `${booking.categoryCode.replace("_", " ")} \u00b7 ${booking.address}`,
        data: { type: "offer.new", bookingId: booking.id },
      },
    );
  }

  /**
   * Worker accepts. Recall all other offers for the same booking.
   */
  async acceptOffer(bookingId: string, workerId: string): Promise<void> {
    const recalledWorkerIds: string[] = [];
    let customerId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      const offer = await tx.bookingOffer.findUnique({
        where: { bookingId_workerId: { bookingId, workerId } },
      });
      if (!offer || offer.status !== "PENDING") return;
      await tx.bookingOffer.update({
        where: { bookingId_workerId: { bookingId, workerId } },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      const toRecall = await tx.bookingOffer.findMany({
        where: { bookingId, NOT: { workerId }, status: "PENDING" },
        select: { workerId: true },
      });
      recalledWorkerIds.push(...toRecall.map((o) => o.workerId));
      await tx.bookingOffer.updateMany({
        where: { bookingId, NOT: { workerId }, status: "PENDING" },
        data: { status: "RECALLED", respondedAt: new Date() },
      });
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { workerId, status: "ACCEPTED" },
        select: { customerId: true },
      });
      customerId = updated.customerId;
    });

    if (recalledWorkerIds.length > 0) {
      await this.notifications.sendToUsers(recalledWorkerIds, {
        title: "Offer no longer available",
        body: "Another worker has accepted this job.",
        data: { type: "offer.recalled", bookingId },
      });
    }
    if (customerId) {
      await this.notifications.sendToUser(customerId, {
        title: "Booking accepted",
        body: "A worker has accepted your booking and is on the way.",
        data: { type: "booking.accepted", bookingId },
      });
    }
  }
}
