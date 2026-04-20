import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { CategoryCode, RateModel } from "@rumacare/shared";

export interface CreateServiceTypeInput {
  categoryCode: CategoryCode;
  code: string;
  name: string;
  rateModel: RateModel;
  hourlyRate?: number | null;
  rateAmSlot?: number | null;
  ratePmSlot?: number | null;
  rateEveningSlot?: number | null;
  rateFullDay?: number | null;
  workerFeePerView?: number | null;
  discountEnabled?: boolean;
  discountPercent?: number;
  enabled?: boolean;
}

export type UpdateServiceTypeInput = Partial<Omit<CreateServiceTypeInput, "code" | "categoryCode">>;

@Injectable()
export class ServiceTypesService {
  constructor(private readonly prisma: PrismaService) {}

  list(categoryCode?: CategoryCode) {
    return this.prisma.serviceType.findMany({
      where: categoryCode ? { categoryCode } : undefined,
      orderBy: { name: "asc" },
    });
  }

  async get(id: string) {
    const st = await this.prisma.serviceType.findUnique({ where: { id } });
    if (!st) throw new NotFoundException("Service type not found");
    return st;
  }

  create(input: CreateServiceTypeInput) {
    return this.prisma.serviceType.create({ data: input });
  }

  async update(id: string, input: UpdateServiceTypeInput) {
    await this.get(id);
    return this.prisma.serviceType.update({ where: { id }, data: input });
  }

  async toggle(id: string, enabled: boolean) {
    await this.get(id);
    return this.prisma.serviceType.update({ where: { id }, data: { enabled } });
  }

  async remove(id: string) {
    await this.get(id);
    return this.prisma.serviceType.delete({ where: { id } });
  }
}
