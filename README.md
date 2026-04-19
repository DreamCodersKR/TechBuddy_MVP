# FLOWIT

> IT 부트캠프 수료생 및 취업 준비생을 위한 **올인원 성장 플랫폼**
> 커뮤니티 · PM툴 · AI 멘토링 · 포트폴리오

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.2-00DC82?logo=nuxt.js)](https://nuxt.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

---

## 프로젝트 소개

**FLOWIT**은 IT 부트캠프 수료생들이 겪는 정보 비대칭, 프로젝트 관리 어려움, 멘토 부재 문제를 해결하는 통합 플랫폼입니다.

### 핵심 가치
- **커뮤니티** — 취준생/주니어 맞춤 정보 공유
- **PM툴** — 초보자용 칸반보드 + Help 상태
- **AI 멘토링** — 멀티모델 AI 기반 실시간 학습 지원
- **포트폴리오** — 활동 기반 자동 생성

---

## 주요 기능

### 커뮤니티
- 게시판 (카테고리별, 고정글, 좋아요, 북마크, 검색)
- 아고라 (크레딧 바운티 기반 Q&A)
- 팀원 모집 (프로젝트/스터디 + 지원 관리)
- 미니프로필 팝업, 유저 신고

### PM툴 (워크스페이스)
- 칸반 보드 (드래그앤드롭, 이슈 번호, position 정렬)
- 스프린트 관리 (PLANNED → ACTIVE → COMPLETED)
- 산출문서 (R2 파일 스토리지, 일괄 다운로드)
- KPT 회고, 태스크 코멘트/라벨

### 스터디룸 (STUDY 타입 워크스페이스)
- 주차별 커리큘럼 & 과제
- 과제 제출/관리
- 벌금 규칙 (동의 기반)
- 공유 자료실

### AI 멘토링
- 멀티모델 지원: Claude, GPT, Gemini, Grok
- SSE 스트리밍 실시간 응답
- 카테고리별 모델 자동 선택 (CODE/DOCUMENT/PLANNING/RESEARCH)
- RAG 파이프라인 (프로젝트 문서 기반 맥락 인식)
- AI 커리큘럼 추천

### 게이미피케이션
- XP & 레벨 (Lv.1~5)
- 뱃지 시스템 (10종 + 엔터프라이즈)
- 데일리 퀘스트 5종
- 연속 출석 스트릭 (크레딧 보상)
- TIL (Today I Learned)
- 활동 잔디 히트맵
- 친구 초대 코드

### 포트폴리오
- 닉네임 기반 공개 프로필 (`/portfolio/:nickname`)
- 통계, 프로젝트, 뱃지, TIL 자동 집계

### 기타
- OAuth 소셜 로그인 (Google, GitHub)
- 커피챗 1:1 네트워킹
- 관리자 콘솔 (유저/게시글/신고/문의 관리)
- 온보딩 투어 (driver.js)
- 다크모드

---

## 기술 스택

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| NestJS | 11.x | API 프레임워크 |
| Prisma | 6.x | ORM |
| PostgreSQL | - | DB (Supabase) |
| pgvector | 0.8 | RAG 벡터 검색 |
| Passport | 0.7 | JWT + OAuth |
| Helmet + Throttler | - | 보안 + 레이트리밋 |

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Nuxt | 4.2 | SSR 프레임워크 |
| Vue | 3.5 | UI 프레임워크 |
| shadcn-vue | 2.4 | UI 컴포넌트 |
| TailwindCSS | - | 스타일링 |
| Pinia | 3.x | 상태 관리 |
| Toast UI Editor | 3.2 | 마크다운 에디터 |

### AI 모델
| 모델 | SDK | 용도 |
|------|-----|------|
| Claude (Anthropic) | @anthropic-ai/sdk | 코딩/기획 |
| GPT (OpenAI) | openai | 코딩 보조 |
| Gemini (Google) | @google/generative-ai | 문서/디자인 |
| Grok (xAI) | openai (baseURL) | 리서치 |

### Infrastructure
| 서비스 | 용도 |
|--------|------|
| Vercel | 프론트엔드 배포 |
| Railway | 백엔드 배포 |
| Supabase | PostgreSQL DB |
| Cloudflare R2 | 파일 스토리지 |
| Linear | 이슈 트래킹 |

---

## 프로젝트 구조

```
TechBuddy_MVP/
├── backend/                # NestJS 백엔드 (32개 모듈)
│   ├── src/                # 소스 코드
│   └── prisma/             # DB 스키마 (48개 모델, 21개 enum)
├── frontend/               # Nuxt 프론트엔드
│   ├── pages/              # 60+ 페이지
│   ├── components/         # shadcn-vue + 커스텀 컴포넌트
│   ├── composables/        # Vue Composables
│   └── stores/             # Pinia 스토어
└── docs/                   # 프로젝트 문서
    ├── 기획/               # 기능정의서, 서비스정의서, 화면설계서 등
    ├── 기술/               # AI 고도화, MCP 확장성 기획서
    └── 운영/               # 프로덕션 준비, 비용 가이드
```

---

## 시작하기

상세한 설정 가이드: [PROJECT_SETUP.md](./PROJECT_SETUP.md)

### 사전 요구사항
- Node.js 22+
- npm 10+
- Supabase 계정 (PostgreSQL)

### 빠른 시작

```bash
# 1. 저장소 클론
git clone git@github.com:DreamCodersKR/TechBuddy_MVP.git
cd TechBuddy_MVP

# 2. 백엔드
cd backend
npm install
cp .env.example .env       # 환경변수 설정
npm run start:dev          # http://localhost:8080

# 3. 프론트엔드 (새 터미널)
cd frontend
npm install
cp .env.example .env
npm run dev                # http://localhost:3000
```

---

## 문서

| 카테고리 | 문서 |
|---------|------|
| 기획 | [기능정의서 v2.3](docs/기획/FLOWIT_기능정의서_v2.3.md), [서비스정의서](docs/기획/FLOWIT_서비스정의서.md), [화면설계서](docs/기획/FLOWIT_화면설계서_v1.0.md) |
| 기술 | [AI 고도화 기획서](docs/기술/FLOWIT_LangChain_AI_고도화_기획서_v1.0.md), [MCP 확장성 기획서](docs/기술/FLOWIT_MCP_API_확장성_기획서_v1.0.md) |
| 운영 | [프로덕션 준비 가이드](docs/운영/FLOWIT_프로덕션_준비_가이드.md), [비용 가이드라인](docs/운영/FLOWIT_비용_및_Unit_Economics_가이드라인_v2.md) |
| API | Swagger UI — `http://localhost:8080/api-docs` (개발 환경) |

---

## License

Private - All rights reserved

---

**DreamCoders Team**
