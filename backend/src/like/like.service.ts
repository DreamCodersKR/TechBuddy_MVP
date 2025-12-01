import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 좋아요 토글 (좋아요 추가 or 취소)
   */
  async toggle(userId: string, postId: string) {
    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    // 기존 좋아요 확인
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 좋아요 취소
      await this.prisma.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return { liked: false, message: '좋아요가 취소되었습니다' };
    } else {
      // 좋아요 추가
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
      return { liked: true, message: '좋아요를 눌렀습니다' };
    }
  }

  /**
   * 좋아요 상태 확인
   */
  async getStatus(userId: string, postId: string) {
    const like = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    const count = await this.prisma.postLike.count({
      where: { postId },
    });

    return {
      liked: !!like,
      count,
    };
  }

  /**
   * 게시글의 좋아요 수 조회
   */
  async getCount(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    const count = await this.prisma.postLike.count({
      where: { postId },
    });

    return { count };
  }
}
