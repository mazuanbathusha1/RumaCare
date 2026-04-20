import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  IsArray,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user.decorator";
import type { JwtPayload } from "../../common/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";
import { SettingsModule } from "../settings/settings.module";
import { SettingsService } from "../settings/settings.service";
import type { CategoryCode } from "@rumacare/shared";

const RECURRING_CATEGORIES: CategoryCode[] = ["PERSONAL_NURSING", "TUITION"];

class CreateSubscriptionDto {
  @IsIn(RECURRING_CATEGORIES)
  categoryCode!: CategoryCode;

  @IsUUID()
  serviceTypeId!: string;

  @IsOptional()
  @IsArray()
  subjectIds?: string[];

  @IsArray()
  weekdays!: number[];

  @IsLatitude() lat!: number;
  @IsLongitude() lng!: number;
  @IsString() address!: string;

  @IsString()
  startDate!: string; // ISO

  @IsInt() @Min(1) @Max(60)
  months!: number;
}

@Controller("subscriptions")
@UseGuards(JwtAuthGuard)
class SubscriptionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  @Post()
  @Roles("CUSTOMER")
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSubscriptionDto) {
    const settings = await this.settings.get();
    const start = new Date(dto.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + dto.months);
    const promptAt = new Date(start);
    promptAt.setDate(promptAt.getDate() + settings.renewalPromptAfterDays);
    return this.prisma.recurringSubscription.create({
      data: {
        categoryCode: dto.categoryCode,
        customerId: user.sub,
        serviceTypeId: dto.serviceTypeId,
        subjectIds: dto.subjectIds ?? [],
        weekdays: dto.weekdays,
        lat: dto.lat,
        lng: dto.lng,
        address: dto.address,
        startDate: start,
        endDate: end,
        renewalPromptAt: promptAt,
        status: "ACTIVE",
      },
    });
  }

  @Get("mine")
  @Roles("CUSTOMER")
  list(@CurrentUser() user: JwtPayload) {
    return this.prisma.recurringSubscription.findMany({
      where: { customerId: user.sub },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("renewal-due")
  @Roles("CUSTOMER")
  async renewalDue(@CurrentUser() user: JwtPayload) {
    return this.prisma.recurringSubscription.findMany({
      where: {
        customerId: user.sub,
        status: { in: ["ACTIVE", "RENEWAL_PROMPTED"] },
        renewalPromptAt: { lte: new Date() },
      },
    });
  }

  @Post(":id/accept-renewal")
  @Roles("CUSTOMER")
  async acceptRenewal(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const sub = await this.prisma.recurringSubscription.findUniqueOrThrow({
      where: { id },
    });
    if (sub.customerId !== user.sub) throw new BadRequestException();
    const serviceType = await this.prisma.serviceType.findUniqueOrThrow({
      where: { id: sub.serviceTypeId },
    });
    if (!serviceType.discountEnabled) {
      throw new BadRequestException("Renewal discount is not enabled for this service.");
    }
    const settings = await this.settings.get();
    // Nursing care renewal = 1 more month, Tuition renewal = 3 months (per spec)
    const monthsToAdd = sub.categoryCode === "TUITION" ? 3 : 1;
    const newEnd = new Date(sub.endDate);
    newEnd.setMonth(newEnd.getMonth() + monthsToAdd);
    const newPrompt = new Date(newEnd);
    newPrompt.setDate(newPrompt.getDate() - settings.renewalPromptAfterDays);
    return this.prisma.recurringSubscription.update({
      where: { id },
      data: {
        endDate: newEnd,
        renewalPromptAt: newPrompt,
        status: "RENEWED",
        discountPercent: serviceType.discountPercent,
      },
    });
  }

  @Post(":id/cancel")
  @Roles("CUSTOMER")
  async cancel(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const sub = await this.prisma.recurringSubscription.findUniqueOrThrow({
      where: { id },
    });
    if (sub.customerId !== user.sub) throw new BadRequestException();
    return this.prisma.recurringSubscription.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }
}

@Module({
  imports: [AuthModule, SettingsModule],
  controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}
