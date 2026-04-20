import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { UserRole } from "@rumacare/shared";

export interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      req.user = payload;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(req.user.role)) {
      throw new UnauthorizedException("Insufficient role");
    }
    return true;
  }
}
