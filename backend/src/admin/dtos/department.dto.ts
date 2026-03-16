import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Department name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Department code is required' })
  @MinLength(2, { message: 'Code must be at least 2 characters' })
  code: string;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;
}
