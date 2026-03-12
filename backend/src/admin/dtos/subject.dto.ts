import { IsString, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  credits?: number;

  @IsInt()
  semesterId: number;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  credits?: number;

  @IsOptional()
  @IsInt()
  semesterId?: number;
}
