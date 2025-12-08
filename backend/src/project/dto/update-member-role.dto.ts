import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: '변경할 역할',
    enum: ProjectRole,
    example: ProjectRole.TEAM_LEADER,
  })
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole;
}
