import { IsString, IsInt, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  semesterId?: number;

  @IsOptional()
  @IsInt()
  divisionId?: number;
}
