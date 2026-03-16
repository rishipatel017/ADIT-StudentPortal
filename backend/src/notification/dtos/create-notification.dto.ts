import { IsString, IsInt, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum NotificationType {
  GENERAL = 'GENERAL',
  NOTICE = 'NOTICE',
  MARKS = 'MARKS',
  CHAT = 'CHAT',
  ASSIGNMENT = 'ASSIGNMENT',
}

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  semesterId?: number;

  @IsOptional()
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @IsBoolean()
  isForFaculty?: boolean;

  @IsOptional()
  @IsBoolean()
  isForStudents?: boolean;
}
