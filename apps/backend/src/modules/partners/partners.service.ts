import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { CategoryCode, PartnerApplicationStatus } from "@rumacare/shared";

export interface SubmitApplicationInput {
  userId: string;
  categories: CategoryCode[];
  fullName: string;
  icNumber: string;
  addressLine: string;
  bankName: string;
  bankAccountNumber: string;
  ssmNumber?: string;
  nursingCertUrl?: string;
  icCopyUrl: string;
  selfieUrl: string;
}

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(input: SubmitApplicationInput) {
    if (
      input.categories.includes("PERSONAL_NURSING") &&
      !input.nursingCertUrl
    ) {
      throw new BadRequestException(
        "Nursing certificate is required for Home Personal & Nursing Care partners.",
      );
    }
    const existing = await this.prisma.partnerApplication.findUnique({
      where: { userId: input.userId },
    });
    if (existing) {
      return this.prisma.partnerApplication.update({
        where: { userId: input.userId },
        data: {
          status: "SUBMITTED",
          categories: input.categories,
          fullName: input.fullName,
          icNumber: input.icNumber,
          addressLine: input.addressLine,
          bankName: input.bankName,
          bankAccountNumber: input.bankAccountNumber,
          ssmNumber: input.ssmNumber,
          nursingCertUrl: input.nursingCertUrl,
          icCopyUrl: input.icCopyUrl,
          selfieUrl: input.selfieUrl,
          submittedAt: new Date(),
        },
      });
    }
    return this.prisma.partnerApplication.create({
      data: {
        userId: input.userId,
        categories: input.categories,
        fullName: input.fullName,
        icNumber: input.icNumber,
        addressLine: input.addressLine,
        bankName: input.bankName,
        bankAccountNumber: input.bankAccountNumber,
        ssmNumber: input.ssmNumber,
        nursingCertUrl: input.nursingCertUrl,
        icCopyUrl: input.icCopyUrl,
        selfieUrl: input.selfieUrl,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
  }

  async get(id: string) {
    const app = await this.prisma.partnerApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("Application not found");
    return app;
  }

  list(status?: PartnerApplicationStatus) {
    return this.prisma.partnerApplication.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { submittedAt: "desc" },
    });
  }

  async review(id: string, status: "APPROVED" | "REJECTED", reason?: string) {
    const app = await this.prisma.partnerApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("Application not found");
    const updated = await this.prisma.partnerApplication.update({
      where: { id },
      data: { status, reviewedAt: new Date(), rejectionReason: reason ?? null },
    });
    if (status === "APPROVED") {
      const profile = await this.prisma.workerProfile.upsert({
        where: { userId: app.userId },
        update: {},
        create: { userId: app.userId },
      });
      for (const categoryCode of app.categories) {
        await this.prisma.workerCategory.upsert({
          where: {
            workerProfileId_categoryCode_homeServiceCategoryId: {
              workerProfileId: profile.id,
              categoryCode,
              homeServiceCategoryId: null as unknown as string,
            },
          },
          update: {},
          create: { workerProfileId: profile.id, categoryCode },
        });
      }
    }
    return updated;
  }
}
