import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { SettingsService } from "./settings.service";

class UpdateSettingsDto {
  @IsOptional() @IsInt() @Min(0) @Max(100)
  revenueSplitWorkerPercent?: number;

  @IsOptional() @IsNumber() @Min(1)
  multiplierSat?: number;

  @IsOptional() @IsNumber() @Min(1)
  multiplierSun?: number;

  @IsOptional() @IsNumber() @Min(1)
  multiplierPublicHoliday?: number;

  @IsOptional() @IsInt() @Min(1)
  broadcastFanout?: number;

  @IsOptional() @IsInt() @Min(1)
  offerTimeoutMinutes?: number;

  @IsOptional() @IsInt() @Min(1)
  renewalPromptAfterDays?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100)
  defaultDiscountPercent?: number;
}

@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
