import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsISO8601, IsOptional, IsString, MinLength } from "class-validator";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";

function toDateOnly(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new BadRequestException("date must be YYYY-MM-DD");
  const [, y, mo, d] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
}

class CreateHolidayDto {
  @IsISO8601() date!: string;
  @IsString() @MinLength(1) name!: string;
}

class UpdateHolidayDto {
  @IsOptional() @IsISO8601() date?: string;
  @IsOptional() @IsString() @MinLength(1) name?: string;
}

@Controller("public-holidays")
class PublicHolidaysPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.publicHoliday.findMany({ orderBy: { date: "asc" } });
  }
}

@Controller("admin/public-holidays")
@UseGuards(JwtAuthGuard)
class PublicHolidaysAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @Roles("ADMIN")
  async create(@Body() dto: CreateHolidayDto) {
    return this.prisma.publicHoliday.create({
      data: { date: toDateOnly(dto.date), name: dto.name },
    });
  }

  @Patch(":id")
  @Roles("ADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateHolidayDto) {
    return this.prisma.publicHoliday.update({
      where: { id },
      data: {
        ...(dto.date ? { date: toDateOnly(dto.date) } : {}),
        ...(dto.name ? { name: dto.name } : {}),
      },
    });
  }

  @Delete(":id")
  @Roles("ADMIN")
  async remove(@Param("id") id: string) {
    await this.prisma.publicHoliday.delete({ where: { id } });
    return { ok: true };
  }
}

@Module({
  imports: [AuthModule],
  controllers: [PublicHolidaysPublicController, PublicHolidaysAdminController],
})
export class PublicHolidaysModule {}
