import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ProjectMember as ProjectMemberModel } from '@prisma/client';

/**
 * ProjectRoleGuard에서 저장한 프로젝트 멤버 정보를 추출하는 파라미터 데코레이터
 * ProjectRoleGuard와 함께 사용해야 함
 *
 * @example
 * @UseGuards(JwtAuthGuard, ProjectRoleGuard)
 * @RequireRole(ProjectRole.PM)
 * updateProject(@ProjectMember() member: ProjectMemberModel) {
 *   console.log(member.role); // PM
 * }
 */
export const ProjectMember = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ProjectMemberModel | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.projectMember;
  },
);
