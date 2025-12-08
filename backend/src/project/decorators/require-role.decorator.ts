import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';

export const PROJECT_ROLES_KEY = 'projectRoles';

/**
 * 프로젝트 역할 기반 접근 제어 데코레이터
 * ProjectRoleGuard와 함께 사용
 *
 * @example
 * @RequireRole(ProjectRole.PM) // PM만 접근 가능
 * @RequireRole(ProjectRole.PM, ProjectRole.TEAM_LEADER) // PM 또는 TEAM_LEADER만 접근 가능
 */
export const RequireRole = (...roles: ProjectRole[]) =>
  SetMetadata(PROJECT_ROLES_KEY, roles);
