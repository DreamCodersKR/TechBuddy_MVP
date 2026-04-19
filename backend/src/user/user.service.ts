import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  PublicUserResponseDto,
} from './dto';
import * as bcrypt from 'bcrypt';
import { BadgeType, CreditTransactionType } from '@prisma/client';
import { R2Service } from '../document/r2.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
  ) {}

  /**
   * 사용자 생성 (회원가입)
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, name, nickname, avatarUrl, bio, techStack } =
      createUserDto;

    // 이메일 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // 비밀번호 해싱
    const hashedPassword = await this.hashPassword(password);

    // 사용자 생성 + 웰컴 크레딧 100 + NEW_MEMBER 뱃지 + XP 50 (트랜잭션)
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          nickname: nickname || null,
          avatarUrl: avatarUrl || null,
          bio: bio || null,
          techStack: techStack || [],
          credit: 100,
          xp: 50,
        },
      });
      await tx.creditTransaction.create({
        data: {
          userId: newUser.id,
          amount: 100,
          type: CreditTransactionType.EARN,
          description: '가입 웰컴 크레딧',
        },
      });
      await tx.userBadge.create({
        data: {
          userId: newUser.id,
          badge: BadgeType.NEWBIE,
        },
      });
      return newUser;
    });

    return new UserResponseDto(user);
  }

  /**
   * 이메일로 사용자 찾기
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  /**
   * ID로 사용자 찾기
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return new UserResponseDto(user);
  }

  // ─── 이메일 수신 설정 ─────────────────────────────────────
  async getEmailPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailPreferences: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user.emailPreferences as Record<string, boolean>;
  }

  async updateEmailPreferences(userId: string, prefs: Record<string, boolean>) {
    const VALID_KEYS = ['marketing', 'commentReply', 'projectActivity', 'weeklySummary'];
    const current = await this.getEmailPreferences(userId);
    const updated = { ...current };
    for (const key of VALID_KEYS) {
      if (typeof prefs[key] === 'boolean') updated[key] = prefs[key];
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailPreferences: updated },
    });
    return updated;
  }

  // ─── 온보딩 ─────────────────────────────────────────────
  async completeOnboarding(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
    return { onboardingCompleted: true };
  }

  /**
   * 스트릭 정보 조회
   */
  async getStreak(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  /**
   * 활동 히트맵 조회 (TIL + DONE Task + 게시글 + 댓글 + AI 세션 합산)
   * @returns { [date: string]: number } 날짜별 활동 횟수
   */
  async getActivityHeatmap(
    userId: string,
    year: number,
  ): Promise<Record<string, number>> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const dateRange = { gte: startDate, lt: endDate };

    const [tils, tasks, posts, comments, aiSessions] = await Promise.all([
      this.prisma.til.findMany({
        where: { authorId: userId, date: dateRange },
        select: { date: true },
      }),
      this.prisma.task.findMany({
        where: { assigneeId: userId, status: 'DONE', updatedAt: dateRange },
        select: { updatedAt: true },
      }),
      this.prisma.post.findMany({
        where: { authorId: userId, createdAt: dateRange },
        select: { createdAt: true },
      }),
      this.prisma.postComment.findMany({
        where: { authorId: userId, createdAt: dateRange },
        select: { createdAt: true },
      }),
      this.prisma.aIConversation.findMany({
        where: { userId, createdAt: dateRange },
        select: { createdAt: true },
      }),
    ]);

    const heatmap: Record<string, number> = {};
    const add = (d: Date) => {
      const key = d.toISOString().slice(0, 10);
      heatmap[key] = (heatmap[key] ?? 0) + 1;
    };

    tils.forEach((t) => add(t.date));
    tasks.forEach((t) => add(t.updatedAt));
    posts.forEach((t) => add(t.createdAt));
    comments.forEach((t) => add(t.createdAt));
    aiSessions.forEach((t) => add(t.createdAt));

    return heatmap;
  }

  /**
   * 닉네임으로 미니 프로필 조회 (팝업용)
   */
  async getMiniProfile(nickname: string) {
    const user = await this.prisma.user.findUnique({
      where: { nickname },
      select: {
        id: true,
        nickname: true,
        name: true,
        avatarUrl: true,
        displayBadgeType: true,
        level: true,
        techStack: true,
        bio: true,
        portfolioPublic: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  /**
   * 공개 프로필 조회 (이메일 제외)
   */
  async findPublicProfile(id: string): Promise<PublicUserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatarUrl: true,
        displayBadgeType: true,
        bio: true,
        techStack: true,
        xp: true,
        level: true,
        githubUrl: true,
        portfolioUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return new PublicUserResponseDto(user);
  }

  /**
   * 프로필 이미지 업로드 (R2)
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다 (jpeg, png, gif, webp)');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('파일 크기는 5MB 이하여야 합니다');
    }
    // DRE-221: Magic bytes 검증 (Content-Type 위조 방지, file-type은 ESM이므로 dynamic import)
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME.includes(detected.mime)) {
      throw new BadRequestException('올바르지 않은 이미지 파일입니다');
    }

    const ext = file.mimetype.split('/')[1];
    const key = `avatars/${userId}/${Date.now()}.${ext}`;
    const avatarUrl = await this.r2.uploadFile(key, file.buffer, file.mimetype);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return new UserResponseDto(updatedUser);
  }

  /**
   * 비밀번호 해싱
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 비밀번호 검증
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // 사용자 존재 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // nickname이 변경되는 경우 중복 확인
    if (
      updateUserDto.nickname &&
      updateUserDto.nickname !== existingUser.nickname
    ) {
      const nicknameExists = await this.prisma.user.findUnique({
        where: { nickname: updateUserDto.nickname },
      });

      if (nicknameExists) {
        throw new ConflictException('이미 사용 중인 닉네임입니다');
      }
    }

    // 비밀번호가 포함된 경우 현재 비밀번호 검증 후 해싱
    const updateData = { ...updateUserDto } as Partial<UpdateUserDto> & {
      password?: string;
      currentPassword?: string;
    };
    if (updateUserDto.password) {
      if (!updateUserDto.currentPassword) {
        throw new UnauthorizedException('현재 비밀번호를 입력해주세요');
      }
      if (!existingUser.password) {
        throw new UnauthorizedException('소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다');
      }
      const isValid = await this.validatePassword(updateUserDto.currentPassword, existingUser.password);
      if (!isValid) {
        throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');
      }
      updateData.password = await this.hashPassword(updateUserDto.password);
    }
    delete updateData.currentPassword;

    // 사용자 정보 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return new UserResponseDto(updatedUser);
  }
}
