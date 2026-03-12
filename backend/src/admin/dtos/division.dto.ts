import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateDivisionDto {
  @IsString()
  name: string;

  @IsInt()
  semesterId: number;
}

export class UpdateDivisionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  semesterId?: number;
}
