import { IsArray, IsEnum, IsInt, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class TaskReorderItemDto {
  @IsUUID()
  id: string;

  @IsInt()
  position: number;

  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class ReorderTaskDto {
  @ApiProperty({ type: [TaskReorderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskReorderItemDto)
  updates: TaskReorderItemDto[];
}
