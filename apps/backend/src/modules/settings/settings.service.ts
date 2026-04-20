import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DEFAULT_SETTINGS } from "@rumacare/shared";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const existing = await this.prisma.settings.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return this.prisma.settings.create({
      data: {
        id: 1,
        revenueSplitWorkerPercent: DEFAULT_SETTINGS.revenueSplitWorkerPercent,
        multiplierSat: DEFAULT_SETTINGS.multiplierSat,
        multiplierSun: DEFAULT_SETTINGS.multiplierSun,
        multiplierPublicHoliday: DEFAULT_SETTINGS.multiplierPublicHoliday,
        defaultCurrency: DEFAULT_SETTINGS.defaultCurrency,
        broadcastFanout: DEFAULT_SETTINGS.broadcastFanout,
        offerTimeoutMinutes: DEFAULT_SETTINGS.offerTimeoutMinutes,
        renewalPromptAfterDays: DEFAULT_SETTINGS.renewalPromptAfterDays,
        defaultDiscountPercent: DEFAULT_SETTINGS.defaultDiscountPercent,
      },
    });
  }

  async update(input: {
    revenueSplitWorkerPercent?: number;
    multiplierSat?: number;
    multiplierSun?: number;
    multiplierPublicHoliday?: number;
    broadcastFanout?: number;
    offerTimeoutMinutes?: number;
    renewalPromptAfterDays?: number;
    defaultDiscountPercent?: number;
  }) {
    await this.get();
    return this.prisma.settings.update({ where: { id: 1 }, data: input });
  }
}
