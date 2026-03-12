import { IsString, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StudentAttendanceDto {
  @IsInt()
  studentId: number;

  @IsInt()
  status: number; // 1 for present, 0 for absent
}

export class UpdateAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  students: StudentAttendanceDto[];
}
