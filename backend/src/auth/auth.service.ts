import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { UserService } from '../user/user.service';
import { CreateUserDto, LoginDto, UserResponseDto } from '../user/dto';
import { PrismaService } from '../prisma/prisma.service';

// Refresh Token 만료 시간 (7일)
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 회원가입
   */
  async register(createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    const accessToken = this.generateAccessToken(user.id, user.email);

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

    // Access Token 생성
    const accessToken = this.generateAccessToken(user.id, user.email);

    return {
      user: new UserResponseDto(user),
      accessToken,
    };
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
   * 만료된 Refresh Token 정리 (선택적 - 크론잡으로 실행 가능)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
    return result.count;
  }
}
