import { IsString, IsOptional, IsInt, IsArray, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  semester: number;

  @IsInt()
  subjectId: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(v => parseInt(v.trim(), 10));
    }
    if (Array.isArray(value)) {
      return value.map(v => parseInt(String(v), 10));
    }
    return value;
  })
  @IsArray()
  @IsInt({ each: true })
  divisionIds: number[];

  @IsDateString()
  dueDate: string;
}
