import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user.decorator";
import type { JwtPayload } from "../../common/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";

class UpsertCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  workerFeePerView?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

class PatchCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(0) workerFeePerView?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

@Controller("home-services/categories")
class HomeServiceCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.homeServiceCategory.findMany({ orderBy: { name: "asc" } });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  create(@Body() dto: UpsertCategoryDto) {
    return this.prisma.homeServiceCategory.create({ data: dto });
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() dto: PatchCategoryDto) {
    return this.prisma.homeServiceCategory.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.prisma.homeServiceCategory.delete({ where: { id } });
  }
}

@Controller("home-services/listings")
class HomeServiceListingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("categoryId") categoryId: string) {
    return this.prisma.homeServiceListing.findMany({
      where: categoryId ? { homeServiceCategoryId: categoryId } : undefined,
      orderBy: [{ preferredPartner: "desc" }, { averageRating: "desc" }, { ratingCount: "desc" }],
      include: { worker: { select: { id: true, name: true } } },
    });
  }

  @Post("view/:listingId")
  @UseGuards(JwtAuthGuard)
  @Roles("CUSTOMER")
  async viewContact(
    @Param("listingId") listingId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const listing = await this.prisma.homeServiceListing.findUniqueOrThrow({
      where: { id: listingId },
      include: { homeServiceCategory: true },
    });
    const fee = listing.homeServiceCategory.workerFeePerView;
    await this.prisma.$transaction([
      this.prisma.homeServiceContactView.create({
        data: {
          homeServiceCategoryId: listing.homeServiceCategoryId,
          customerId: user.sub,
          workerId: listing.workerId,
          feeCharged: fee,
        },
      }),
      this.prisma.payment.create({
        data: {
          userId: listing.workerId,
          kind: "WORKER_CONTACT_VIEW_FEE",
          amount: fee,
          note: `Contact-view fee for listing ${listing.id}`,
        },
      }),
    ]);
    return { phone: listing.phone, workerId: listing.workerId, feeCharged: fee };
  }
}

@Module({
  imports: [AuthModule],
  controllers: [HomeServiceCategoriesController, HomeServiceListingsController],
})
export class HomeServicesModule {}
