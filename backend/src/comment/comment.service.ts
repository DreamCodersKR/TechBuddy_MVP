import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.postComment.create({
      data: {
        postId,
        authorId,
        content,
        parentId,
      },
      include: {
        author: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
      },
    });
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
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, nickname: true, avatarUrl: true },
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
          select: { id: true, name: true, nickname: true, avatarUrl: true },
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
