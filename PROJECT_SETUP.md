# 🚀 TechBuddy MVP - 프로젝트 셋업 가이드

> 개발 환경 구축부터 첫 실행까지 단계별 가이드

---

## 📋 목차

- [사전 준비사항](#-사전-준비사항)
- [환경 설정](#-환경-설정)
- [백엔드 설정](#-백엔드-설정-nestjs)
- [프론트엔드 설정](#-프론트엔드-설정-nuxtjs)
- [데이터베이스 설정](#-데이터베이스-설정)
- [개발 시작](#-개발-시작)
- [문제 해결](#-문제-해결)

---

## ✅ 사전 준비사항

### 필수 소프트웨어

```bash
# Node.js (v22.14 이상)
node --version  # v22.14.0

# npm (Node.js와 함께 설치됨)
npm --version   # 10.9.0+

# Git
git --version   # 2.40.0+
```

### 권장 도구

```bash
# 패키지 매니저 (선택사항)
npm install -g pnpm  # 또는 yarn

# NestJS CLI (선택사항)
npm install -g @nestjs/cli

# Prisma CLI (선택사항)
npm install -g prisma
```

### IDE 설정

**VS Code 추천 Extensions:**
- Volar (Vue 3 지원)
- Prisma
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)

---

## 🔧 환경 설정

### 1. 저장소 클론

```bash
# SSH로 클론 (권장)
git clone git@github.com:DreamCodersKR/TechBuddy_MVP.git
cd TechBuddy_MVP

# 또는 HTTPS로 클론
git clone https://github.com/DreamCodersKR/TechBuddy_MVP.git
cd TechBuddy_MVP
```

### 2. Git 설정 확인

```bash
# 현재 Git 사용자 확인
git config user.name
git config user.email

# 조직 계정 설정 (필요시)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

## 🔧 백엔드 설정 (NestJS)

### 1. 백엔드 디렉토리 이동

```bash
cd backend
```

### 2. 의존성 설치

```bash
# npm 사용
npm install

# 또는 pnpm 사용 (더 빠름)
pnpm install
```

### 3. 환경 변수 설정

```bash
# .env.example 복사
cp .env.example .env

# .env 파일 편집
vim .env  # 또는 코드 에디터로 열기
```

**`.env` 파일 예시:**

```env
# ==========================================
# Database (Supabase PostgreSQL)
# ==========================================
DATABASE_URL="postgresql://username:password@host:5432/techbuddy_dev"

# ==========================================
# JWT
# ==========================================
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="14d"

# ==========================================
# Redis (세션 & 캐싱)
# ==========================================
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# ==========================================
# File Storage (Cloudflare R2)
# ==========================================
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="techbuddy-files"

# ==========================================
# OAuth (선택사항)
# ==========================================
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ==========================================
# CORS
# ==========================================
FRONTEND_URL="http://localhost:3000"

# ==========================================
# Server
# ==========================================
PORT=4000
NODE_ENV="development"
```

### 4. Prisma 설정

> **중요:** `npm install` 시 `postinstall` 스크립트로 `prisma generate`가 자동 실행됩니다.

```bash
# 데이터베이스 마이그레이션 (⚠️ .env 설정 후 실행)
npx prisma migrate dev

# Prisma Client 재생성 (schema.prisma 수정 시)
npx prisma generate

# Prisma Studio 실행 (DB GUI)
npx prisma studio  # http://localhost:5555
```

**처음 클론 후 실행 순서:**

```bash
# 1. 의존성 설치 (prisma generate 자동 실행됨)
npm install

# 2. .env 파일 설정 (DATABASE_URL 필수!)
cp .env.example .env
# .env 파일에서 DATABASE_URL 수정

# 3. 데이터베이스 마이그레이션
npx prisma migrate dev

# 4. 개발 서버 실행
npm run start:dev
```

### 5. 백엔드 실행

```bash
# 개발 모드 실행 (Hot Reload)
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

**백엔드 실행 확인:**
- API: http://localhost:4000
- Swagger: http://localhost:4000/api
- Health Check: http://localhost:4000/health

---

## 🎨 프론트엔드 설정 (Nuxt.js)

### 1. 프론트엔드 디렉토리 이동

```bash
cd ../frontend  # backend에서 이동
# 또는
cd frontend     # 루트에서 이동
```

### 2. 의존성 설치

```bash
# npm 사용
npm install

# 또는 pnpm 사용
pnpm install
```

### 3. 환경 변수 설정

```bash
# .env.example 복사
cp .env.example .env

# .env 파일 편집
vim .env
```

**`.env` 파일 예시:**

```env
# ==========================================
# Backend API
# ==========================================
NUXT_PUBLIC_API_BASE_URL="http://localhost:4000"
NUXT_PUBLIC_WS_URL="ws://localhost:4000"

# ==========================================
# OAuth (선택사항)
# ==========================================
NUXT_PUBLIC_GOOGLE_CLIENT_ID=""
NUXT_PUBLIC_GITHUB_CLIENT_ID=""

# ==========================================
# App
# ==========================================
NUXT_PUBLIC_APP_NAME="TechBuddy"
NUXT_PUBLIC_APP_ENV="development"
```

### 4. 프론트엔드 실행

```bash
# 개발 모드 실행 (Hot Reload)
npm run dev

# 프로덕션 빌드
npm run build
npm run preview
```

**프론트엔드 실행 확인:**
- 앱: http://localhost:3000

---

## 🗄️ 데이터베이스 설정

### Option 1: Supabase (권장)

1. **Supabase 프로젝트 생성**
   - https://supabase.com/ 접속
   - 새 프로젝트 생성
   - PostgreSQL 연결 정보 복사

2. **연결 정보 설정**
   ```bash
   # backend/.env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
   ```

### Option 2: 로컬 PostgreSQL

```bash
# PostgreSQL 설치 (macOS)
brew install postgresql@14
brew services start postgresql@14

# 데이터베이스 생성
createdb techbuddy_dev

# 연결 정보 설정
# backend/.env
DATABASE_URL="postgresql://localhost:5432/techbuddy_dev"
```

### Option 3: Docker (가장 간단)

```bash
# docker-compose.yml 생성 (루트 디렉토리)
cd /path/to/TechBuddy_MVP

# Docker Compose로 실행
docker-compose up -d

# 연결 정보
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/techbuddy"
```

**`docker-compose.yml` 예시:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: techbuddy_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: techbuddy
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: techbuddy_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 🚀 개발 시작

### 전체 프로젝트 실행

**터미널 1: 백엔드**
```bash
cd backend
npm run start:dev
```

**터미널 2: 프론트엔드**
```bash
cd frontend
npm run dev
```

**터미널 3: Prisma Studio (선택)**
```bash
cd backend
npx prisma studio
```

---

## 🎯 개발 워크플로우

### 1. 브랜치 전략

```bash
main          # 프로덕션 (보호됨)
  └─ develop  # 개발 메인
       ├─ feature/community-board
       ├─ feature/project-management
       └─ feature/mentoring-system
```

### 2. 커밋 컨벤션

```bash
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경
```

**예시:**
```bash
git commit -m "feat(backend): Add user authentication API"
git commit -m "fix(frontend): Fix login button alignment"
git commit -m "docs: Update PROJECT_SETUP.md"
```

### 3. Pull Request 플로우

```bash
# 1. feature 브랜치 생성
git checkout -b feature/your-feature

# 2. 작업 후 커밋
git add .
git commit -m "feat: Add your feature"

# 3. Push
git push origin feature/your-feature

# 4. GitHub에서 PR 생성
# 5. 코드 리뷰 후 merge
```

---

## ❓ 문제 해결

### Q1: `npm install` 실패

**해결:**
```bash
# Node.js 버전 확인
node --version  # v22.14+

# npm 캐시 클리어
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### Q2: Prisma 마이그레이션 실패

**해결:**
```bash
# Prisma 캐시 클리어
npx prisma generate --force

# 마이그레이션 리셋 (⚠️ 데이터 삭제됨)
npx prisma migrate reset

# 새로 마이그레이션
npx prisma migrate dev --name init
```

### Q3: 포트 충돌

**해결:**
```bash
# 사용 중인 포트 확인
lsof -i :4000  # 백엔드
lsof -i :3000  # 프론트엔드

# 프로세스 종료
kill -9 [PID]

# 또는 .env에서 포트 변경
PORT=4001
```

### Q4: CORS 에러

**해결:**
```bash
# backend/.env 확인
FRONTEND_URL="http://localhost:3000"

# 프론트엔드 URL이 정확한지 확인
```

### Q5: Redis 연결 실패

**해결:**
```bash
# Redis 서버 실행 확인
redis-cli ping  # 응답: PONG

# Docker로 Redis 실행
docker run -d -p 6379:6379 redis:7-alpine

# 또는 로컬 설치
brew install redis
brew services start redis
```

---

## 📚 추가 문서

- [API 명세서](./docs/03_프로젝트관리_API명세서_v1.0.md)
- [DB 스키마](./docs/04_DB스키마_설계.sql)
- [개발 가이드](./docs/05_개발가이드.md)
- [Phase별 구현계획](./docs/06_Phase별_구현계획.md)

---

## 📞 도움말

문제가 해결되지 않으면:
1. GitHub Issues 등록
2. 팀 Slack 채널에 문의
3. 팀 미팅에서 공유

---

**Happy Coding! 🚀**
