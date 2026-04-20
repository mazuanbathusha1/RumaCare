import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { PartnersController } from "./partners.controller";
import { PartnersService } from "./partners.service";
import { AuthModule } from "../auth/auth.module";

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
