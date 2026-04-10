import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly apiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY', '');
  }

  /**
   * OpenAI Moderation API 호출
   */
  async checkContent(
    text: string,
  ): Promise<{ flagged: boolean; categories: Record<string, boolean> }> {
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY가 설정되지 않아 콘텐츠 검수를 건너뜁니다.');
      return { flagged: false, categories: {} };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ input: text }),
      });

      if (!response.ok) {
        this.logger.error(`OpenAI Moderation API 오류: ${response.status}`);
        return { flagged: false, categories: {} };
      }

      const data = await response.json();
      const result = data.results?.[0];

      return {
        flagged: result?.flagged ?? false,
        categories: result?.categories ?? {},
      };
    } catch (error) {
      this.logger.error('OpenAI Moderation API 호출 실패', error);
      return { flagged: false, categories: {} };
    }
  }

  /**
   * 관리자에게 콘텐츠 검열 알림 전송
   */
  private async notifyAdmin(contentType: string, contentId: string, authorNickname: string) {
    // 첫 번째 ADMIN 유저를 찾아 알림 전송
    const admin = await this.prisma.user.findFirst({
      where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
      select: { id: true },
    });

    if (!admin) return;

    const typeLabel: Record<string, string> = {
      post: '게시글',
      comment: '댓글',
      agora: '아고라 질문',
      agoraAnswer: '아고라 답변',
    };

    await this.prisma.notification.create({
      data: {
        recipientId: admin.id,
        type: NotificationType.CONTENT_MODERATED,
        title: `[자동검열] ${typeLabel[contentType] || contentType} 숨김 처리`,
        message: `${authorNickname}님의 ${typeLabel[contentType] || contentType}이(가) AI 콘텐츠 검열에 의해 숨김 처리되었습니다.`,
        relatedId: contentId,
      },
    });
  }

  /**
   * 게시글 검열
   */
  async moderatePost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, title: true, content: true, author: { select: { nickname: true } } },
    });
    if (!post) return;

    const { flagged } = await this.checkContent(`${post.title}\n${post.content}`);
    if (flagged) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { isHidden: true },
      });
      this.logger.warn(`게시글 숨김 처리: ${postId}`);
      await this.notifyAdmin('post', postId, post.author?.nickname || '알 수 없음');
    }
  }

  /**
   * 댓글 검열
   */
  async moderateComment(commentId: string) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      select: { id: true, content: true, author: { select: { nickname: true } } },
    });
    if (!comment) return;

    const { flagged } = await this.checkContent(comment.content);
    if (flagged) {
      await this.prisma.postComment.update({
        where: { id: commentId },
        data: { isHidden: true },
      });
      this.logger.warn(`댓글 숨김 처리: ${commentId}`);
      await this.notifyAdmin('comment', commentId, comment.author?.nickname || '알 수 없음');
    }
  }

  /**
   * 아고라 질문 검열
   */
  async moderateAgora(agoraId: string) {
    const agora = await this.prisma.agora.findUnique({
      where: { id: agoraId },
      select: { id: true, title: true, content: true, author: { select: { nickname: true } } },
    });
    if (!agora) return;

    const { flagged } = await this.checkContent(`${agora.title}\n${agora.content}`);
    if (flagged) {
      await this.prisma.agora.update({
        where: { id: agoraId },
        data: { isHidden: true },
      });
      this.logger.warn(`아고라 질문 숨김 처리: ${agoraId}`);
      await this.notifyAdmin('agora', agoraId, agora.author?.nickname || '알 수 없음');
    }
  }

  /**
   * 아고라 답변 검열
   */
  async moderateAgoraAnswer(answerId: string) {
    const answer = await this.prisma.agoraAnswer.findUnique({
      where: { id: answerId },
      select: { id: true, content: true, author: { select: { nickname: true } } },
    });
    if (!answer) return;

    const { flagged } = await this.checkContent(answer.content);
    if (flagged) {
      await this.prisma.agoraAnswer.update({
        where: { id: answerId },
        data: { isHidden: true },
      });
      this.logger.warn(`아고라 답변 숨김 처리: ${answerId}`);
      await this.notifyAdmin('agoraAnswer', answerId, answer.author?.nickname || '알 수 없음');
    }
  }
}
