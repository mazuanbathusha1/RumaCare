import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../../common/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";

class UpsertSubjectDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  rate!: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

class PatchSubjectDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(0) rate?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

@Controller("subjects")
class SubjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.subject.findMany({ orderBy: { name: "asc" } });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  create(@Body() dto: UpsertSubjectDto) {
    return this.prisma.subject.create({ data: dto });
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  update(@Param("id") id: string, @Body() dto: PatchSubjectDto) {
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }
}

@Module({
  imports: [AuthModule],
  controllers: [SubjectsController],
})
export class SubjectsModule {}
