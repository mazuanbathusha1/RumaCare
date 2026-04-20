import { Module, Controller, Get } from "@nestjs/common";

@Controller("health")
class HealthController {
  @Get()
  check() {
    return { ok: true, service: "rumacare-backend", time: new Date().toISOString() };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
