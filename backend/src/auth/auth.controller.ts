import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from '../user/dto';

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
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
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
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
