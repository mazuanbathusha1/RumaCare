import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Module,
  Patch,
  Query,
  UseGuards,
  Res,
} from "@nestjs/common";
import { IsBoolean, IsLatitude, IsLongitude, IsOptional } from "class-validator";
import type { Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user.decorator";
import type { JwtPayload } from "../../common/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";

class UpdateWorkerProfileDto {
  @IsOptional() @IsBoolean() autoAccept?: boolean;
  @IsOptional() @IsLatitude() currentLat?: number;
  @IsOptional() @IsLongitude() currentLng?: number;
}

@Controller("workers")
@UseGuards(JwtAuthGuard)
class WorkersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  @Roles("WORKER")
  async me(@CurrentUser() user: JwtPayload) {
    return this.prisma.workerProfile.findUnique({
      where: { userId: user.sub },
      include: { categories: true, user: { select: { id: true, name: true, email: true } } },
    });
  }

  @Patch("me")
  @Roles("WORKER")
  async update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateWorkerProfileDto) {
    return this.prisma.workerProfile.update({
      where: { userId: user.sub },
      data: dto,
    });
  }

  @Get("jobs")
  @Roles("WORKER")
  async jobs(
    @CurrentUser() user: JwtPayload,
    @Query("from") fromStr?: string,
    @Query("to") toStr?: string,
  ) {
    const where: Record<string, unknown> = { workerId: user.sub };
    if (fromStr || toStr) {
      where.scheduledFor = {
        ...(fromStr ? { gte: new Date(fromStr) } : {}),
        ...(toStr ? { lte: new Date(toStr) } : {}),
      };
    }
    return this.prisma.booking.findMany({
      where,
      orderBy: { scheduledFor: "desc" },
    });
  }

  @Get("jobs/yesterday")
  @Roles("WORKER")
  async yesterday(@CurrentUser() user: JwtPayload) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const jobs = await this.prisma.booking.findMany({
      where: {
        workerId: user.sub,
        scheduledFor: { gte: yesterday, lt: today },
      },
      orderBy: { scheduledFor: "asc" },
    });
    const totalEarned = jobs.reduce((sum, b) => sum + b.workerAmount, 0);
    return { jobs, totalEarned, count: jobs.length };
  }

  @Get("report.csv")
  @Roles("WORKER")
  async report(
    @CurrentUser() user: JwtPayload,
    @Query("from") fromStr: string,
    @Query("to") toStr: string,
    @Res() res: Response,
  ) {
    if (!fromStr || !toStr) {
      throw new BadRequestException("from and to query params required");
    }
    const jobs = await this.prisma.booking.findMany({
      where: {
        workerId: user.sub,
        scheduledFor: { gte: new Date(fromStr), lte: new Date(toStr) },
      },
      include: { serviceType: true },
      orderBy: { scheduledFor: "asc" },
    });
    const lines = [
      "date,category,service_type,status,total,worker_amount,admin_amount,multiplier,discount",
    ];
    for (const j of jobs) {
      lines.push(
        [
          j.scheduledFor.toISOString(),
          j.categoryCode,
          JSON.stringify(j.serviceType.name),
          j.status,
          (j.totalAmount / 100).toFixed(2),
          (j.workerAmount / 100).toFixed(2),
          (j.adminAmount / 100).toFixed(2),
          j.multiplierApplied.toFixed(2),
          `${j.discountPercent}%`,
        ].join(","),
      );
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rumacare-report-${fromStr}_${toStr}.csv"`,
    );
    res.send(lines.join("\n"));
  }
}

@Module({
  imports: [AuthModule],
  controllers: [WorkersController],
})
export class WorkersModule {}
