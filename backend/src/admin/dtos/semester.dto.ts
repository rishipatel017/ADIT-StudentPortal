import { IsInt, IsOptional } from 'class-validator';

export class CreateSemesterDto {
  @IsInt()
  number: number;

  @IsInt()
  @IsOptional()
  departmentId?: number;
}

export class UpdateSemesterDto {
  @IsOptional()
  @IsInt()
  number?: number;
}
