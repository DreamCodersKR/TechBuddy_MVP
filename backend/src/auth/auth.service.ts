import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { UserService } from '../user/user.service';
import { XpService } from '../xp/xp.service';
import { BadgeService } from '../badge/badge.service';
import { ReferralService } from '../referral/referral.service';
import { CreditSchedulerService } from '../credit/credit.scheduler';
import { CreateUserDto, LoginDto, UserResponseDto } from '../user/dto';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType } from '@prisma/client';
import { GoogleProfile } from './strategies/google.strategy';
import { GitHubProfile } from './strategies/github.strategy';

export type OAuthProfile = GoogleProfile | GitHubProfile;

// Refresh Token 만료 시간 (7일)
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly xp: XpService,
    private readonly badge: BadgeService,
    private readonly referral: ReferralService,
    private readonly creditScheduler: CreditSchedulerService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 회원가입
   */
  async register(createUserDto: CreateUserDto) {
    const { referralCode, ...userData } = createUserDto;
    const user = await this.userService.create(userData as CreateUserDto);
    const accessToken = this.generateAccessToken(user.id, user.email);

    // 신규 가입 뱃지 부여
    await this.badge.awardBadge(user.id, BadgeType.NEWBIE);

    // 초기 크레딧 지급 (Free 플랜 100cr)
    await this.creditScheduler.grantInitialCredits(user.id);

    // 친구 초대 코드 처리
    if (referralCode) {
      await this.referral.applyReferral(user.id, referralCode);
    }

    return {
      user,
      accessToken,
    };
  }

  /**
   * 로그인
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 사용자 찾기
    const user = await this.userService.findByEmail(email);

    // DRE-214: 정지된 계정 차단
    if (user.isBanned) {
      throw new ForbiddenException('계정이 정지되었습니다. 문의사항은 고객센터로 연락해주세요.');
    }

    // 비밀번호 검증
    if (!user.password) {
      throw new UnauthorizedException('소셜 로그인 사용자입니다');
    }

    const isPasswordValid = await this.userService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다',
      );
    }

    // 스트릭 업데이트
    await this.updateStreak(user.id);

    // Access Token 생성
    const accessToken = this.generateAccessToken(user.id, user.email);

    return {
      user: new UserResponseDto(user),
      accessToken,
    };
  }

  /**
   * 연속 출석 스트릭 업데이트
   * - 오늘 처음 로그인: 어제 접속했으면 streak+1, 아니면 streak=1
   * - 이미 오늘 접속: 유지
   * - 스트릭 마일스톤(3/7/30일) 달성 시 크레딧 보상
   */
  async updateStreak(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
    });
    if (!user) return;

    // KST(UTC+9) 기준 오늘 날짜
    const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = new Date(kstNow.toISOString().split('T')[0]);

    const lastActive = user.lastActiveDate
      ? (() => {
          const kst = new Date(new Date(user.lastActiveDate).getTime() + 9 * 60 * 60 * 1000);
          return new Date(kst.toISOString().split('T')[0]);
        })()
      : null;

    // 오늘 이미 접속했으면 무시
    if (lastActive && lastActive.getTime() === today.getTime()) return;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isConsecutive = lastActive && lastActive.getTime() === yesterday.getTime();
    const newStreak = isConsecutive ? user.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, user.longestStreak);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: today,
      },
    });

    // 스트릭 마일스톤 크레딧 보상 (DRE-195: 3→3cr, 7→5cr, 30→30cr)
    const STREAK_REWARDS: Record<number, number> = { 3: 3, 7: 5, 30: 30 };
    if (STREAK_REWARDS[newStreak]) {
      await this.prisma.creditTransaction.create({
        data: {
          userId,
          amount: STREAK_REWARDS[newStreak],
          type: 'EARN',
          description: `${newStreak}일 연속 출석 보상`,
        },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { credit: { increment: STREAK_REWARDS[newStreak] } },
      });
    }

    // 30일 연속 출석 시 ATTENDANCE_30 뱃지 지급
    if (newStreak === 30) {
      this.badge
        .awardBadge(userId, BadgeType.ATTENDANCE_30)
        .catch((err) => console.warn('Badge award failed', err.message));
    }
  }

  /**
   * JWT Access Token 생성
   */
  generateAccessToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      type: 'access',
    };

    return this.jwtService.sign(payload);
  }

  /**
   * JWT 토큰 검증 및 사용자 조회
   */
  async validateUser(userId: string): Promise<UserResponseDto> {
    return this.userService.findById(userId);
  }

  // ============================================
  // Refresh Token 관련 메서드
  // ============================================

  /**
   * 토큰을 SHA-256으로 해시
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Refresh Token 생성 및 DB 저장
   * @returns 원본 토큰 (해시되지 않은 상태)
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomUUID();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Refresh Token 검증
   * @returns RefreshToken 레코드
   * @throws UnauthorizedException
   */
  async validateRefreshToken(token: string) {
    const tokenHash = this.hashToken(token);

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // 토큰이 존재하지 않음
    if (!refreshToken) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    // 이미 무효화된 토큰 (재사용 감지!)
    if (refreshToken.isRevoked) {
      // 보안: 해당 유저의 모든 토큰 무효화
      await this.revokeAllUserTokens(refreshToken.userId);
      throw new UnauthorizedException(
        '토큰이 재사용되었습니다. 보안을 위해 모든 세션이 로그아웃되었습니다.',
      );
    }

    // 만료된 토큰
    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('만료된 토큰입니다');
    }

    return refreshToken;
  }

  /**
   * Token Rotation: 기존 토큰 무효화 + 새 토큰 발급
   * @returns { accessToken, refreshToken }
   */
  async rotateRefreshToken(oldToken: string) {
    // 1. 기존 토큰 검증 (재사용 감지 포함)
    const oldRefreshToken = await this.validateRefreshToken(oldToken);

    // 2. 기존 토큰 무효화
    await this.revokeRefreshToken(oldToken);

    // 3. 새 토큰 쌍 생성
    const newRefreshToken = await this.generateRefreshToken(
      oldRefreshToken.userId,
    );
    const accessToken = this.generateAccessToken(
      oldRefreshToken.userId,
      oldRefreshToken.user.email,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: new UserResponseDto(oldRefreshToken.user),
    };
  }

  /**
   * 단일 Refresh Token 무효화
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  /**
   * 특정 유저의 모든 Refresh Token 무효화
   * (토큰 탈취 감지 시 호출)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  /**
   * DRE-220: 매일 자정 만료/폐기된 Refresh Token 자동 정리
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledTokenCleanup(): Promise<void> {
    const count = await this.cleanupExpiredTokens();
    console.log(`[Auth] 만료 Refresh Token ${count}개 정리 완료`);
  }

  /**
   * 만료된 Refresh Token 정리
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
    return result.count;
  }

  // ============================================
  // OAuth 관련 메서드
  // ============================================

  /**
   * OAuth 사용자 검증 및 생성/조회
   * - 기존 OAuth 사용자면 조회
   * - 새 OAuth 사용자면 생성
   * - 동일 이메일로 일반 가입한 사용자가 있으면 OAuth 정보 연결
   */
  async validateOAuthUser(profile: OAuthProfile): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const { provider, providerId, email, name, avatarUrl } = profile;

    // 1. provider + providerId로 기존 OAuth 사용자 검색
    let user = await this.prisma.user.findFirst({
      where: {
        provider,
        providerId,
      },
    });

    let isNewUser = false;

    // DRE-214: OAuth 로그인 시 정지된 계정 차단
    if (user && user.isBanned) {
      throw new ForbiddenException('계정이 정지되었습니다. 문의사항은 고객센터로 연락해주세요.');
    }

    if (!user) {
      // 2. 동일 이메일로 가입한 사용자가 있는지 확인
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        // 기존 사용자에 OAuth 정보 연결 (이미 다른 OAuth로 연결되어 있지 않은 경우)
        if (!existingUserByEmail.provider) {
          user = await this.prisma.user.update({
            where: { id: existingUserByEmail.id },
            data: {
              provider,
              providerId,
              avatarUrl: avatarUrl || existingUserByEmail.avatarUrl,
            },
          });
        } else {
          // 이미 다른 OAuth provider로 가입된 경우
          user = existingUserByEmail;
        }
      } else {
        // 3. 새 사용자 생성
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            provider,
            providerId,
            avatarUrl,
            password: null, // OAuth 사용자는 비밀번호 없음
          },
        });
        isNewUser = true;
      }
    }

    // 토큰 생성
    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    // 스트릭 업데이트 (신규 가입 제외)
    if (!isNewUser) {
      await this.updateStreak(user.id);
    }

    return {
      user: new UserResponseDto(user),
      accessToken,
      refreshToken,
      isNewUser,
    };
  }
}
