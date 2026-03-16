import { IsString, IsEmail, IsNotEmpty, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateStudentDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Enrollment number is required' })
  enrollmentNo: string;

  @IsInt()
  @IsNotEmpty({ message: 'Division ID is required' })
  divisionId: number;

  @IsInt()
  @IsNotEmpty({ message: 'Semester ID is required' })
  semesterId: number;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  enrollmentNo?: string;

  @IsInt()
  @IsOptional()
  divisionId?: number;

  @IsInt()
  @IsOptional()
  semesterId?: number;
}
