import { Module } from "@nestjs/common";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { DispatcherService } from "./dispatcher.service";
import { ServiceTypesModule } from "../service-types/service-types.module";
import { SettingsModule } from "../settings/settings.module";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthModule, ServiceTypesModule, SettingsModule, NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService, DispatcherService],
  exports: [BookingsService, DispatcherService],
})
export class BookingsModule {}
