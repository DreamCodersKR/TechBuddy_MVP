import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto, LoginDto, UserResponseDto } from '../user/dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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
}
