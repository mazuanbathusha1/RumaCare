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
import { StorageService } from "../storage/storage.service";

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
  constructor(
    private readonly partners: PartnersService,
    private readonly storage: StorageService,
  ) {}

  @Post("submit")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "icCopy", maxCount: 1 },
      { name: "selfie", maxCount: 1 },
      { name: "nursingCert", maxCount: 1 },
    ]),
  )
  async submit(
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
    const [icObj, selfieObj, nursingObj] = await Promise.all([
      this.storage.putObject({
        keyPrefix: "partners/ic-copy",
        filename: icCopy.originalname,
        contentType: icCopy.mimetype,
        body: icCopy.buffer,
      }),
      this.storage.putObject({
        keyPrefix: "partners/selfie",
        filename: selfie.originalname,
        contentType: selfie.mimetype,
        body: selfie.buffer,
      }),
      files.nursingCert?.[0]
        ? this.storage.putObject({
            keyPrefix: "partners/nursing-cert",
            filename: files.nursingCert[0].originalname,
            contentType: files.nursingCert[0].mimetype,
            body: files.nursingCert[0].buffer,
          })
        : Promise.resolve(null),
    ]);
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
      icCopyUrl: icObj.url,
      selfieUrl: selfieObj.url,
      nursingCertUrl: nursingObj?.url,
    });
  }

  /**
   * Returns short-lived view URLs for a partner application's documents.
   * Admin-only: used by the admin portal to preview IC copy / selfie /
   * Nursing Cert without baking long-lived S3 URLs into the DB.
   */
  @Get(":id/documents")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  async documents(@Param("id") id: string) {
    const app = await this.partners.get(id);
    const [icCopyUrl, selfieUrl, nursingCertUrl] = await Promise.all([
      this.storage.resolveUrl(app.icCopyUrl),
      this.storage.resolveUrl(app.selfieUrl),
      app.nursingCertUrl ? this.storage.resolveUrl(app.nursingCertUrl) : Promise.resolve(null),
    ]);
    return { icCopyUrl, selfieUrl, nursingCertUrl };
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
