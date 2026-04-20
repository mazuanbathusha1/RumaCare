import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user.decorator";
import type { JwtPayload } from "../../common/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";
import { BookingsModule } from "../bookings/bookings.module";
import { DispatcherService } from "../bookings/dispatcher.service";

class DeclineDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller("offers")
@UseGuards(JwtAuthGuard)
class OffersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: DispatcherService,
  ) {}

  @Get("mine")
  @Roles("WORKER")
  listMine(@CurrentUser() user: JwtPayload) {
    return this.prisma.bookingOffer.findMany({
      where: { workerId: user.sub },
      orderBy: { createdAt: "desc" },
      include: { booking: true },
      take: 50,
    });
  }

  @Post(":id/accept")
  @Roles("WORKER")
  async accept(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const offer = await this.prisma.bookingOffer.findUniqueOrThrow({ where: { id } });
    if (offer.workerId !== user.sub) {
      throw new Error("Not your offer");
    }
    await this.dispatcher.acceptOffer(offer.bookingId, user.sub);
    return this.prisma.booking.findUnique({ where: { id: offer.bookingId } });
  }

  @Post(":id/decline")
  @Roles("WORKER")
  async decline(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() _dto: DeclineDto,
  ) {
    const offer = await this.prisma.bookingOffer.findUniqueOrThrow({ where: { id } });
    if (offer.workerId !== user.sub) throw new Error("Not your offer");
    return this.prisma.bookingOffer.update({
      where: { id },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
  }
}

@Module({
  imports: [AuthModule, BookingsModule],
  controllers: [OffersController],
})
export class OffersModule {}
