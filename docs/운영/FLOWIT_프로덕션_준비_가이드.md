# FLOWIT 프로덕션 준비 가이드

> 작성일: 2026-04-06
> MVP 버전: FLOWIT v1.4 (완료 기준)
> 프로덕션 예정: 2026년 6~7월 (부트캠프 파트너십 확정 후)

---

## 배경 및 결정 사항

### 왜 새 레포인가?
- 현재 레포(`TechBuddy_MVP`)는 MVP 실험/검증 목적으로 만들어진 레포로, 구 서비스명(TechBuddy) 잔재가 코드 전반에 남아 있음
- git 히스토리에 실험적 커밋, seed 스크립트, 디버그 코드 혼재
- 프로덕션은 안정성·코드 품질 중심의 새 출발점이 필요

### 결정: 새 GitHub 레포 + 새 인프라 (Supabase / Railway / Vercel 전부 신규)
- Dev/Test 인프라와 Production 인프라를 완전히 분리
- MVP 최종 코드를 정리해서 새 레포에 이식 (히스토리 없이 코드만)

---

## 프로덕션 준비 전체 작업 흐름

### PHASE 1. 새 인프라 세팅

#### 1-1. GitHub 새 레포 생성
```
레포명: flowit (또는 flowit-web)
브랜치 전략:
  main       ← 프로덕션 (보호 브랜치)
  develop    ← 통합 개발 브랜치
  feature/*  ← 기능 개발
  hotfix/*   ← 긴급 버그 수정
```

#### 1-2. Supabase 새 프로젝트 생성
- 프로젝트명: `flowit-production`
- 플랜: Pro (프로덕션은 Free tier 사용 금지 - 직접 연결 제한, 백업 없음)
- 지역: ap-northeast-2 (서울)
- 생성 후 `DATABASE_URL`, `DIRECT_URL` 메모

#### 1-3. Railway 새 프로젝트 생성
- 프로젝트명: `flowit-backend`
- GitHub 새 레포의 `main` 브랜치 연결
- 환경: Production
- 환경변수 설정 (아래 목록 참조)

#### 1-4. Vercel 새 프로젝트 생성
- 프로젝트명: `flowit-frontend`
- GitHub 새 레포의 `main` 브랜치 연결 (Production)
- `develop` 브랜치 → Preview 환경으로 설정
- 환경변수 설정 (아래 목록 참조)

#### 1-5. 커스텀 도메인 연결
- Vercel: `flowit.kr` 또는 `app.flowit.kr`
- Railway: `api.flowit.kr` (커스텀 도메인 설정)

---

### PHASE 2. 코드 이식 및 정리

#### 2-1. MVP 코드 클린업 후 새 레포에 이식
- `git clone` 없이 코드만 복사 (히스토리 없이 fresh commit)
- 또는 `git filter-branch` / `git subtree` 로 히스토리 정리 후 이식

#### 2-2. TechBuddy 잔재 전면 제거
```
체크리스트:
[ ] package.json name 필드: "techbuddy" → "flowit"
[ ] README.md 전면 재작성
[ ] CLAUDE.md 업데이트
[ ] .env 변수명 정리 (불필요한 레거시 키 제거)
[ ] 코드 내 주석, 변수명에 남은 TechBuddy 참조 제거
[ ] Prisma schema 주석 정리
[ ] 폴더 구조 정리 (필요시)
```

#### 2-3. Prisma 마이그레이션 새로 구성
```bash
# 기존 마이그레이션 히스토리 없이 새 DB에 스키마 적용
npx prisma migrate dev --name init
```
- MVP에서 누적된 마이그레이션 파일들 → 단일 `init` 마이그레이션으로 통합

---

### PHASE 3. 프로덕션 환경변수 설정

#### Backend (Railway)
```env
# Database (새 Supabase 프로젝트)
DATABASE_URL=postgresql://...pooler...
DIRECT_URL=postgresql://...direct...

# JWT
JWT_SECRET=<강력한 랜덤 시크릿 - 프로덕션 전용>
JWT_EXPIRES_IN=1h

# App
PORT=8080
NODE_ENV=production

# OAuth (프로덕션 도메인 기준으로 재등록)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://api.flowit.kr/auth/google/callback

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://api.flowit.kr/auth/github/callback

# Frontend
FRONTEND_URL=https://flowit.kr

# Cloudflare R2 (프로덕션 버킷 신규 생성)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=flowit-production
R2_ENDPOINT=...
R2_PUBLIC_URL=...

# AI API Keys
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
XAI_API_KEY=...
```

#### Frontend (Vercel)
```env
NUXT_PUBLIC_API_BASE_URL=https://api.flowit.kr
NUXT_PUBLIC_ENVIRONMENT=production
NUXT_PUBLIC_APP_NAME=FLOWIT
```

---

### PHASE 4. OAuth 앱 재등록

#### Google OAuth
- Google Cloud Console → 새 프로젝트 생성 (또는 기존 프로젝트에 프로덕션 Redirect URI 추가)
- 승인된 리디렉션 URI: `https://api.flowit.kr/auth/google/callback`
- 승인된 JavaScript 원본: `https://flowit.kr`

#### GitHub OAuth
- GitHub Developer Settings → 새 OAuth App 생성
- Authorization callback URL: `https://api.flowit.kr/auth/github/callback`
- Homepage URL: `https://flowit.kr`

---

### PHASE 5. 코드 품질 / 고도화 작업

MVP에서 빠르게 만들면서 미뤄둔 기술 부채 해결:

```
[ ] UI 라이브러리 전환: Nuxt UI → Shadcn-vue (MVP에서 결정된 사항)
[ ] 에러 처리 고도화 (전역 에러 핸들러, 사용자 친화적 에러 페이지)
[ ] 로딩 상태 UX 개선
[ ] 이미지 최적화 (nuxt-image 도입)
[ ] 번들 사이즈 최적화
[ ] API 응답 캐싱 전략
[ ] Sentry 에러 모니터링 설정
[ ] CI/CD 파이프라인 구성 (GitHub Actions)
[ ] E2E 테스트 자동화 (Playwright)
[ ] 보안 강화 (Rate limiting, Helmet.js 등)
```

---

### PHASE 6. 런칭 준비

```
[ ] 커스텀 도메인 구매 및 DNS 설정 (flowit.kr)
[ ] SSL 인증서 확인 (Vercel/Railway 자동 발급)
[ ] SEO 최적화 (sitemap.xml, robots.txt)
[ ] Google Analytics / Search Console 등록
[ ] 서비스 약관 / 개인정보처리방침 법무 검토
[ ] 이메일 발송 서비스 연동 (SendGrid 등 - 알림 기능)
[ ] 백업 전략 수립 (Supabase Pro 자동 백업 확인)
[ ] 모니터링 대시보드 설정 (Sentry + Railway 메트릭)
```

---

## 참고: 현재 MVP 인프라 정보

| 항목 | 현재 (MVP) | 프로덕션 |
|------|-----------|---------|
| GitHub | TechBuddy_MVP (private) | 새 레포 (flowit) |
| Backend | Railway - test 브랜치 | Railway - 새 프로젝트 (main) |
| Frontend | Vercel - 전 브랜치 연결 | Vercel - 새 프로젝트 (main만) |
| Database | Supabase Free tier | Supabase Pro tier |
| Storage | Cloudflare R2 (flowit-documents) | R2 새 버킷 (flowit-production) |
| 도메인 | *.vercel.app / *.railway.app | flowit.kr / api.flowit.kr |

---

## 타임라인 (예상)

| 시기 | 작업 |
|------|------|
| ~2026-04 | FLOWIT v1.4 MVP 완료 (현재) |
| 2026-05 | 부트캠프 영업 및 파트너십 협의 |
| 2026-06 | 파트너십 확정 시 프로덕션 준비 시작 (PHASE 1~3) |
| 2026-07 | 코드 고도화 + 런칭 준비 (PHASE 4~6) |
| 2026-07말 | 정식 런칭 🚀 |
