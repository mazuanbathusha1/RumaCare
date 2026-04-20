import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../../prisma/prisma.service";
import type { UserRole } from "@rumacare/shared";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(params: {
    role: UserRole;
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: params.email } });
    if (existing) throw new BadRequestException("Email already in use");
    const hashed = await argon2.hash(params.password);
    const user = await this.prisma.user.create({
      data: {
        role: params.role,
        name: params.name,
        email: params.email,
        phone: params.phone,
        password: hashed,
      },
    });
    if (params.role === "WORKER") {
      await this.prisma.workerProfile.create({ data: { userId: user.id } });
    }
    return this.issueToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const ok = await argon2.verify(user.password, password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.issueToken(user);
  }

  private async issueToken(user: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  }) {
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
    return {
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    };
  }
}
