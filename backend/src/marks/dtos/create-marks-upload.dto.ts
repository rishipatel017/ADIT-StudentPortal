import { IsNumber, IsOptional } from 'class-validator';

export class CreateMarksUploadDto {
  @IsNumber()
  semester: number;

  @IsNumber()
  subjectId: number;

  @IsNumber()
  divisionId: number;

  @IsOptional()
  overwrite?: boolean;
}
