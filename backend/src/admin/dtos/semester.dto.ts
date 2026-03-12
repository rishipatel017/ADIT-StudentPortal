import { IsNumber, IsInt, IsOptional } from 'class-validator';

export class CreateSemesterDto {
  @IsInt()
  number: number;
}

export class UpdateSemesterDto {
  @IsOptional()
  @IsInt()
  number?: number;
}
