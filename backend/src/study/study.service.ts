import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStudyWeekDto,
  UpdateStudyWeekDto,
  CreateStudyAssignmentDto,
  UpdateStudyAssignmentDto,
  CreateSubmissionDto,
  UpsertPenaltyRuleDto,
  CreateStudyResourceDto,
} from './dto';

@Injectable()
export class StudyService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 공통 헬퍼 ────────────────────────────────────────────────────────────

  private async assertStudyMember(workspaceId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('스터디룸 멤버가 아닙니다.');
    return member;
  }

  private async assertStudyAdmin(workspaceId: string, userId: string) {
    const member = await this.assertStudyMember(workspaceId, userId);
    if (member.role !== 'ADMIN') throw new ForbiddenException('관리자만 수행할 수 있습니다.');
    return member;
  }

  private async assertStudyWorkspace(workspaceId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: workspaceId },
      select: { type: true },
    });
    if (!project) throw new NotFoundException('워크스페이스를 찾을 수 없습니다.');
    if (project.type !== 'STUDY') throw new BadRequestException('스터디룸 전용 기능입니다.');
    return project;
  }

  // ─── 주차 (StudyWeek) ─────────────────────────────────────────────────────

  async getWeeks(workspaceId: string, userId: string) {
    await this.assertStudyWorkspace(workspaceId);
    await this.assertStudyMember(workspaceId, userId);

    return this.prisma.studyWeek.findMany({
      where: { projectId: workspaceId },
      include: {
        assignments: {
          include: {
            submissions: {
              select: { userId: true, status: true, submittedAt: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { weekNumber: 'asc' },
    });
  }

  async createWeek(workspaceId: string, userId: string, dto: CreateStudyWeekDto) {
    await this.assertStudyWorkspace(workspaceId);
    await this.assertStudyAdmin(workspaceId, userId);

    const existing = await this.prisma.studyWeek.findUnique({
      where: { projectId_weekNumber: { projectId: workspaceId, weekNumber: dto.weekNumber } },
    });
    if (existing) throw new ConflictException(`${dto.weekNumber}주차가 이미 존재합니다.`);

    return this.prisma.studyWeek.create({
      data: {
        projectId: workspaceId,
        weekNumber: dto.weekNumber,
        title: dto.title,
        goal: dto.goal,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async updateWeek(workspaceId: string, weekId: string, userId: string, dto: UpdateStudyWeekDto) {
    await this.assertStudyAdmin(workspaceId, userId);
    const week = await this.prisma.studyWeek.findFirst({ where: { id: weekId, projectId: workspaceId } });
    if (!week) throw new NotFoundException('주차를 찾을 수 없습니다.');

    return this.prisma.studyWeek.update({
      where: { id: weekId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteWeek(workspaceId: string, weekId: string, userId: string) {
    await this.assertStudyAdmin(workspaceId, userId);
    const week = await this.prisma.studyWeek.findFirst({ where: { id: weekId, projectId: workspaceId } });
    if (!week) throw new NotFoundException('주차를 찾을 수 없습니다.');

    await this.prisma.studyWeek.delete({ where: { id: weekId } });
  }

  // ─── 과제 (StudyAssignment) ───────────────────────────────────────────────

  async createAssignment(workspaceId: string, weekId: string, userId: string, dto: CreateStudyAssignmentDto) {
    await this.assertStudyAdmin(workspaceId, userId);
    const week = await this.prisma.studyWeek.findFirst({ where: { id: weekId, projectId: workspaceId } });
    if (!week) throw new NotFoundException('주차를 찾을 수 없습니다.');

    return this.prisma.studyAssignment.create({
      data: {
        weekId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async updateAssignment(workspaceId: string, assignmentId: string, userId: string, dto: UpdateStudyAssignmentDto) {
    await this.assertStudyAdmin(workspaceId, userId);
    const assignment = await this.prisma.studyAssignment.findFirst({
      where: { id: assignmentId, week: { projectId: workspaceId } },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');

    return this.prisma.studyAssignment.update({
      where: { id: assignmentId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async deleteAssignment(workspaceId: string, assignmentId: string, userId: string) {
    await this.assertStudyAdmin(workspaceId, userId);
    const assignment = await this.prisma.studyAssignment.findFirst({
      where: { id: assignmentId, week: { projectId: workspaceId } },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');

    await this.prisma.studyAssignment.delete({ where: { id: assignmentId } });
  }

  // ─── 과제 제출 현황 ───────────────────────────────────────────────────────

  async getSubmissions(workspaceId: string, assignmentId: string, userId: string) {
    await this.assertStudyMember(workspaceId, userId);
    const assignment = await this.prisma.studyAssignment.findFirst({
      where: { id: assignmentId, week: { projectId: workspaceId } },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');

    // 멤버 전원 + 제출 여부 조합
    const [members, submissions] = await Promise.all([
      this.prisma.projectMember.findMany({
        where: { projectId: workspaceId },
        include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
      }),
      this.prisma.studyAssignmentSubmission.findMany({
        where: { assignmentId },
        orderBy: { submittedAt: 'asc' },
      }),
    ]);

    const submissionMap = new Map(submissions.map((s) => [s.userId, s]));

    return members.map((m) => ({
      user: m.user,
      submission: submissionMap.get(m.userId) ?? null,
    }));
  }

  async submitAssignment(workspaceId: string, assignmentId: string, userId: string, dto: CreateSubmissionDto) {
    await this.assertStudyMember(workspaceId, userId);
    const assignment = await this.prisma.studyAssignment.findFirst({
      where: { id: assignmentId, week: { projectId: workspaceId } },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');

    // 지각 여부 판단
    const isLate = assignment.dueDate ? new Date() > assignment.dueDate : false;

    return this.prisma.studyAssignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      create: {
        assignmentId,
        userId,
        content: dto.content,
        proofUrl: dto.proofUrl,
        status: isLate ? 'LATE' : 'SUBMITTED',
      },
      update: {
        content: dto.content,
        proofUrl: dto.proofUrl,
        status: isLate ? 'LATE' : 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
  }

  async cancelSubmission(workspaceId: string, assignmentId: string, userId: string) {
    await this.assertStudyMember(workspaceId, userId);
    const submission = await this.prisma.studyAssignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId } },
    });
    if (!submission) throw new NotFoundException('제출 내역이 없습니다.');

    await this.prisma.studyAssignmentSubmission.delete({
      where: { assignmentId_userId: { assignmentId, userId } },
    });
  }

  // ─── 벌금 규칙 (StudyPenaltyRule) ────────────────────────────────────────

  async getPenaltyRule(workspaceId: string, userId: string) {
    await this.assertStudyMember(workspaceId, userId);

    const rule = await this.prisma.studyPenaltyRule.findUnique({
      where: { projectId: workspaceId },
      include: {
        consents: {
          include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
        },
        histories: {
          include: { user: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    // 전체 멤버 수 (활성화 조건 확인용)
    const memberCount = await this.prisma.projectMember.count({ where: { projectId: workspaceId } });

    return { rule, memberCount };
  }

  async upsertPenaltyRule(workspaceId: string, userId: string, dto: UpsertPenaltyRuleDto) {
    await this.assertStudyAdmin(workspaceId, userId);

    // 규칙을 변경하면 동의 초기화
    const existing = await this.prisma.studyPenaltyRule.findUnique({ where: { projectId: workspaceId } });

    if (existing) {
      // 기존 동의 전부 삭제 (설정 변경됨)
      await this.prisma.studyPenaltyConsent.deleteMany({ where: { penaltyRuleId: existing.id } });

      return this.prisma.studyPenaltyRule.update({
        where: { projectId: workspaceId },
        data: {
          depositAmount: dto.depositAmount,
          penaltyPerMiss: dto.penaltyPerMiss,
          periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
          periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
          isEnabled: false, // 변경 시 비활성화 → 재동의 필요
        },
      });
    }

    return this.prisma.studyPenaltyRule.create({
      data: {
        projectId: workspaceId,
        depositAmount: dto.depositAmount,
        penaltyPerMiss: dto.penaltyPerMiss,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
      },
    });
  }

  async consentPenalty(workspaceId: string, userId: string) {
    await this.assertStudyMember(workspaceId, userId);

    const rule = await this.prisma.studyPenaltyRule.findUnique({ where: { projectId: workspaceId } });
    if (!rule) throw new NotFoundException('벌금 규칙이 설정되지 않았습니다.');

    // 이미 동의한 경우
    const existing = await this.prisma.studyPenaltyConsent.findUnique({
      where: { penaltyRuleId_userId: { penaltyRuleId: rule.id, userId } },
    });
    if (existing) throw new ConflictException('이미 동의하셨습니다.');

    await this.prisma.studyPenaltyConsent.create({
      data: { penaltyRuleId: rule.id, userId },
    });

    // 전원 동의 시 자동 활성화
    const [consentCount, memberCount] = await Promise.all([
      this.prisma.studyPenaltyConsent.count({ where: { penaltyRuleId: rule.id } }),
      this.prisma.projectMember.count({ where: { projectId: workspaceId } }),
    ]);

    if (consentCount >= memberCount) {
      await this.prisma.studyPenaltyRule.update({
        where: { id: rule.id },
        data: { isEnabled: true },
      });
      return { activated: true, consentCount, memberCount };
    }

    return { activated: false, consentCount, memberCount };
  }

  async revokePenaltyConsent(workspaceId: string, userId: string) {
    await this.assertStudyMember(workspaceId, userId);

    const rule = await this.prisma.studyPenaltyRule.findUnique({ where: { projectId: workspaceId } });
    if (!rule) throw new NotFoundException('벌금 규칙이 없습니다.');
    if (rule.isEnabled) throw new BadRequestException('이미 활성화된 벌금 규칙은 동의를 철회할 수 없습니다.');

    await this.prisma.studyPenaltyConsent.deleteMany({
      where: { penaltyRuleId: rule.id, userId },
    });
  }

  // ─── 자료 공유 (StudyResource) ────────────────────────────────────────────

  async getResources(workspaceId: string, userId: string, category?: string) {
    await this.assertStudyMember(workspaceId, userId);

    return this.prisma.studyResource.findMany({
      where: {
        projectId: workspaceId,
        ...(category ? { category: category as any } : {}),
      },
      include: {
        uploadedBy: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createResource(workspaceId: string, userId: string, dto: CreateStudyResourceDto) {
    await this.assertStudyMember(workspaceId, userId);

    if (dto.category === 'LINK' && !dto.url) {
      throw new BadRequestException('링크 자료는 url이 필요합니다.');
    }

    return this.prisma.studyResource.create({
      data: {
        projectId: workspaceId,
        uploadedById: userId,
        title: dto.title,
        url: dto.url,
        category: dto.category as any,
      },
      include: {
        uploadedBy: { select: { id: true, nickname: true, avatarUrl: true } },
      },
    });
  }

  async deleteResource(workspaceId: string, resourceId: string, userId: string) {
    await this.assertStudyMember(workspaceId, userId);

    const resource = await this.prisma.studyResource.findFirst({
      where: { id: resourceId, projectId: workspaceId },
    });
    if (!resource) throw new NotFoundException('자료를 찾을 수 없습니다.');

    // 본인 업로드 또는 ADMIN만 삭제 가능
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: workspaceId, userId } },
    });
    if (resource.uploadedById !== userId && member?.role !== 'ADMIN') {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }

    await this.prisma.studyResource.delete({ where: { id: resourceId } });
  }
}
