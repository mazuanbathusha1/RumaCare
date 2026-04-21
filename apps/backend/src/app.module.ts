import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ServiceTypesModule } from "./modules/service-types/service-types.module";
import { SubjectsModule } from "./modules/subjects/subjects.module";
import { HomeServicesModule } from "./modules/home-services/home-services.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { OffersModule } from "./modules/offers/offers.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { WorkersModule } from "./modules/workers/workers.module";
import { HealthModule } from "./modules/health/health.module";
import { PublicHolidaysModule } from "./modules/public-holidays/public-holidays.module";
import { CronModule } from "./modules/cron/cron.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SettingsModule,
    CategoriesModule,
    ServiceTypesModule,
    SubjectsModule,
    HomeServicesModule,
    PartnersModule,
    BookingsModule,
    OffersModule,
    SubscriptionsModule,
    WorkersModule,
    HealthModule,
    PublicHolidaysModule,
    NotificationsModule,
    CronModule,
  ],
})
export class AppModule {}
