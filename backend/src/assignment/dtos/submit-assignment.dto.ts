import { IsString, IsOptional } from 'class-validator';

export class SubmitAssignmentDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}
