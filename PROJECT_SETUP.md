# FLOWIT - 프로젝트 셋업 가이드

> 개발 환경 구축부터 첫 실행까지

---

## 사전 준비사항

### 필수 소프트웨어

```bash
node --version   # v22.x 이상
npm --version    # 10.x 이상
git --version    # 2.40+
```

### IDE 설정

**VS Code 추천 Extensions:**
- Vue - Official (Volar)
- Prisma
- ESLint
- Tailwind CSS IntelliSense

---

## 백엔드 설정 (NestJS)

### 1. 의존성 설치

```bash
cd backend
npm install    # prisma generate 자동 실행됨 (postinstall)
```

### 2. 환경 변수

```bash
cp .env.example .env
```

`.env` 주요 항목:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_EXPIRES_IN="30d"

# AI API Keys
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="..."
XAI_API_KEY="xai-..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="flowit-documents"
R2_ENDPOINT="https://[account-id].r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://..."

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# CORS
FRONTEND_URL="http://localhost:3000"

# Server
PORT=8080
```

### 3. DB 마이그레이션

**Supabase Free tier 주의**: 직접 연결(5432) 차단됨

```bash
# 로컬 DB가 있는 경우
npx prisma migrate dev

# Supabase Free tier인 경우
# → Supabase SQL Editor에서 수동 실행 + _prisma_migrations 수동 삽입
```

### 4. 실행

```bash
npm run start:dev    # http://localhost:8080
```

**확인:**
- API: http://localhost:8080
- Swagger: http://localhost:8080/api-docs

---

## 프론트엔드 설정 (Nuxt)

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경 변수

```bash
cp .env.example .env
```

`.env`:

```env
NUXT_PUBLIC_API_BASE_URL="http://localhost:8080"
NUXT_PUBLIC_ENVIRONMENT="development"
```

### 3. 실행

```bash
npm run dev    # http://localhost:3000
```

---

## 전체 프로젝트 실행

**터미널 1: 백엔드**
```bash
cd backend && npm run start:dev
```

**터미널 2: 프론트엔드**
```bash
cd frontend && npm run dev
```

---

## 문제 해결

### npm install 실패

```bash
rm -rf node_modules package-lock.json
npm install
```

### Prisma 관련 오류

```bash
npx prisma generate          # 클라이언트 재생성
npx prisma migrate reset     # 마이그레이션 초기화 (데이터 삭제)
```

### 포트 충돌

```bash
lsof -i :8080    # 백엔드
lsof -i :3000    # 프론트엔드
kill -9 [PID]
```

### CORS 에러

`backend/.env`의 `FRONTEND_URL`이 프론트엔드 URL과 일치하는지 확인.
프론트엔드 포트가 3001~3003으로 바뀔 수 있음 (모두 CORS 허용됨).

---

## 배포

| 서비스 | 플랫폼 | 브랜치 |
|--------|--------|--------|
| Frontend | Vercel | master |
| Backend | Railway | master |
| Database | Supabase | - |

### 브랜치 전략

```
master    ← 프로덕션 배포
  └─ dev  ← 개발 통합 (PR로 master에 병합)
```
