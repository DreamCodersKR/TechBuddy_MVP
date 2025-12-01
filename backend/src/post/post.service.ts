import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 게시글 생성
   */
  async create(authorId: string, createPostDto: CreatePostDto) {
    const { tags, ...postData } = createPostDto;

    return this.prisma.post.create({
      data: {
        ...postData,
        authorId,
        // 태그 처리: 기존 태그 찾거나 새로 생성
        postTags: tags?.length
          ? {
              create: tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
        postTags: {
          include: { tag: true },
        },
      },
    });
  }

  /**
   * 게시글 목록 조회 (페이지네이션, 필터링, 정렬)
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    boardId?: string;
    sortBy?: 'createdAt' | 'viewCount';
    order?: 'asc' | 'desc';
    tags?: string[];
  }) {
    const {
      page = 1,
      limit = 20,
      boardId,
      sortBy = 'createdAt',
      order = 'desc',
      tags,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      isPublished: true,
      ...(boardId && { boardId }),
      ...(tags?.length && {
        postTags: {
          some: {
            tag: {
              name: { in: tags },
            },
          },
        },
      }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
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
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 게시글 상세 조회 (조회수 증가)
   */
  async findOne(id: string, incrementView = true) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
        board: true,
        postTags: {
          include: { tag: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, nickname: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { likes: true, bookmarks: true, comments: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    // 조회수 증가
    if (incrementView) {
      await this.prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return post;
  }

  /**
   * 게시글 수정
   */
  async update(id: string, authorId: string, updatePostDto: UpdatePostDto) {
    const post = await this.findOne(id, false);

    if (post.authorId !== authorId) {
      throw new NotFoundException('수정 권한이 없습니다');
    }

    const { tags, ...postData } = updatePostDto;

    // 태그가 변경되면 기존 태그 삭제 후 새로 생성
    if (tags !== undefined) {
      await this.prisma.postTag.deleteMany({
        where: { postId: id },
      });
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...postData,
        postTags: tags?.length
          ? {
              create: tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
        postTags: {
          include: { tag: true },
        },
      },
    });
  }

  /**
   * 게시글 삭제
   */
  async remove(id: string, authorId: string) {
    const post = await this.findOne(id, false);

    if (post.authorId !== authorId) {
      throw new NotFoundException('삭제 권한이 없습니다');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: '게시글이 삭제되었습니다' };
  }

  /**
   * 게시글 검색
   */
  async search(params: {
    query: string;
    boardId?: string;
    page?: number;
    limit?: number;
  }) {
    const { query, boardId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      isPublished: true,
      ...(boardId && { boardId }),
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        {
          postTags: {
            some: {
              tag: { name: { contains: query, mode: 'insensitive' } },
            },
          },
        },
      ],
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        query,
      },
    };
  }
}
