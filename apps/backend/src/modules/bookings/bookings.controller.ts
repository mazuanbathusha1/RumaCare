import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  IsDateString,
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
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user.decorator";
import type { JwtPayload } from "../../common/jwt-auth.guard";
import { BookingsService } from "./bookings.service";
import type { CategoryCode, TimeSlot } from "@rumacare/shared";

const CATEGORIES: CategoryCode[] = [
  "PERSONAL_NURSING",
  "CLEANING",
  "NANNY",
  "TUITION",
  "HOME_SERVICES",
  "PARTNER",
];
const SLOTS: TimeSlot[] = ["AM", "PM", "EVENING", "FULL_DAY"];

class CreateBookingDto {
  @IsIn(CATEGORIES)
  categoryCode!: CategoryCode;

  @IsUUID()
  serviceTypeId!: string;

  @IsDateString()
  scheduledFor!: string;

  @IsOptional() @IsIn(SLOTS) slot?: TimeSlot;
  @IsOptional() @IsInt() @Min(1) @Max(12) durationHours?: number;

  @IsLatitude() lat!: number;
  @IsLongitude() lng!: number;
  @IsString() address!: string;

  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) discountPercent?: number;
  @IsOptional() @IsUUID() recurringSubscriptionId?: string;
}

class RateBookingDto {
  @IsInt() @Min(1) @Max(5)
  stars!: number;

  @IsOptional() @IsString()
  comment?: string;
}

class TutorChangeDto {
  @IsUUID()
  subscriptionId!: string;

  @IsOptional() @IsString()
  reason?: string;
}

@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @Roles("CUSTOMER")
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookings.create({
      customerId: user.sub,
      categoryCode: dto.categoryCode,
      serviceTypeId: dto.serviceTypeId,
      scheduledFor: new Date(dto.scheduledFor),
      slot: dto.slot,
      durationHours: dto.durationHours,
      lat: dto.lat,
      lng: dto.lng,
      address: dto.address,
      notes: dto.notes,
      discountPercent: dto.discountPercent,
      recurringSubscriptionId: dto.recurringSubscriptionId,
    });
  }

  @Get("mine")
  @Roles("CUSTOMER")
  listMine(@CurrentUser() user: JwtPayload) {
    return this.bookings.listForCustomer(user.sub);
  }

  @Delete(":id")
  @Roles("CUSTOMER")
  cancel(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.bookings.cancel(id, user.sub);
  }

  @Post(":id/complete")
  @Roles("WORKER")
  complete(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.bookings.complete(id, user.sub);
  }

  @Post(":id/rate")
  @Roles("CUSTOMER")
  rate(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: RateBookingDto,
  ) {
    return this.bookings.rate(id, user.sub, dto.stars, dto.comment);
  }

  @Post("tutor-change")
  @Roles("CUSTOMER")
  tutorChange(@CurrentUser() user: JwtPayload, @Body() dto: TutorChangeDto) {
    return this.bookings.requestTutorChange(user.sub, dto.subscriptionId, dto.reason);
  }
}
