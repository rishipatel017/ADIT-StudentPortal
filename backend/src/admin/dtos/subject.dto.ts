import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Subject name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject code is required' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject type is required' })
  type: string;

  @IsOptional()
  @IsNumber()
  credits?: number;

  @IsInt()
  @IsNotEmpty({ message: 'Semester ID is required' })
  semesterId: number;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  @IsOptional()
  @IsNumber()
  credits?: number;

  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  semesterId?: number;
}
