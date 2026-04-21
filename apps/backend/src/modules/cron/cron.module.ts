import { Injectable, Logger, Module } from "@nestjs/common";
import { Cron, CronExpression, ScheduleModule } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class RenewalCronService {
  private readonly logger = new Logger(RenewalCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Daily at 08:00 server time: flip any ACTIVE subscription whose
   * renewalPromptAt has passed into RENEWAL_PROMPTED. The customer app
   * surfaces these via GET /subscriptions/renewal-due.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async promptRenewals() {
    const now = new Date();
    const due = await this.prisma.recurringSubscription.findMany({
      where: {
        status: "ACTIVE",
        renewalPromptAt: { lte: now },
      },
      select: { id: true, customerId: true, categoryCode: true },
    });
    if (due.length === 0) return;
    await this.prisma.recurringSubscription.updateMany({
      where: { id: { in: due.map((s) => s.id) } },
      data: { status: "RENEWAL_PROMPTED" },
    });
    this.logger.log(`Flipped ${due.length} subscription(s) to RENEWAL_PROMPTED`);
    await Promise.all(
      due.map((s) =>
        this.notifications.sendToUser(s.customerId, {
          title: "Renew your subscription",
          body: "Continue your service with an exclusive discount.",
          data: { type: "subscription.renewal", subscriptionId: s.id },
        }),
      ),
    );
  }

  /**
   * Daily at 02:00: mark subscriptions whose endDate has passed as COMPLETED
   * (so they stop surfacing as active).
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async completeFinished() {
    const now = new Date();
    const result = await this.prisma.recurringSubscription.updateMany({
      where: {
        status: { in: ["ACTIVE", "RENEWAL_PROMPTED"] },
        endDate: { lt: now },
      },
      data: { status: "COMPLETED" },
    });
    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} subscription(s) COMPLETED`);
    }
  }
}

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, NotificationsModule],
  providers: [RenewalCronService],
})
export class CronModule {}
