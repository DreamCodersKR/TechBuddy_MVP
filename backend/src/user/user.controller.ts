import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  PublicUserResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { TaskService } from '../task/task.service';

@ApiTags('사용자')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly taskService: TaskService,
  ) {}

  /**
   * 사용자 생성 (회원가입) - /auth/signup 사용 권장
   */
  @Post()
  @ApiOperation({ summary: '사용자 생성', description: '회원가입은 /auth/signup 사용 권장' })
  @ApiResponse({
    status: 201,
    description: '사용자 생성 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
  })
  @ApiResponse({
    status: 409,
    description: '이메일 중복',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 조회', description: '현재 로그인한 사용자의 정보를 조회합니다' })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 필요',
  })
  async getMe(@CurrentUser() user: any): Promise<UserResponseDto> {
    return this.userService.findById(user.id);
  }

  @Get('me/tasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 Task 목록 (전체 워크스페이스)' })
  @ApiQuery({ name: 'status', required: false })
  getMyTasks(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.taskService.findMyTasks(user.id, status);
  }

  /**
   * 프로필 이미지 업로드
   */
  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: '프로필 이미지 업로드', description: 'R2에 이미지 업로드 후 avatarUrl 업데이트' })
  @ApiResponse({ status: 200, description: '업로드 성공', type: UserResponseDto })
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.userService.uploadAvatar(user.id, file);
  }

  @Get('me/streak')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 스트릭 정보 조회' })
  async getMyStreak(@CurrentUser() user: any) {
    return this.userService.getStreak(user.id);
  }

  /**
   * 현재 로그인한 사용자 프로필 수정
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 수정', description: '현재 로그인한 사용자의 프로필을 수정합니다' })
  @ApiResponse({
    status: 200,
    description: '프로필 수정 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 실패',
  })
  @ApiResponse({
    status: 401,
    description: '인증 필요',
  })
  @ApiResponse({
    status: 409,
    description: '닉네임 중복',
  })
  async updateMe(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(user.id, updateUserDto);
  }

  /**
   * 특정 사용자 공개 프로필 조회 (이메일 제외)
   */
  @Get(':id')
  @ApiOperation({ summary: '사용자 공개 프로필 조회', description: '특정 사용자의 공개 프로필을 조회합니다 (이메일 제외)' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'cm3yh6kfr0000h5e8dydk6glc',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: PublicUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
  })
  async findOne(@Param('id') id: string): Promise<PublicUserResponseDto> {
    return this.userService.findPublicProfile(id);
  }
}
