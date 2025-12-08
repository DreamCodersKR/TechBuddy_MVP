import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 게시판 목록 조회
   */
  async findAll() {
    return this.prisma.board.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 게시판 단일 조회
   */
  async findOne(id: string) {
    return this.prisma.board.findUnique({
      where: { id },
    });
  }

  /**
   * 게시판 이름으로 조회
   */
  async findByName(name: string) {
    return this.prisma.board.findUnique({
      where: { name },
    });
  }
}
