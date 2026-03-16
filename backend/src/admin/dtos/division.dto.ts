import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty({ message: 'Division name is required' })
  name: string;

  @IsInt()
  @IsNotEmpty({ message: 'Semester ID is required' })
  semesterId: number;
}

export class UpdateDivisionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  semesterId?: number;
}
