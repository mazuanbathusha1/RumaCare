import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { IsIn, IsOptional, IsString } from "class-validator";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user.decorator";
import type { JwtPayload } from "../../common/jwt-auth.guard";
import type { CategoryCode, PartnerApplicationStatus } from "@rumacare/shared";
import { PartnersService } from "./partners.service";

class SubmitPartnerDto {
  @IsString()
  categoriesJson!: string; // JSON array of CategoryCode

  @IsString() fullName!: string;
  @IsString() icNumber!: string;
  @IsString() addressLine!: string;
  @IsString() bankName!: string;
  @IsString() bankAccountNumber!: string;
  @IsOptional() @IsString() ssmNumber?: string;
}

class ReviewDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller("partners")
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Post("submit")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "icCopy", maxCount: 1 },
      { name: "selfie", maxCount: 1 },
      { name: "nursingCert", maxCount: 1 },
    ]),
  )
  submit(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitPartnerDto,
    @UploadedFiles()
    files: {
      icCopy?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
      nursingCert?: Express.Multer.File[];
    },
  ) {
    const icCopy = files.icCopy?.[0];
    const selfie = files.selfie?.[0];
    if (!icCopy || !selfie) {
      throw new Error("IC copy and selfie are required");
    }
    const categories = JSON.parse(dto.categoriesJson) as CategoryCode[];
    return this.partners.submit({
      userId: user.sub,
      categories,
      fullName: dto.fullName,
      icNumber: dto.icNumber,
      addressLine: dto.addressLine,
      bankName: dto.bankName,
      bankAccountNumber: dto.bankAccountNumber,
      ssmNumber: dto.ssmNumber,
      icCopyUrl: `/uploads/${icCopy.filename}`,
      selfieUrl: `/uploads/${selfie.filename}`,
      nursingCertUrl: files.nursingCert?.[0]
        ? `/uploads/${files.nursingCert[0].filename}`
        : undefined,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  list(@Query("status") status?: PartnerApplicationStatus) {
    return this.partners.list(status);
  }

  @Post(":id/review")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  review(@Param("id") id: string, @Body() dto: ReviewDto) {
    return this.partners.review(id, dto.status, dto.reason);
  }
}
