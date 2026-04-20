import {
  Body,
  Controller,
  Delete,
  Module,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsOptional, IsString, MinLength } from "class-validator";
import { PrismaService } from "../../prisma/prisma.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { CurrentUser } from "../../common/current-user.decorator";
import type { JwtPayload } from "../../common/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";
import { NotificationsService } from "./notifications.service";

class RegisterTokenDto {
  @IsString() @MinLength(1) token!: string;
  @IsOptional() @IsString() platform?: string;
}

@Controller("devices")
@UseGuards(JwtAuthGuard)
class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("push-token")
  async register(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterTokenDto,
  ) {
    await this.prisma.pushToken.upsert({
      where: { token: dto.token },
      update: { userId: user.sub, platform: dto.platform ?? null },
      create: { userId: user.sub, token: dto.token, platform: dto.platform ?? null },
    });
    return { ok: true };
  }

  @Delete("push-token")
  async unregister(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterTokenDto,
  ) {
    await this.prisma.pushToken.deleteMany({
      where: { userId: user.sub, token: dto.token },
    });
    return { ok: true };
  }
}

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DevicesController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
