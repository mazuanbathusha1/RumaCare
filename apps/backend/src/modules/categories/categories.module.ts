import { Controller, Get, Module } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("categories")
class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.serviceCategory.findMany({ orderBy: { order: "asc" } });
  }
}

@Module({ controllers: [CategoriesController] })
export class CategoriesModule {}
