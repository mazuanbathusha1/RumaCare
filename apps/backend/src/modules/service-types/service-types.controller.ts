import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { ServiceTypesService } from "./service-types.service";
import type { CategoryCode, RateModel } from "@rumacare/shared";

const CATEGORY_CODES: CategoryCode[] = [
  "PERSONAL_NURSING",
  "CLEANING",
  "NANNY",
  "TUITION",
  "HOME_SERVICES",
  "PARTNER",
];
const RATE_MODELS: RateModel[] = [
  "HOURLY",
  "HALF_OR_FULL_DAY",
  "PER_SUBJECT",
  "PACKAGE",
  "FIXED_WORKER_FEE",
];

class CreateServiceTypeDto {
  @IsIn(CATEGORY_CODES)
  categoryCode!: CategoryCode;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsIn(RATE_MODELS)
  rateModel!: RateModel;

  @IsOptional() @IsInt() @Min(0) hourlyRate?: number;
  @IsOptional() @IsInt() @Min(0) rateAmSlot?: number;
  @IsOptional() @IsInt() @Min(0) ratePmSlot?: number;
  @IsOptional() @IsInt() @Min(0) rateEveningSlot?: number;
  @IsOptional() @IsInt() @Min(0) rateFullDay?: number;
  @IsOptional() @IsInt() @Min(0) workerFeePerView?: number;
  @IsOptional() @IsBoolean() discountEnabled?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(100) discountPercent?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

class UpdateServiceTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn(RATE_MODELS) rateModel?: RateModel;
  @IsOptional() @IsInt() @Min(0) hourlyRate?: number;
  @IsOptional() @IsInt() @Min(0) rateAmSlot?: number;
  @IsOptional() @IsInt() @Min(0) ratePmSlot?: number;
  @IsOptional() @IsInt() @Min(0) rateEveningSlot?: number;
  @IsOptional() @IsInt() @Min(0) rateFullDay?: number;
  @IsOptional() @IsInt() @Min(0) workerFeePerView?: number;
  @IsOptional() @IsBoolean() discountEnabled?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(100) discountPercent?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

class ToggleDto {
  @IsBoolean() enabled!: boolean;
}

@Controller("service-types")
export class ServiceTypesController {
  constructor(private readonly service: ServiceTypesService) {}

  @Get()
  list(@Query("category") category?: CategoryCode) {
    return this.service.list(category);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.service.get(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  create(@Body() dto: CreateServiceTypeDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() dto: UpdateServiceTypeDto) {
    return this.service.update(id, dto);
  }

  @Patch(":id/toggle")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  toggle(@Param("id") id: string, @Body() dto: ToggleDto) {
    return this.service.toggle(id, dto.enabled);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
