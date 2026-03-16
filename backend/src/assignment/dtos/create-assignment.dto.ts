import { IsString, IsOptional, IsInt, IsArray, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  semester: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  subjectId: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(v => parseInt(v, 10));
      } catch (e) {}
      return value.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
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
