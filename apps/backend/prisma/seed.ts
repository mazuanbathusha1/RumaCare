import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import {
  CATEGORIES,
  PERSONAL_NURSING_SERVICE_TYPES,
  CLEANING_SERVICE_TYPES,
  NANNY_SERVICE_TYPES,
  TUITION_SERVICE_TYPES,
  DEFAULT_SUBJECTS,
  DEFAULT_HOME_SERVICES,
  DEFAULT_SETTINGS,
} from "@rumacare/shared";

const prisma = new PrismaClient();

async function main() {
  // Settings (singleton)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      revenueSplitWorkerPercent: DEFAULT_SETTINGS.revenueSplitWorkerPercent,
      multiplierSat: DEFAULT_SETTINGS.multiplierSat,
      multiplierSun: DEFAULT_SETTINGS.multiplierSun,
      multiplierPublicHoliday: DEFAULT_SETTINGS.multiplierPublicHoliday,
      broadcastFanout: DEFAULT_SETTINGS.broadcastFanout,
      offerTimeoutMinutes: DEFAULT_SETTINGS.offerTimeoutMinutes,
      renewalPromptAfterDays: DEFAULT_SETTINGS.renewalPromptAfterDays,
      defaultDiscountPercent: DEFAULT_SETTINGS.defaultDiscountPercent,
    },
  });

  // Categories
  for (const c of CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { code: c.code },
      update: {
        order: c.order,
        name: c.name,
        description: c.description,
        bookable: c.bookable,
        hasServiceTypes: c.hasServiceTypes,
        isDirectory: c.isDirectory,
      },
      create: {
        code: c.code,
        order: c.order,
        name: c.name,
        description: c.description,
        bookable: c.bookable,
        hasServiceTypes: c.hasServiceTypes,
        isDirectory: c.isDirectory,
      },
    });
  }

  // Service Types
  const all = [
    ...PERSONAL_NURSING_SERVICE_TYPES.map((s) => ({ ...s, cat: "PERSONAL_NURSING" as const })),
    ...CLEANING_SERVICE_TYPES.map((s) => ({ ...s, cat: "CLEANING" as const })),
    ...NANNY_SERVICE_TYPES.map((s) => ({ ...s, cat: "NANNY" as const })),
    ...TUITION_SERVICE_TYPES.map((s) => ({ ...s, cat: "TUITION" as const })),
  ];
  for (const s of all) {
    await prisma.serviceType.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code: s.code,
        name: s.name,
        categoryCode: s.cat,
        rateModel: s.rateModel,
        hourlyRate: s.defaultHourlyRate ?? null,
        rateAmSlot: s.defaultRateAm ?? null,
        ratePmSlot: s.defaultRatePm ?? null,
        rateEveningSlot: s.defaultRateEvening ?? null,
        rateFullDay: s.defaultRateFullDay ?? null,
        discountEnabled: false,
        discountPercent: DEFAULT_SETTINGS.defaultDiscountPercent,
        enabled: true,
      },
    });
  }

  // Tuition "Per Subject" service type
  await prisma.serviceType.upsert({
    where: { code: "TU_PER_SUBJECT" },
    update: {},
    create: {
      code: "TU_PER_SUBJECT",
      name: "Per Subject Tuition",
      categoryCode: "TUITION",
      rateModel: "PER_SUBJECT",
      enabled: true,
      discountEnabled: false,
      discountPercent: DEFAULT_SETTINGS.defaultDiscountPercent,
    },
  });

  // Subjects
  for (const subject of DEFAULT_SUBJECTS) {
    await prisma.subject.upsert({
      where: { name: subject },
      update: {},
      create: { name: subject, rate: 15000, enabled: true },
    });
  }

  // Home services directory categories
  for (const name of DEFAULT_HOME_SERVICES) {
    await prisma.homeServiceCategory.upsert({
      where: { name },
      update: {},
      create: { name, enabled: true, workerFeePerView: 500 },
    });
  }

  // Admin user
  const adminEmail = "admin@rumacare.local";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        role: "ADMIN",
        email: adminEmail,
        name: "Admin",
        password: await argon2.hash("admin123"),
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded admin user: ${adminEmail} / admin123`);
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
