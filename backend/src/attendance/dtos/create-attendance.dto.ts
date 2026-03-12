import { IsString, IsOptional, IsInt, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StudentAttendanceDto {
  @IsInt()
  studentId: number;

  @IsInt()
  status: number; // 1 for present, 0 for absent
}

export class CreateAttendanceDto {
  @IsInt()
  semester: number;

  @IsInt()
  subjectId: number;

  @IsInt()
  divisionId: number;

  @IsInt()
  lectureNo: number;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsDateString()
  lectureDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  students: StudentAttendanceDto[];
}
