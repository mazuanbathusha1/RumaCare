import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaModule } from "../../prisma/prisma.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { SettingsModule } from "../settings/settings.module";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user.decorator";
import type { JwtPayload } from "../../common/jwt-auth.guard";
import { Ipay88Service } from "./ipay88.service";
import { PaymentsService, IpayResponse } from "./payments.service";

@Controller("payments")
class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("bookings/:id/checkout")
  @UseGuards(JwtAuthGuard)
  @Roles("CUSTOMER")
  async checkout(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.payments.createBookingCheckout(id, user.sub);
  }

  @Post("ipay88/response")
  async ipayResponse(@Body() body: IpayResponse) {
    const payment = await this.payments.handleIpay88Response(body);
    return {
      ok: payment.status === "SUCCEEDED",
      status: payment.status,
      paymentId: payment.id,
      bookingId: payment.bookingId,
    };
  }

  /**
   * iPay88 server-to-server webhook. Must respond with "RECEIVEOK" exactly.
   */
  @Post("ipay88/backend")
  async ipayBackend(@Body() body: IpayResponse) {
    await this.payments.handleIpay88Response(body);
    return "RECEIVEOK";
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() user: JwtPayload,
    @Query("kind") kind?: string,
  ) {
    const where: Prisma.PaymentWhereInput = { userId: user.sub };
    if (kind) where.kind = kind as Prisma.PaymentWhereInput["kind"];
    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  @Get("admin/ledger")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  async adminLedger(@Query("kind") kind?: string) {
    const where: Prisma.PaymentWhereInput = kind
      ? { kind: kind as Prisma.PaymentWhereInput["kind"] }
      : {};
    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }
}

@Module({
  imports: [PrismaModule, AuthModule, SettingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, Ipay88Service],
  exports: [PaymentsService, Ipay88Service],
})
export class PaymentsModule {}
