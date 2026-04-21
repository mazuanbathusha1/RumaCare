import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { PartnersController } from "./partners.controller";
import { PartnersService } from "./partners.service";
import { AuthModule } from "../auth/auth.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [
    AuthModule,
    StorageModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
