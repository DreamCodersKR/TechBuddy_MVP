import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from '../user/dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

// Cookie 설정 상수
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7일

@ApiTags('인증')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입
   */
  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
  })
  @ApiResponse({
    status: 409,
    description: '이메일 중복',
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
  })
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(createUserDto);

    // Refresh Token 생성 및 Cookie 설정
    const refreshToken = await this.authService.generateRefreshToken(
      result.user.id,
    );
    this.setRefreshTokenCookie(res, refreshToken);

    return result;
  }

  /**
   * 회원가입 (legacy)
   */
  @Post('register')
  @ApiOperation({ summary: '회원가입 (legacy)' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
  })
  @ApiResponse({
    status: 409,
    description: '이메일 중복',
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * 로그인
   */
  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Refresh Token 생성 및 Cookie 설정
    const refreshToken = await this.authService.generateRefreshToken(
      result.user.id,
    );
    this.setRefreshTokenCookie(res, refreshToken);

    return result;
  }

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 필요',
  })
  async getMe(@CurrentUser() user: any) {
    return this.authService.validateUser(user.id);
  }

  // ============================================
  // Refresh Token 관련 엔드포인트
  // ============================================

  /**
   * 토큰 갱신 (Token Rotation)
   */
  @Post('refresh')
  @ApiCookieAuth()
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않은 Refresh Token',
  })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as
      | string
      | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh Token이 없습니다');
    }

    // Token Rotation 수행
    const result = await this.authService.rotateRefreshToken(refreshToken);

    // 새 Refresh Token을 Cookie에 설정
    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  /**
   * 로그아웃
   */
  @Post('logout')
  @ApiCookieAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as
      | string
      | undefined;

    // Refresh Token이 있으면 무효화
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    // Cookie 삭제
    this.clearRefreshTokenCookie(res);

    return { message: '로그아웃 되었습니다' };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Refresh Token Cookie 설정
   */
  private setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/auth',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  /**
   * Refresh Token Cookie 삭제
   */
  private clearRefreshTokenCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 0,
    });
  }
}
