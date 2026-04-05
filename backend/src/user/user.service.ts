import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
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
          badge: BadgeType.NEW_MEMBER,
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
