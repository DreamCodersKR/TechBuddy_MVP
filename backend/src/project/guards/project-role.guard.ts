import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectRole } from '@prisma/client';
import { PROJECT_ROLES_KEY } from '../decorators/require-role.decorator';

/**
 * 프로젝트 역할 기반 접근 제어 가드
 *
 * 사용 방법:
 * 1. JwtAuthGuard와 함께 사용 (JwtAuthGuard가 먼저 실행되어야 함)
 * 2. @RequireRole() 데코레이터로 필요한 역할 지정
 *
 * @example
 * @UseGuards(JwtAuthGuard, ProjectRoleGuard)
 * @RequireRole(ProjectRole.PM) // PM만 접근
 * @Patch(':id')
 * updateProject() { ... }
 *
 * @example
 * @UseGuards(JwtAuthGuard, ProjectRoleGuard)
 * @RequireRole(ProjectRole.PM, ProjectRole.TEAM_LEADER) // PM 또는 TEAM_LEADER
 * @Post(':projectId/members')
 * inviteMember() { ... }
 */
@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. @RequireRole()에서 설정한 역할 목록 가져오기
    const requiredRoles = this.reflector.get<ProjectRole[]>(
      PROJECT_ROLES_KEY,
      context.getHandler(),
    );

    // @RequireRole()이 없으면 모든 멤버 허용 (단, 멤버 여부는 체크)
    const checkMemberOnly = !requiredRoles || requiredRoles.length === 0;

    // 2. Request에서 userId와 projectId 추출
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('인증이 필요합니다');
    }

    // projectId는 params.projectId 또는 params.id에서 추출
    const projectId = request.params.projectId || request.params.id;

    if (!projectId) {
      throw new ForbiddenException('프로젝트 ID가 필요합니다');
    }

    // 3. DB에서 프로젝트 멤버 조회
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    // 4. 멤버가 아니면 접근 거부
    if (!member) {
      throw new ForbiddenException('프로젝트 멤버가 아닙니다');
    }

    // 5. 멤버 여부만 체크하는 경우 (역할 상관없이 멤버면 OK)
    if (checkMemberOnly) {
      request.projectMember = member;
      return true;
    }

    // 6. 역할 체크
    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException(
        `이 작업은 ${requiredRoles.join(' 또는 ')} 권한이 필요합니다`,
      );
    }

    // 7. request에 멤버 정보 저장 (후속 로직에서 @ProjectMember()로 접근 가능)
    request.projectMember = member;

    return true;
  }
}
