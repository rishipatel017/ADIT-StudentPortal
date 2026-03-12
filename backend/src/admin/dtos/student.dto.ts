import { IsString, IsEmail, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateStudentDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsString()
  enrollmentNo: string;

  @IsInt()
  divisionId: number;

  @IsInt()
  semesterId: number;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  enrollmentNo?: string;

  @IsOptional()
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @IsInt()
  semesterId?: number;
}
