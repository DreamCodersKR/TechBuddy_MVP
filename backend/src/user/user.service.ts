import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UserResponseDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        nickname: nickname || null,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        techStack: techStack || [],
      },
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
}
