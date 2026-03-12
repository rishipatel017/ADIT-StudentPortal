import { IsEmail, IsEnum, IsString, IsOptional, IsNumber, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  name: string;

  // Optional fields for faculty
  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  pastExperienceYears?: number;

  @IsOptional()
  @IsNumber()
  departmentId?: number;

  // Optional fields for student
  @IsOptional()
  @IsString()
  enrollmentNo?: string;

  @IsOptional()
  @IsNumber()
  divisionId?: number;

  @IsOptional()
  @IsNumber()
  semesterId?: number;
}
