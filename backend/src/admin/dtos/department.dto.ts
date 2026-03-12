import { IsString, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name: string;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;
}
