# 🚀 TechBuddy MVP

> IT 부트캠프 학생을 위한 **올인원 성장 플랫폼**  
> 커뮤니티 · 멘토링 · 프로젝트 관리

[![GitHub](https://img.shields.io/badge/GitHub-DreamCodersKR%2FTechBuddy__MVP-blue?logo=github)](https://github.com/DreamCodersKR/TechBuddy_MVP)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red)]()

---

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [핵심 기능](#-핵심-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [개발 로드맵](#-개발-로드맵)
- [팀 구성](#-팀-구성)
- [문서](#-문서)

---

## 🎯 프로젝트 소개

**TechBuddy**는 IT 부트캠프 학생들이 겪는 다음 문제들을 해결합니다:

### 🔴 Pain Points

```
❌ 실무 경험 부족 → 포트폴리오 프로젝트 막막함
❌ 멘토 찾기 어려움 → 주변에 물어볼 시니어가 없음
❌ 프로젝트 관리 도구 진입장벽 → Jira/Linear 너무 복잡
❌ 정보 부족 → 취업 정보를 어디서 얻어야 할지 모름
```

### ✅ Solutions

```
✅ 등급별 커뮤니티 → 취준생/주니어/시니어별 맞춤 정보
✅ 멘토링 매칭 → 시니어 개발자와 쉽게 연결
✅ 초보자용 PM 도구 → 배우기 쉬운 칸반보드 + Help 상태
✅ 검증된 유입 채널 → 부트캠프 파트너십
```

---

## 🌟 핵심 기능

### Phase 1: 커뮤니티 (1개월차)

- 등급별 게시판 (취준생/주니어/시니어)
- 회원 시스템 & 등급 인증
- 교육기관 홍보 플랫폼
- 기관별 커뮤니티 (Everytime 스타일)

### Phase 2: 프로젝트 관리 (2개월차)

- 초보자용 칸반보드 (Todo/In Progress/Done/Help)
- Task 관리 & 팀원 할당
- **Help 상태** (부트캠프 특화 기능)
- 산출문서 보관함

### Phase 3: 멘토링 (3개월차)

- 멘토-멘티 매칭
- 1:1 실시간 채팅
- 멘토링 평가 시스템

---

## 🛠️ 기술 스택

### Frontend

```typescript
- Nuxt.js 3        // Vue 3 프레임워크
- TypeScript       // 타입 안정성
- Tailwind CSS     // 스타일링
- Shadcn-vue       // UI 컴포넌트
- Socket.io        // 실시간 통신
- vue-draggable-next // 칸반보드
```

### Backend

```typescript
- NestJS           // Node.js 프레임워크
- TypeScript       // 타입 안정성
- Prisma ORM       // DB ORM
- PostgreSQL       // 메인 데이터베이스
- Redis            // 캐싱 & 세션
- Socket.io        // 실시간 통신
```

### Infrastructure

```yaml
Frontend: Vercel
Backend: Railway
Database: Supabase (PostgreSQL)
Cache: Redis Cloud
Storage: Cloudflare R2
```

---

## 📁 프로젝트 구조

```
TechBuddy_MVP/
├── 📄 docs/                    # 프로젝트 문서 (Git 포함)
│   ├── 01_기획서_v1.3.md
│   ├── 02_프로젝트관리_기능요구사항정의서_v1.0.md
│   ├── 03_프로젝트관리_API명세서_v1.0.md
│   ├── 04_DB스키마_설계.sql
│   ├── 05_개발가이드.md
│   ├── 06_Phase별_구현계획.md
│   └── ERD_20251114.jpg
│
├── 🔧 backend/                 # NestJS 백엔드
│   ├── src/
│   │   ├── auth/              # 인증 모듈
│   │   ├── users/             # 사용자 모듈
│   │   ├── projects/          # 프로젝트 관리
│   │   ├── tasks/             # Task 관리
│   │   ├── boards/            # 게시판
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma      # Prisma 스키마
│   └── package.json
│
├── 🎨 frontend/                # Nuxt.js 프론트엔드
│   ├── pages/                 # 페이지 라우팅
│   ├── components/            # Vue 컴포넌트
│   ├── composables/           # Vue Composables
│   ├── layouts/               # 레이아웃
│   └── package.json
│
├── 🔗 shared/                  # 공통 타입/유틸
│   ├── types/
│   │   ├── api.types.ts      # API 타입
│   │   └── models.types.ts   # DB 모델 타입
│   └── utils/
│
├── .gitignore
├── README.md                   # 이 파일
└── PROJECT_SETUP.md            # 개발 시작 가이드
```

---

## 🚀 시작하기

### 사전 요구사항

```bash
Node.js: v22.14 이상
PostgreSQL: 14 이상
Redis: 7 이상
```

### 빠른 시작

상세한 설정 가이드는 [PROJECT_SETUP.md](./PROJECT_SETUP.md)를 참고하세요.

```bash
# 1. 저장소 클론
git clone git@github.com:DreamCodersKR/TechBuddy_MVP.git
cd TechBuddy_MVP

# 2. 백엔드 설정
cd backend
npm install                # prisma generate 자동 실행됨
cp .env.example .env       # 환경변수 설정 (DATABASE_URL 필수!)
npx prisma migrate dev     # DB 마이그레이션
npm run start:dev          # 개발 서버 실행

# 3. 프론트엔드 설정
cd ../frontend
npm install
cp .env.example .env  # 환경변수 설정
npm run dev
```

---

## 📅 개발 로드맵

### 🗓️ MVP 타임라인 (2개월)

| Phase       | 기간    | 주요 기능                 | 마일스톤               |
| ----------- | ------- | ------------------------- | ---------------------- |
| **Phase 1** | 1개월차 | 커뮤니티 + 교육기관       | 커뮤니티 오픈          |
| **Phase 2** | 2개월차 | 프로젝트 관리 + Help 기능 | MVP 완성 & 베타 테스트 |
| **Phase 3** | 추후    | 멘토링 시스템             | 정식 런칭              |

### 📊 현재 진행 상황

```
✅ 기획서 v1.3 완료
✅ API 명세서 v1.0 완료
✅ ERD 설계 완료 (22개 테이블)
✅ 프로젝트 구조 생성
⏳ Prisma 스키마 작성 중
⏳ NestJS 초기 설정 대기
⏳ Nuxt.js 초기 설정 대기
```

---

## 👥 팀 구성

| 역할           | 이름   | 담당                               |
| -------------- | ------ | ---------------------------------- |
| **PM/인프라**  | 윤종호 | 프로젝트 총괄, 인프라 관리, 백엔드 |
| **프론트엔드** | 박지승 | Nuxt.js 개발, UI/UX 구현           |
| **백엔드**     | 윤종호 | NestJS API 개발, DB 설계           |
| **디자이너**   | 미정   | UI/UX 디자인                       |
| **앱 개발**    | 박시형 | Flutter 모바일 앱 (Phase 4)        |

### ⭐ Key Strength

**박지승** - 스마트인재개발원 강사 출신 → 직접 부트캠프 영업 가능

---

## 📚 문서

### 기획 문서

- [📄 기획서 v1.3](./docs/01_기획서_v1.3.md)
- [📄 프로젝트 관리 기능요구사항정의서](./docs/02_프로젝트관리_기능요구사항정의서_v1.0.md)
- [📄 API 명세서](./docs/03_프로젝트관리_API명세서_v1.0.md)

### 기술 문서

- [🗂️ DB 스키마 설계](./docs/04_DB스키마_설계.sql)
- [🖼️ ERD 다이어그램](./docs/ERD_20251114.jpg)
- [📖 개발 가이드](./docs/05_개발가이드.md)
- [📅 Phase별 구현 계획](./docs/06_Phase별_구현계획.md)

### 개발 가이드

- [🚀 프로젝트 셋업 가이드](./PROJECT_SETUP.md)
- [📖 Backend README](./backend/README.md)
- [📖 Frontend README](./frontend/README.md)

---

## 🎯 성공 지표

### 3개월 후 목표

```
✅ 가입자: 300명+
✅ MAU: 150명+
✅ 멘토링 매칭: 월 30건+
✅ 부트캠프 파트너: 1곳 (스마트인재개발원)
✅ 프로젝트 생성: 월 20개+
```

### 12개월 후 목표

```
🚀 가입자: 5,000명+
🚀 MAU: 2,000명+
🚀 부트캠프 파트너: 10곳+
🚀 월 매출: 500만원+
```

---

## 📄 License

Private - 상업적 사용 금지

---

## 📞 Contact

- **GitHub**: [@DreamCodersKR](https://github.com/DreamCodersKR)
- **Email**: llsee01@naver.com

---

**Made with ❤️ by DreamCoders Team**
