import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 북마크 토글 (추가 or 취소)
   */
  async toggle(userId: string, postId: string) {
    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    // 기존 북마크 확인
    const existingBookmark = await this.prisma.postBookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingBookmark) {
      // 북마크 취소
      await this.prisma.postBookmark.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return { bookmarked: false, message: '북마크가 취소되었습니다' };
    } else {
      // 북마크 추가
      await this.prisma.postBookmark.create({
        data: {
          postId,
          userId,
        },
      });
      return { bookmarked: true, message: '북마크에 추가되었습니다' };
    }
  }

  /**
   * 북마크 상태 확인
   */
  async getStatus(userId: string, postId: string) {
    const bookmark = await this.prisma.postBookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return {
      bookmarked: !!bookmark,
    };
  }

  /**
   * 내 북마크 목록 조회
   */
  async findMyBookmarks(userId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.postBookmark.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              author: {
                select: { id: true, name: true, nickname: true, avatarUrl: true },
              },
              postTags: {
                include: { tag: true },
              },
              _count: {
                select: { comments: true, likes: true },
              },
            },
          },
        },
      }),
      this.prisma.postBookmark.count({ where: { userId } }),
    ]);

    return {
      data: bookmarks.map((b) => b.post),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
