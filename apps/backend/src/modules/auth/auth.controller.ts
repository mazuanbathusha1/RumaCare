import { Body, Controller, Post } from "@nestjs/common";
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";
import type { UserRole } from "@rumacare/shared";

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RegisterDto {
  @IsIn(["ADMIN", "CUSTOMER", "WORKER"])
  role!: UserRole;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
}
