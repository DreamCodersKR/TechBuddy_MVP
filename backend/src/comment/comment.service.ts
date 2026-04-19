import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../xp/xp.service';
import { NotificationService } from '../notification/notification.service';
import { QuestService, QUEST_KEYS } from '../quest/quest.service';
import { ModerationService } from '../moderation/moderation.service';
import { BadgeService } from '../badge/badge.service';
import { NotificationType } from '@prisma/client';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
    private readonly notification: NotificationService,
    private readonly quest: QuestService,
    private readonly moderation: ModerationService,
    private readonly badgeService: BadgeService,
  ) {}

  /**
   * 댓글 생성
   */
  async create(authorId: string, createCommentDto: CreateCommentDto) {
    const { postId, content, parentId } = createCommentDto;

    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    // 부모 댓글 존재 확인 (대댓글인 경우)
    if (parentId) {
      const parentComment = await this.prisma.postComment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다');
      }
    }

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        authorId,
        content,
        parentId,
      },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, avatarUrl: true, displayBadgeType: true },
        },
      },
    });

    // XP 부여: 댓글 작성 +5
    await this.xp.grantXP(authorId, 5);
    // 퀘스트 체크: 댓글 작성
    await this.quest.checkAndComplete(authorId, QUEST_KEYS.COMMENT_WRITE);

    // 알림: 게시글 작성자에게 댓글 알림 (본인 제외)
    await this.notification.create({
      recipientId: post.authorId,
      senderId: authorId,
      type: NotificationType.COMMENT_ADDED,
      title: '새 댓글이 달렸어요',
      message: `"${post.title}"에 댓글이 달렸습니다`,
      relatedId: postId,
    });

    // AI 콘텐츠 검열 (fire-and-forget)
    this.moderation.moderateComment(comment.id).catch((err) => this.logger.warn(`모더레이션 실패 (comment ${comment.id}): ${err.message}`));
    // 뱃지 체크 (fire-and-forget)
    this.badgeService.checkAndAwardBadges(authorId).catch((err) => this.logger.warn(`Badge check failed: ${err.message}`));

    return comment;
  }

  /**
   * 게시글별 댓글 목록 조회
   */
  async findByPostId(postId: string) {
    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    // 최상위 댓글만 조회 (대댓글은 replies로 포함)
    const comments = await this.prisma.postComment.findMany({
      where: {
        postId,
        parentId: null,
      },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, avatarUrl: true, displayBadgeType: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, nickname: true, avatarUrl: true, displayBadgeType: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  /**
   * 댓글 수정
   */
  async update(id: string, authorId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다');
    }

    if (comment.authorId !== authorId) {
      throw new NotFoundException('수정 권한이 없습니다');
    }

    return this.prisma.postComment.update({
      where: { id },
      data: { content: updateCommentDto.content },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, avatarUrl: true, displayBadgeType: true },
        },
      },
    });
  }

  /**
   * 댓글 삭제
   */
  async remove(id: string, authorId: string) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다');
    }

    if (comment.authorId !== authorId) {
      throw new NotFoundException('삭제 권한이 없습니다');
    }

    await this.prisma.postComment.delete({
      where: { id },
    });

    return { message: '댓글이 삭제되었습니다' };
  }
}
