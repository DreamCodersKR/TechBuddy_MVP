import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority, TaskType } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: '로그인 페이지 UI 구현' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: '회원가입/로그인 폼 컴포넌트 작성' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskType })
  @IsEnum(TaskType)
  @IsOptional()
  taskType?: TaskType;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ example: 'sprint-uuid' })
  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @ApiPropertyOptional({ example: '2025-04-30' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: '기술적으로 막히는 부분이 있어 도움이 필요합니다' })
  @IsString()
  @IsOptional()
  helpReason?: string;
}
