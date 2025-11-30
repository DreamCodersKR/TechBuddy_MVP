# TechBuddy MVP - Auth 구현 가이드

**작성일**: 2025-11-18
**참고**: URWI_back 서버 구조 분석
**목표**: 보안성 높은 인증 시스템 구축

---

## 📋 목차

1. [개요](#1-개요)
2. [URWI_back Auth 구조 분석](#2-urwi_back-auth-구조-분석)
3. [TechBuddy 적용 설계](#3-techbuddy-적용-설계)
4. [Prisma 스키마 수정](#4-prisma-스키마-수정)
5. [구현 단계](#5-구현-단계)
6. [API 명세](#6-api-명세)
7. [보안 고려사항](#7-보안-고려사항)

---

## 1. 개요

### 1.1 목표

TechBuddy MVP에 **엔터프라이즈급 인증 시스템** 구축

### 1.2 핵심 기능

- ✅ JWT 기반 인증 (Access + Refresh Token)
- ✅ 리프레시 토큰 로테이션
- ✅ 토큰 블랙리스트 (로그아웃, 비밀번호 변경)
- ✅ 토큰 재사용 탐지 (보안 위협 대응)
- ✅ 소셜 로그인 (Google, GitHub - 추후)
- ✅ 이메일 인증
- ✅ 비밀번호 재설정

### 1.3 레퍼런스

**URWI_back 서버** (회사 백엔드 개발자가 구축)
- Python FastAPI 기반
- 매우 잘 설계된 보안 구조
- 이를 NestJS + Prisma로 변환

---

## 2. URWI_back Auth 구조 분석

### 2.1 핵심 파일 구조

```
URWI_back/
├── app/core/security.py           # JWT 토큰 생성, 비밀번호 해싱
├── app/models/jwt.py              # TokenBlacklist, RefreshToken 모델
├── app/services/auth.py           # 인증 비즈니스 로직
├── app/crud/auth.py               # DB 작업
└── app/api/v1/endpoints/auth.py   # API 엔드포인트
```

### 2.2 주요 기능 분석

#### A. JWT 토큰 생성 (`security.py`)

```python
def create_access_token(subject: str, expires_delta: Optional[timedelta] = None):
    jti = str(uuid.uuid4())  # JWT ID - 토큰 추적용
    to_encode = {
        "exp": expire,
        "sub": str(subject),      # 사용자 ID
        "jti": jti,               # 고유 ID
        "type": "access",         # 토큰 타입
        "iat": datetime.now(KST)  # 발급 시간
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm)

    return {
        "token": encoded_jwt,
        "jti": jti,
        "expires_at": expire
    }
```

**NestJS 적용 포인트**:
- `@nestjs/jwt` 사용
- `JTI` 필드를 통한 토큰 추적
- Access Token (15분) + Refresh Token (7일)

---

#### B. 리프레시 토큰 모델 (`models/jwt.py`)

```python
class RefreshTokenModel:
    id: UUID
    token_jti: str           # JWT ID (unique)
    user_id: UUID
    is_active: bool          # 활성 상태
    expires_at: datetime
    created_at: datetime
    used_at: datetime        # 사용 시간
    replaced_by: UUID        # 교체된 새 토큰 ID
    device_info: str         # 기기 정보
    ip_address: str          # IP 주소
```

**핵심 개념**:
1. **토큰 로테이션**: 리프레시 토큰 사용 시 새 토큰 발급 + 기존 토큰 무효화
2. **재사용 탐지**: 이미 사용된 토큰 재사용 시 모든 토큰 무효화 (보안 위협)
3. **기기 추적**: User-Agent, IP로 기기 정보 저장

---

#### C. 토큰 블랙리스트 (`models/jwt.py`)

```python
class TokenBlacklistModel:
    id: UUID
    token_jti: str          # JWT ID
    token_type: str         # "access" or "refresh"
    user_id: UUID
    expires_at: datetime
    blacklisted_at: datetime
    reason: str             # "logout", "password_change", "security_breach"
```

**사용 시나리오**:
- 로그아웃: Access + Refresh 토큰 블랙리스트 등록
- 비밀번호 변경: 모든 기기의 토큰 무효화
- 보안 위협: 의심스러운 활동 시 강제 로그아웃

---

#### D. 로그인 서비스 (`services/auth.py`)

```python
def service_auth_user(db, email, password, request):
    # 1. 사용자 인증
    user = crud_auth.authenticate(db, email, password)

    # 2. 액세스 토큰 생성
    access_token_data = security.create_access_token(subject=str(user.id))

    # 3. 리프레시 토큰 생성
    refresh_token_data = security.create_refresh_token(subject=str(user.id))

    # 4. 리프레시 토큰을 DB에 저장
    crud_refresh_token.create_refresh_token(
        db,
        token_jti=refresh_token_data["jti"],
        user_id=user.id,
        expires_at=refresh_token_data["expires_at"],
        device_info=request.headers.get("User-Agent"),
        ip_address=request.client.host
    )

    return {
        "access_token": access_token_data["token"],
        "refresh_token": refresh_token_data["token"],
        "token_type": "bearer"
    }
```

---

#### E. 토큰 갱신 (리프레시 토큰 로테이션)

```python
def refresh_token_service(db, refresh_token, request):
    # 1. 토큰 디코딩
    payload = security.decode_token(refresh_token)
    jti = payload.get("jti")

    # 2. 블랙리스트 확인
    if security.is_token_blacklisted(db, jti):
        raise HTTPException(401, "무효화된 토큰")

    # 3. DB에서 리프레시 토큰 확인
    db_refresh_token = crud_refresh_token.get_by_jti(db, jti)

    if not db_refresh_token:
        # 토큰 재사용 탐지! 보안 위협
        crud_refresh_token.invalidate_all_user_tokens(db, user_id)
        raise HTTPException(401, "토큰 재사용 탐지. 모든 세션 종료됨.")

    # 4. 기존 리프레시 토큰 무효화
    crud_refresh_token.invalidate_token(db, jti)

    # 5. 새 토큰 발급
    new_access_token = security.create_access_token(subject=user_id)
    new_refresh_token = security.create_refresh_token(subject=user_id)

    # 6. 새 리프레시 토큰 DB 저장
    crud_refresh_token.create_refresh_token(...)

    return {
        "access_token": new_access_token["token"],
        "refresh_token": new_refresh_token["token"]
    }
```

**보안 핵심**:
- 리프레시 토큰은 **한 번만 사용 가능**
- 재사용 시도 = 토큰 탈취로 간주 → 모든 토큰 무효화

---

#### F. 로그아웃 서비스

```python
def logout_service(db, access_token, refresh_token, user_id):
    # 1. 액세스 토큰 블랙리스트 추가
    access_payload = security.decode_token(access_token)
    security.add_token_to_blacklist(
        db,
        jti=access_payload["jti"],
        token_type="access",
        user_id=user_id,
        expires_at=datetime.fromtimestamp(access_payload["exp"]),
        reason="user_logout"
    )

    # 2. 리프레시 토큰 무효화
    refresh_payload = security.decode_token(refresh_token)
    crud_refresh_token.invalidate_token(db, jti=refresh_payload["jti"])

    # 3. 리프레시 토큰도 블랙리스트 추가
    security.add_token_to_blacklist(...)

    return {"message": "로그아웃 성공"}
```

---

## 3. TechBuddy 적용 설계

### 3.1 NestJS 폴더 구조

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts                # 인증 비즈니스 로직
│   ├── auth.controller.ts             # API 엔드포인트
│   │
│   ├── strategies/
│   │   └── jwt.strategy.ts            # Passport JWT 전략
│   │
│   ├── guards/
│   │   ├── jwt-auth.guard.ts          # JWT 인증 가드
│   │   └── roles.guard.ts             # 권한 확인 가드
│   │
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser() 데코레이터
│   │   └── roles.decorator.ts         # @Roles() 데코레이터
│   │
│   ├── dto/
│   │   ├── register.dto.ts            # 회원가입
│   │   ├── login.dto.ts               # 로그인
│   │   ├── refresh-token.dto.ts       # 토큰 갱신
│   │   └── change-password.dto.ts     # 비밀번호 변경
│   │
│   └── utils/
│       └── security.util.ts           # JWT 생성, 비밀번호 해싱
│
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── token/
│   ├── token.module.ts
│   ├── token.service.ts               # 토큰 블랙리스트, 리프레시 토큰 관리
│   └── entities/
│       ├── token-blacklist.entity.ts
│       └── refresh-token.entity.ts
│
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

### 3.2 주요 클래스 역할

| 클래스 | 역할 |
|--------|------|
| `AuthService` | 회원가입, 로그인, 토큰 갱신, 로그아웃 |
| `TokenService` | 토큰 블랙리스트, 리프레시 토큰 관리 |
| `JwtStrategy` | JWT 토큰 검증 (Passport) |
| `JwtAuthGuard` | 인증 필요한 엔드포인트 보호 |
| `SecurityUtil` | JWT 생성, 비밀번호 해싱/검증 |

---

## 4. Prisma 스키마 수정

### 4.1 기존 User 모델 (그대로 유지)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String?
  name      String
  nickname  String?  @unique
  role      UserRole @default(GENERAL_USER)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  refreshTokens  RefreshToken[]
  // ... 기존 관계
}
```

### 4.2 추가 모델

#### A. RefreshToken (리프레시 토큰)

```prisma
model RefreshToken {
  id         String    @id @default(uuid())
  tokenJti   String    @unique
  userId     String
  isActive   Boolean   @default(true)
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  usedAt     DateTime?
  replacedBy String?   // 교체된 새 토큰 ID
  deviceInfo String?   // User-Agent
  ipAddress  String?   // IP 주소

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenJti])
  @@index([userId])
  @@index([isActive])
  @@map("refresh_tokens")
}
```

#### B. TokenBlacklist (토큰 블랙리스트)

```prisma
model TokenBlacklist {
  id            String   @id @default(uuid())
  tokenJti      String   @unique
  tokenType     String   // "access" or "refresh"
  userId        String
  expiresAt     DateTime
  blacklistedAt DateTime @default(now())
  reason        String?  // "logout", "password_change", "security_breach"

  @@index([tokenJti])
  @@index([userId])
  @@index([expiresAt])
  @@map("token_blacklist")
}
```

### 4.3 마이그레이션 명령어

```bash
# 스키마 수정 후
npx prisma migrate dev --name add_token_management

# Prisma Client 재생성
npx prisma generate
```

---

## 5. 구현 단계

### Phase 1: 기반 구축 (1-2일)

**1.1 Prisma 스키마 수정**
- RefreshToken, TokenBlacklist 모델 추가
- 마이그레이션 실행

**1.2 필수 패키지 설치**
```bash
npm install bcrypt
npm install @types/bcrypt -D
npm install @nestjs/jwt
npm install @nestjs/passport passport passport-jwt
npm install @types/passport-jwt -D
```

**1.3 환경변수 설정** (`.env`)
```env
# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_ACCESS_TOKEN_EXPIRE="15m"
JWT_REFRESH_TOKEN_EXPIRE="7d"

# 보안 설정
MAX_ACTIVE_TOKENS_PER_USER=5      # 사용자당 최대 활성 토큰 수
TOKEN_REUSE_DETECTION=true        # 토큰 재사용 탐지 활성화
```

---

### Phase 2: Security Util 구현 (1일)

**파일**: `src/auth/utils/security.util.ts`

```typescript
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

export class SecurityUtil {
  // 비밀번호 해싱
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // 비밀번호 검증
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Access Token 생성
  static createAccessToken(
    jwtService: JwtService,
    userId: string,
  ): { token: string; jti: string; expiresAt: Date } {
    const jti = uuidv4();
    const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRE || '15m';

    const payload = {
      sub: userId,
      jti,
      type: 'access',
    };

    const token = jwtService.sign(payload, { expiresIn });

    // expiresAt 계산 (15분 후)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    return { token, jti, expiresAt };
  }

  // Refresh Token 생성
  static createRefreshToken(
    jwtService: JwtService,
    userId: string,
  ): { token: string; jti: string; expiresAt: Date } {
    const jti = uuidv4();
    const expiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRE || '7d';

    const payload = {
      sub: userId,
      jti,
      type: 'refresh',
    };

    const token = jwtService.sign(payload, { expiresIn });

    // expiresAt 계산 (7일 후)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return { token, jti, expiresAt };
  }
}
```

---

### Phase 3: TokenService 구현 (1일)

**파일**: `src/token/token.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  // 리프레시 토큰 생성
  async createRefreshToken(data: {
    tokenJti: string;
    userId: string;
    expiresAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
  }) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  // JTI로 리프레시 토큰 조회
  async getRefreshTokenByJti(jti: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenJti: jti, isActive: true },
    });
  }

  // 리프레시 토큰 무효화
  async invalidateRefreshToken(jti: string) {
    return this.prisma.refreshToken.update({
      where: { tokenJti: jti },
      data: { isActive: false, usedAt: new Date() },
    });
  }

  // 사용자의 모든 토큰 무효화
  async invalidateAllUserTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  // 토큰 블랙리스트 추가
  async addToBlacklist(data: {
    tokenJti: string;
    tokenType: 'access' | 'refresh';
    userId: string;
    expiresAt: Date;
    reason?: string;
  }) {
    return this.prisma.tokenBlacklist.create({
      data,
    });
  }

  // 블랙리스트 확인
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { tokenJti: jti },
    });
    return !!blacklisted;
  }

  // 만료된 블랙리스트 정리 (크론 작업용)
  async cleanupExpiredBlacklist() {
    return this.prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
```

---

### Phase 4: JWT Strategy & Guard 구현 (1일)

**4.1 JWT Strategy** (`src/auth/strategies/jwt.strategy.ts`)

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../token/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const { sub: userId, jti, type } = payload;

    // 토큰 타입 확인
    if (type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // 블랙리스트 확인
    const isBlacklisted = await this.tokenService.isTokenBlacklisted(jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // 사용자 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user; // req.user에 저장됨
  }
}
```

**4.2 JWT Auth Guard** (`src/auth/guards/jwt-auth.guard.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**4.3 Current User Decorator** (`src/auth/decorators/current-user.decorator.ts`)

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

### Phase 5: AuthService 구현 (2일)

**파일**: `src/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { SecurityUtil } from './utils/security.util';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  // 회원가입
  async register(dto: RegisterDto, request: any) {
    // 이메일 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('이미 등록된 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await SecurityUtil.hashPassword(dto.password);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        nickname: dto.nickname,
      },
    });

    // 토큰 발급
    return this.issueTokens(user.id, request);
  }

  // 로그인
  async login(dto: LoginDto, request: any) {
    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 비밀번호 검증
    const isPasswordValid = await SecurityUtil.verifyPassword(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 토큰 발급
    return this.issueTokens(user.id, request);
  }

  // 토큰 갱신 (리프레시 토큰 로테이션)
  async refreshToken(dto: RefreshTokenDto, request: any) {
    try {
      // 리프레시 토큰 검증
      const payload = this.jwtService.verify(dto.refreshToken);
      const { sub: userId, jti, type } = payload;

      // 토큰 타입 확인
      if (type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // 블랙리스트 확인
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // DB에서 리프레시 토큰 확인
      const dbRefreshToken = await this.tokenService.getRefreshTokenByJti(jti);

      if (!dbRefreshToken) {
        // 토큰 재사용 탐지!
        if (process.env.TOKEN_REUSE_DETECTION === 'true') {
          // 모든 토큰 무효화
          await this.tokenService.invalidateAllUserTokens(userId);
          throw new UnauthorizedException(
            '토큰 재사용이 탐지되었습니다. 보안상 모든 세션이 종료되었습니다.',
          );
        }
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 기존 리프레시 토큰 무효화
      await this.tokenService.invalidateRefreshToken(jti);

      // 새 토큰 발급
      return this.issueTokens(userId, request);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // 로그아웃
  async logout(userId: string, accessToken: string, refreshToken?: string) {
    // Access Token 블랙리스트 추가
    const accessPayload = this.jwtService.decode(accessToken) as any;
    if (accessPayload?.jti) {
      await this.tokenService.addToBlacklist({
        tokenJti: accessPayload.jti,
        tokenType: 'access',
        userId,
        expiresAt: new Date(accessPayload.exp * 1000),
        reason: 'user_logout',
      });
    }

    // Refresh Token 무효화 및 블랙리스트 추가
    if (refreshToken) {
      const refreshPayload = this.jwtService.decode(refreshToken) as any;
      if (refreshPayload?.jti) {
        await this.tokenService.invalidateRefreshToken(refreshPayload.jti);
        await this.tokenService.addToBlacklist({
          tokenJti: refreshPayload.jti,
          tokenType: 'refresh',
          userId,
          expiresAt: new Date(refreshPayload.exp * 1000),
          reason: 'user_logout',
        });
      }
    }

    return { message: '로그아웃되었습니다.' };
  }

  // 모든 기기에서 로그아웃
  async logoutAllDevices(userId: string) {
    await this.tokenService.invalidateAllUserTokens(userId);
    return { message: '모든 기기에서 로그아웃되었습니다.' };
  }

  // 토큰 발급 (private helper)
  private async issueTokens(userId: string, request: any) {
    // Access Token 생성
    const accessTokenData = SecurityUtil.createAccessToken(
      this.jwtService,
      userId,
    );

    // Refresh Token 생성
    const refreshTokenData = SecurityUtil.createRefreshToken(
      this.jwtService,
      userId,
    );

    // Refresh Token DB 저장
    await this.tokenService.createRefreshToken({
      tokenJti: refreshTokenData.jti,
      userId,
      expiresAt: refreshTokenData.expiresAt,
      deviceInfo: request.headers?.['user-agent'],
      ipAddress: request.ip,
    });

    return {
      accessToken: accessTokenData.token,
      refreshToken: refreshTokenData.token,
      tokenType: 'bearer',
    };
  }
}
```

---

## 6. API 명세

### 6.1 회원가입

**POST** `/auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "홍길동",
  "nickname": "gildong"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

---

### 6.2 로그인

**POST** `/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

---

### 6.3 토큰 갱신

**POST** `/auth/refresh`

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

---

### 6.4 로그아웃

**POST** `/auth/logout`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "message": "로그아웃되었습니다."
}
```

---

### 6.5 모든 기기에서 로그아웃

**POST** `/auth/logout-all`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response**:
```json
{
  "message": "모든 기기에서 로그아웃되었습니다."
}
```

---

## 7. 보안 고려사항

### 7.1 토큰 만료 시간

| 토큰 타입 | 만료 시간 | 이유 |
|-----------|-----------|------|
| Access Token | 15분 | 탈취 시 피해 최소화 |
| Refresh Token | 7일 | 사용자 편의성 |

### 7.2 리프레시 토큰 로테이션

**장점**:
- 토큰 재사용 방지
- 탈취된 토큰 조기 탐지
- 보안 위협 시 자동 대응

**작동 방식**:
1. 리프레시 토큰 사용 → 새 토큰 발급
2. 기존 토큰은 즉시 무효화
3. 무효화된 토큰 재사용 시도 → 모든 토큰 무효화

### 7.3 토큰 블랙리스트

**사용 시나리오**:
- 로그아웃
- 비밀번호 변경
- 계정 정지
- 보안 위협 감지

**정리 작업**:
- 크론 작업으로 만료된 블랙리스트 자동 삭제
- DB 용량 관리

### 7.4 비밀번호 정책

```typescript
// DTO에서 검증
@IsStrongPassword({
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
})
password: string;
```

---

## 8. 테스트 체크리스트

### 8.1 단위 테스트

- [ ] 비밀번호 해싱/검증
- [ ] JWT 토큰 생성/검증
- [ ] 토큰 블랙리스트 확인

### 8.2 통합 테스트

- [ ] 회원가입 → 로그인 플로우
- [ ] 토큰 갱신 (리프레시)
- [ ] 로그아웃 (토큰 무효화)
- [ ] 토큰 재사용 탐지

### 8.3 보안 테스트

- [ ] 만료된 토큰 거부
- [ ] 블랙리스트 토큰 거부
- [ ] 재사용된 리프레시 토큰 탐지
- [ ] SQL Injection 방어 (Prisma 자동)
- [ ] XSS 방어 (class-validator)

---

## 9. 참고 자료

### 9.1 URWI_back 서버

**경로**: `/Users/yoonjongho/Desktop/YJH_folder/work/Server/URWI_back`

**핵심 파일**:
- `app/core/security.py` - JWT 생성, 비밀번호 해싱
- `app/models/jwt.py` - TokenBlacklist, RefreshToken 모델
- `app/services/auth.py` - 인증 비즈니스 로직

### 9.2 NestJS 공식 문서

- Authentication: https://docs.nestjs.com/security/authentication
- Authorization: https://docs.nestjs.com/security/authorization
- JWT: https://docs.nestjs.com/techniques/jwt

### 9.3 보안 베스트 프랙티스

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725

---

## 10. 구현 우선순위

**Phase 1 (필수)**:
1. ✅ Prisma Service 생성
2. ✅ User 모듈 생성
3. ✅ 패키지 설치
4. ✅ Prisma 스키마 수정

**Phase 2 (핵심)**:
5. ⏳ SecurityUtil 구현
6. ⏳ TokenService 구현
7. ⏳ JwtStrategy & Guard
8. ⏳ AuthService (기본 로그인/회원가입)

**Phase 3 (고급)**:
9. ⏳ 리프레시 토큰 로테이션
10. ⏳ 토큰 블랙리스트
11. ⏳ 재사용 탐지
12. ⏳ 소셜 로그인 (Google, GitHub)

---

**작성자**: TechBuddy 팀
**최종 수정**: 2025-11-18
**상태**: 구현 대기 중
