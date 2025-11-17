# TechBuddy 프로젝트 기획서 v1.3

**작성일**: 2025년 1월 17일  
**프로젝트명**: TechBuddy  
**목표**: IT 부트캠프 학생을 위한 커뮤니티 기반 성장 플랫폼

---

## 📋 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [문제 정의 및 솔루션](#2-문제-정의-및-솔루션)
3. [타겟 사용자](#3-타겟-사용자)
4. [핵심 기능](#4-핵심-기능)
5. [기술 스택](#5-기술-스택)
6. [팀 구성](#6-팀-구성)
7. [MVP 로드맵](#7-mvp-로드맵)
8. [부트캠프 영업 전략](#8-부트캠프-영업-전략)
9. [수익 모델](#9-수익-모델)
10. [성공 지표](#10-성공-지표)

---

## 1. 프로젝트 개요

### 1.1 서비스명
**TechBuddy** (테크버디)

### 1.2 서비스 정의
IT 부트캠프 학생과 취준생, 주니어 개발자를 위한 **커뮤니티 기반 성장 플랫폼**

### 1.3 핵심 가치
- **성장**: 멘토링과 프로젝트를 통한 실력 향상
- **연결**: 동료 및 멘토와의 네트워킹
- **실용성**: 초보자 친화적인 프로젝트 관리 도구
- **커뮤니티**: 등급별 맞춤 정보 공유

### 1.4 차별화 포인트
1. **부트캠프 학생 특화**: 일반 개발자 커뮤니티와 달리 초보자 중심
2. **올인원 플랫폼**: 커뮤니티 + 멘토링 + 프로젝트 관리 + 교육기관 홍보
3. **초보자용 PM 도구**: Linear/Jira의 복잡함 없이 쉬운 프로젝트 관리
4. **검증된 유입 채널**: 부트캠프 강사 출신 팀원을 통한 직접 영업

---

## 2. 문제 정의 및 솔루션

### 2.1 타겟 사용자의 Pain Points

#### 부트캠프 학생/취준생
```
❌ 문제 1: 실무 경험 부족
   → 포트폴리오용 프로젝트 필요하지만 막막함

❌ 문제 2: 멘토 찾기 어려움
   → 주변에 물어볼 시니어 개발자가 없음

❌ 문제 3: 프로젝트 관리 도구 진입장벽
   → Jira, Linear 너무 복잡하고 팀원도 안 씀

❌ 문제 4: 정보 부족
   → 취업 정보, 실무 팁을 어디서 얻어야 할지 모름

❌ 문제 5: 교육기관 정보 파편화
   → 각 부트캠프 정보가 흩어져 있어 비교 어려움
```

#### 주니어 개발자
```
❌ 문제 1: 성장 정체
   → 혼자 공부하는데 한계, 방향성 불명확

❌ 문제 2: 네트워킹 부족
   → 사이드 프로젝트 같이 할 동료 찾기 어려움

❌ 문제 3: 커리어 고민
   → 이직, 기술 스택 선택 등 조언 필요
```

### 2.2 TechBuddy의 솔루션

```
✅ 솔루션 1: 등급별 커뮤니티
   → 취준생/주니어/시니어별 맞춤 정보 제공

✅ 솔루션 2: 멘토링 매칭 시스템
   → 시니어 개발자와 쉽게 연결

✅ 솔루션 3: 초보자용 프로젝트 관리
   → 배우기 쉬운 칸반보드 + 협업 도구
   → Help 상태로 막힌 부분 즉시 요청

✅ 솔루션 4: 검증된 유입 채널
   → 부트캠프와 파트너십을 통한 안정적 유저 확보

✅ 솔루션 5: 교육기관 통합 플랫폼
   → 한 곳에서 모든 부트캠프 정보 확인
   → 기관별 커뮤니티로 소속감 제공
```

---

## 3. 타겟 사용자

### 3.1 Primary Target (주요 타겟)

#### 부트캠프 학생
- 코딩 부트캠프 수강 중이거나 수료한 학생
- 나이: 20-35세
- 특징: IT 커리어 전환, 비전공자 많음
- 니즈: 취업 준비, 포트폴리오, 멘토링

#### IT 취준생
- IT 분야 취업 준비 중
- 포트폴리오 프로젝트 필요
- 면접 준비 및 정보 교환

### 3.2 Secondary Target (보조 타겟)

#### 주니어 개발자 (0-3년 차)
- 실무 경험 쌓고 있는 단계
- 사이드 프로젝트 관심 있음
- 커리어 성장 고민

#### 시니어 개발자/멘토
- 멘토링에 관심 있는 경력 개발자
- 지식 공유 및 보람
- 추후 유료 멘토링 수익 가능

#### 교육기관 관리자
- 부트캠프, 학원 등 IT 교육기관
- 학생 모집 및 홍보 필요
- 수료생 커뮤니티 운영 니즈

---

## 4. 핵심 기능

### 4.1 메인 탭 구조

```
📱 메인 탭
├─ 🏠 홈
├─ 🌐 커뮤니티 (전체)
│  ├─ 자유게시판
│  ├─ 프로젝트 구인
│  └─ 취업/진로
│
├─ 🤝 [조건부 렌더링]
│  │
│  ├─ [기관 소속자] 스마트인재개발원
│  │  ├─ 학생 게시판
│  │  ├─ 수료생 게시판
│  │  └─ 취업/진로
│  │
│  └─ [일반 사용자] 교육기관
│     └─ 기관별 홍보 게시글 (외부 링크 포함)
│
├─ 👥 멘토링
└─ 📋 프로젝트
```

---

### 4.2 Phase 1 (1개월차) - 커뮤니티 기반 구축

#### 목표
일단 사용자들이 모일 수 있는 공간 만들기

#### 구현 기능
```
✅ 회원 시스템
   - 이메일/소셜 로그인 (Google, GitHub)
   - 프로필 생성 (이름, 등급, 기술스택)
   - 소속 기관 등록 (프로필에서 선택 → 관리자 승인)

✅ 등급 인증 시스템
   - 취준생: 기본 설정
   - 주니어: 재직증명서 or 포트폴리오
   - 시니어: 경력증명서 (3년 이상)

✅ 등급별 게시판
   - 공통 게시판: 모든 등급 접근 가능
     * 일반 Q&A
     * 프로젝트 쇼케이스
     * IT 뉴스/트렌드
   
   - 취준생 전용 게시판
     * 포트폴리오 피드백
     * 면접 후기
     * 취업 스터디 모집
   
   - 주니어 전용 게시판
     * 실무 고민 상담
     * 사이드 프로젝트 협업
   
   - 시니어 전용 게시판
     * 멘토링 경험 공유
     * 기술 트렌드 심화

✅ 게시물 CRUD
   - 작성, 수정, 삭제
   - 댓글 시스템
   - 좋아요/북마크
   - 코드 하이라이팅 (Markdown 지원)

✅ 검색 및 필터링
   - 게시판별 검색
   - 태그 기반 필터

✅ 교육기관 페이지 (신규)
   - 기관별 홍보 게시글 목록
   - 외부 링크 (지원하기, 참가신청 등)
   - 기관 정보 (위치, 학생 수)
   - 검색 및 필터링
```

#### 결과물
- 기본 커뮤니티 오픈 가능
- 스마트인재개발원에 첫 소개

---

### 4.3 Phase 2 (2개월차) - 핵심 가치 추가

#### 목표
멘토링 + 실시간 소통으로 핵심 차별화

#### 구현 기능
```
✅ 멘토 프로필 시스템
   - 전문 분야 (프론트엔드/백엔드/DevOps 등)
   - 사용 가능 기술 스택
   - 경력 연차
   - 멘토링 가능 시간대
   - 자기소개 및 멘토링 스타일

✅ 멘토링 매칭 (수동 방식)
   - 멘토 목록 조회 및 필터링
   - 멘토 프로필 상세 보기
   - 멘토링 신청 (메시지 포함)
   - 멘토 수락/거절
   - 멘토링 일정 조율

✅ 1:1 실시간 채팅
   - 멘토-멘티 간 실시간 메시징
   - 코드 스니펫 공유
   - 파일 첨부 (이미지, 문서)
   - 읽음 표시
   - 채팅 히스토리

✅ 멘토링 평가 시스템
   - 멘토링 완료 후 후기 작성
   - 별점 (1-5점)
   - 멘토 평판 점수 집계
   - 우수 멘토 배지

✅ 기관 소속 관리 (신규)
   - 소속 신청 관리 (관리자)
   - 승인/거절 처리
   - 멤버 목록 조회
   - 역할 변경 (학생/수료생/관리자)
```

#### 결과물
- "멘토 연결" 핵심 기능 완성
- 부트캠프 학생 초기 유입 시작

---

### 4.4 Phase 3 (3개월차) - 차별화 기능

#### 목표
프로젝트 관리 도구로 완전한 차별화

#### 구현 기능
```
✅ 프로젝트 생성 및 관리
   - 프로젝트 생성 (제목, 설명, 목표)
   - 팀원 초대 (이메일/사용자명)
   - 프로젝트 대시보드
   - 프로젝트 설정 (공개/비공개)
   - Overview 작성 (Markdown)

✅ 권한 관리 시스템
   - PM: 모든 권한 (설정, 멤버 관리, Task 생성/삭제)
   - 팀장: Task 생성/수정/삭제, 멤버 초대
   - 팀원: 자신의 Task 수정, 상태 변경
   - 멘토: 읽기 전용 + 코멘트 작성

✅ 칸반 보드 (부트캠프 특화)
   - 4개 칼럼: Todo / In Progress / Done / Help
   - Help 상태: 막혔을 때 도움 요청
     * Help 사유 입력 필수
     * 멘토/PM에게 자동 알림
   - 드래그앤드롭으로 카드 이동
   - 칼럼별 진행률 표시

✅ 태스크 카드 시스템
   - 카드 생성 (제목, 설명)
   - 우선순위 설정 (높음/중간/낮음)
   - 마감일 설정
   - 담당자 할당
   - 태그/라벨
   - 체크리스트 (서브 태스크)
   - 코멘트 (멘토 피드백)

✅ 산출문서 보관 (신규)
   - 폴더 구조 (기획서/설계서/발표자료/기타)
   - 파일 업로드/다운로드
   - 버전 관리
   - 전체 다운로드 (ZIP)
   - 권한별 접근 제어

✅ 타임라인 뷰
   - 프로젝트 전체 일정 시각화
   - 주별/월별 뷰
   - 마감일 기반 자동 정렬
   - 지연 태스크 강조

✅ 알림 시스템
   - 태스크 할당 알림
   - 마감일 임박 알림
   - 코멘트 알림
   - 프로젝트 초대 알림
   - Help 요청 알림 (멘토/PM)
```

#### 결과물
- 완전한 MVP 완성
- 본격 부트캠프 영업 시작

---

## 5. 기술 스택

### 5.1 프론트엔드
```typescript
// 코어
- Nuxt.js 3
- TypeScript
- Vue 3

// UI 라이브러리
- Tailwind CSS
- Shadcn-vue (재사용 컴포넌트)

// 상태 관리
- Pinia (Vuex 대체)

// 실시간
- Socket.io-client

// 드래그앤드롭
- vue-draggable-next

// 기타
- VueUse (유틸리티)
- Zod (스키마 검증)
```

### 5.2 백엔드
```typescript
// 프레임워크
- NestJS (Node.js)
- TypeScript

// ORM 및 데이터베이스
- Prisma ORM
- PostgreSQL (메인 DB)

// 실시간
- Socket.io

// 캐싱
- Redis (세션, 캐싱)

// 인증
- Passport.js
- JWT

// 파일 업로드
- Multer
- Cloudflare R2 (S3 호환)
```

### 5.3 인프라 및 배포
```yaml
# 배포
프론트엔드: Vercel
백엔드: Railway
데이터베이스: Supabase (PostgreSQL + Realtime)
캐시: Redis Cloud (무료 30MB)
파일 스토리지: Cloudflare R2

# CI/CD
GitHub Actions

# 모니터링
- Sentry (에러 트래킹)
- Railway 기본 메트릭

# 개발 환경
- Docker Compose
- 로컬 DB: MariaDB or PostgreSQL
```

### 5.4 기술 스택 선정 이유

#### Nuxt.js 3 선택 이유
- ✅ 팀원(박지승)이 Vue/Nuxt 전문가
- ✅ TypeScript 완벽 지원
- ✅ SSR/SSG로 SEO 최적화
- ✅ Auto-import로 개발 생산성 UP
- ✅ 모듈 생태계 풍부

#### NestJS 선택 이유
- ✅ Nuxt.js와 언어 통일 (TypeScript)
- ✅ 팀 협업 효율 향상
- ✅ 모듈화된 구조로 확장 용이
- ✅ Socket.io 통합 쉬움
- ✅ 이미 Node.js 22.14 환경 준비됨

#### Railway 선택 이유
- ✅ MVP 단계에서 빠른 배포 (5분)
- ✅ AWS보다 저렴한 시작 비용 ($10-20/월)
- ✅ GitHub 자동 배포
- ✅ 복잡한 인프라 설정 불필요
- ✅ 추후 AWS 마이그레이션 가능

---

## 6. 팀 구성

### 6.1 팀원 및 역할
```
총 5명 팀

PM/인프라: 1명 (윤종호)
- 프로젝트 총괄 관리
- 인프라 설정 및 배포
- 백엔드 개발

프론트엔드 개발자: 1명 (박지승)
- Nuxt.js 개발
- UI/UX 구현

백엔드 개발자: 1명
- NestJS API 개발
- DB 설계 및 최적화

디자이너: 1명
- UI/UX 디자인
- 디자인 시스템 구축

앱 개발자 (Flutter): 1명 (박시형)
- Phase 4 이후 모바일 앱 개발
- MVP 기간 중 웹 개발 지원 가능
```

### 6.2 핵심 강점
```
✨ 스마트인재개발원 강사 출신 팀원 (박지승)
- 부트캠프와 직접 연결 가능
- 타겟 사용자 니즈 정확히 파악
- 초기 사용자 확보 용이
```

---

## 7. MVP 로드맵

### 7.1 전체 일정 (3개월)

```
월차          주요 기능                    마일스톤
───────────────────────────────────────────────────
1개월차    회원 + 게시판 + 교육기관      커뮤니티 오픈
           └─ 4주                       스마트인재개발원 소개

2개월차    멘토링 + 채팅 + 기관 관리     핵심 기능 완성
           └─ 4주                       베타 테스터 모집

3개월차    프로젝트 관리 + 산출문서      MVP 완성
           └─ 4주                       정식 런칭
```

### 7.2 상세 주차별 계획

#### 1개월차 - Phase 1

**Week 1-2: 기반 구축**
```
백엔드:
- 프로젝트 세팅 (NestJS, Prisma)
- DB 스키마 설계
  * Users, Organizations, Organization_Members 테이블
- 회원 API (회원가입, 로그인)
- 등급 인증 API

프론트엔드:
- 프로젝트 세팅 (Nuxt.js)
- 디자인 시스템 구축 (Shadcn-vue)
- 랜딩 페이지
- 회원가입/로그인 UI

인프라:
- Railway, Vercel 초기 배포
- GitHub Actions CI/CD 설정
```

**Week 3-4: 게시판 + 교육기관**
```
백엔드:
- 게시판 API (CRUD)
- 댓글 API
- 권한 관리 (등급별 접근)
- 교육기관 API (Organization_Promotions)

프론트엔드:
- 게시판 리스트/상세 페이지
- 글쓰기 에디터 (Markdown)
- 댓글 컴포넌트
- 교육기관 페이지 (홍보 게시글 목록)

QA:
- 기능 테스트
- 버그 수정
```

**1개월 결과물**
- ✅ 회원가입/로그인 가능
- ✅ 등급별 게시판 이용 가능
- ✅ 교육기관 페이지 확인 가능
- ✅ 스마트인재개발원 데모

---

#### 2개월차 - Phase 2

**Week 5-6: 멘토 시스템**
```
백엔드:
- 멘토 프로필 API
- 멘토링 신청/수락 API
- 알림 시스템
- 기관 소속 승인 API

프론트엔드:
- 멘토 리스트 페이지
- 멘토 프로필 상세
- 멘토링 신청 폼
- 프로필에서 소속 기관 선택

디자인:
- 멘토 프로필 디자인
- 신청 플로우 UX 개선
```

**Week 7-8: 실시간 채팅**
```
백엔드:
- Socket.io 서버 구축
- 채팅 메시지 저장
- 파일 업로드 API

프론트엔드:
- 채팅 UI 구현
- 실시간 메시지
- 파일 첨부 기능
- 기관 관리자 대시보드 (소속 승인)

QA & 배포:
- 베타 테스터 10-20명 모집
- 피드백 수집
```

**2개월 결과물**
- ✅ 멘토-멘티 매칭 가능
- ✅ 실시간 1:1 채팅
- ✅ 기관 소속 신청/승인 가능
- ✅ 베타 테스트 시작

---

#### 3개월차 - Phase 3

**Week 9-10: 프로젝트 관리 기본**
```
백엔드:
- 프로젝트 CRUD API
- 칸반보드 API (4가지 상태)
- 태스크 카드 API
- Help 상태 처리 및 알림
- 권한 체계 구현

프론트엔드:
- 프로젝트 대시보드
- 칸반보드 UI (vue-draggable-next)
- Help 상태 UI 및 알림
- 코멘트 시스템
```

**Week 11-12: 산출문서 & 마무리**
```
백엔드:
- 산출문서 업로드/다운로드 API
- 폴더 구조 관리
- 타임라인 API
- 알림 시스템 통합

프론트엔드:
- 산출문서 보관함 UI
- 타임라인 뷰
- 알림 센터
- 전체 UX 개선

QA:
- 전체 기능 테스트
- 성능 최적화
- 버그 픽스

런칭 준비:
- 랜딩 페이지 최적화
- 온보딩 플로우
- 도움말 페이지
```

**3개월 결과물 (최종 MVP)**
- ✅ 완전한 커뮤니티 플랫폼
- ✅ 멘토링 시스템
- ✅ 프로젝트 관리 도구 (Help 상태 포함)
- ✅ 산출문서 보관 시스템
- ✅ 교육기관 홍보 플랫폼
- ✅ 정식 런칭

---

## 8. 부트캠프 영업 전략

### 8.1 초기 파트너: 스마트인재개발원

#### 접근 방식
```
1개월 후: 초기 데모
- 팀원(전 강사)을 통한 소개
- "이런 거 만들고 있어요" 가벼운 프레젠테이션
- 니즈 파악 및 피드백

2개월 후: 베타 테스트
- 수강생 10-20명 베타 테스터 모집
- 실제 사용 후 피드백 수집
- 기능 개선

3개월 후: 정식 도입 제안
- 완성된 MVP 시연
- 기관용 플랜 제시
- 파트너십 논의
```

#### 제공 가치 (부트캠프 측 메리트)
```
✅ 학생 포트폴리오 관리 용이
   - 프로젝트 진행 상황 한눈에 파악
   - 수료 후에도 지속적인 성장 지원

✅ 취업률 향상
   - 멘토링을 통한 실력 향상
   - 포트폴리오 프로젝트 완성도 UP
   - 커뮤니티 네트워킹

✅ 학생 참여율 증대
   - 게임화된 프로젝트 관리
   - Help 상태로 즉시 도움 요청
   - 동료들과 경쟁/협력
   - 지속적인 학습 동기부여

✅ 강사진 업무 효율
   - 학생별 진도 자동 추적
   - Help 상태로 막힌 팀 즉시 파악
   - 일괄 피드백 가능
   - 우수 프로젝트 쇼케이스

✅ 홍보 채널 확보
   - TechBuddy 교육기관 페이지에 무료 홍보
   - 타겟 사용자에게 직접 도달
   - 외부 링크로 자체 가입 프로세스 유지
```

### 8.2 확장 전략 (4개월 이후)

#### 타겟 부트캠프
```
1순위: 코딩 부트캠프
- 코드스테이츠
- 엘리스
- 제로베이스
- 패스트캠퍼스

2순위: 대학 연계 프로그램
- K-Digital Training
- 혁신성장 청년인재 집중양성

3순위: 기업 교육 프로그램
- 삼성 청년 SW 아카데미 (SSAFY)
- 네이버 부스트캠프
- 카카오 테크캠퍼스
```

#### 영업 자료
```
✅ 성공 사례
- 스마트인재개발원 사용 통계
- 학생 인터뷰 및 후기
- 취업률 개선 데이터

✅ ROI 계산
- 학생 1인당 비용
- 기대 효과 (취업률, 만족도)
- 타 솔루션 대비 이점

✅ 데모 계정
- 즉시 체험 가능한 샘플
- 가이드 투어
```

---

## 9. 수익 모델

### 9.1 프리미엄 전략

#### Free 플랜 (무료)
```
목표: 최대한 많은 사용자 유입

제공 기능:
✅ 등급별 게시판 무제한 이용
✅ 프로필 및 포트폴리오
✅ 월 3회 멘토링 신청
✅ 프로젝트 1개 생성
✅ 팀원 최대 3명
✅ 기본 칸반보드
✅ 교육기관 정보 열람

제한 사항:
❌ 멘토링 횟수 제한
❌ 프로젝트 개수 제한
❌ 고급 프로젝트 관리 기능 제한
```

#### Premium 플랜 (월 9,900원)
```
목표: 적극적 사용자 전환

제공 기능:
✅ Free 플랜 모든 기능
✅ 무제한 멘토링 신청
✅ 프로젝트 무제한 생성
✅ 팀원 무제한
✅ 우선 멘토 매칭
✅ 고급 타임라인 뷰
✅ 프로젝트 분석 리포트
✅ 산출문서 무제한 업로드
✅ 광고 없음
✅ 프리미엄 배지

예상 전환율: 5-10%
```

### 9.2 B2B 모델 (기관용)

#### 부트캠프 플랜 (별도 협의)
```
가격: 학생 1인당 월 3,000-5,000원
      (기관 규모에 따라 할인)

제공:
✅ 수강생 전원 Premium 기능
✅ 관리자 대시보드
   - 학생별 활동 모니터링
   - 프로젝트 진행률 추적
   - Help 상태 실시간 확인
   - 출석/참여도 통계
✅ 교육기관 페이지 우선 노출
✅ 홍보 게시글 무제한
✅ 전용 멘토 배정 (옵션)
✅ 커스터마이징 (로고, 색상)
✅ 우선 기술 지원
✅ 데이터 분석 리포트

예상 매출:
- 학생 100명 기관 = 월 30-50만원
- 학생 500명 기관 = 월 150-250만원
```

### 9.3 수익 예측 (12개월 후)

#### 보수적 시나리오
```
개인 사용자:
- MAU 1,000명
- Premium 전환 5%
- 50명 × 9,900원 = 월 495,000원

기관 고객:
- 부트캠프 3곳 (평균 학생 200명)
- 600명 × 4,000원 = 월 2,400,000원

월 매출: 약 290만원
연 매출: 약 3,500만원
```

#### 낙관적 시나리오
```
개인 사용자:
- MAU 5,000명
- Premium 전환 8%
- 400명 × 9,900원 = 월 3,960,000원

기관 고객:
- 부트캠프 10곳 (평균 학생 250명)
- 2,500명 × 4,000원 = 월 10,000,000원

월 매출: 약 1,400만원
연 매출: 약 1억 6,800만원
```

### 9.4 추가 수익 모델 (Phase 4 이후)

```
💰 유료 멘토링 마켓플레이스
- 시니어 멘토 1:1 유료 세션
- 플랫폼 수수료 15-20%

💰 취업 지원 서비스
- 이력서 첨삭 (유료)
- 모의 면접 (유료)
- 포트폴리오 리뷰 (유료)

💰 기업 채용 서비스
- 프리미엄 채용 공고
- 인재 추천 수수료
- 기업 브랜딩 콘텐츠

💰 교육 콘텐츠
- 프리미엄 강의
- 워크샵 및 세미나
- 인증 프로그램

💰 교육기관 프리미엄 홍보
- 상단 고정 광고
- 배너 광고
- 타겟팅 광고
```

---

## 10. 성공 지표

### 10.1 단계별 목표 (KPI)

#### MVP 3개월 후 목표
```
사용자:
✅ 가입자 수: 300명 이상
✅ MAU: 150명 이상
✅ 등급 분포: 취준생 60% / 주니어 30% / 시니어 10%

활동:
✅ 게시물: 월 100개 이상
✅ 댓글: 월 300개 이상
✅ 멘토링 매칭: 월 30건 이상
✅ 프로젝트 생성: 월 20개 이상

부트캠프:
✅ 파트너 기관: 1곳 (스마트인재개발원)
✅ 기관 사용자: 50명 이상

프로젝트 관리:
✅ Help 상태 사용: 월 10건 이상
✅ 산출문서 업로드: 월 30개 이상
```

#### 6개월 후 목표
```
사용자:
✅ 가입자 수: 1,000명 이상
✅ MAU: 500명 이상
✅ Premium 전환: 5% (50명)

활동:
✅ 게시물: 월 300개 이상
✅ 멘토링 매칭: 월 100건 이상
✅ 프로젝트 완료율: 30% 이상

부트캠프:
✅ 파트너 기관: 3곳
✅ 기관 사용자: 200명 이상
✅ 교육기관 페이지 홍보글: 10개 이상

수익:
✅ 월 매출: 100만원 이상
```

#### 12개월 후 목표
```
사용자:
✅ 가입자 수: 5,000명 이상
✅ MAU: 2,000명 이상
✅ Premium 전환: 7% (350명)

부트캠프:
✅ 파트너 기관: 10곳
✅ 기관 사용자: 1,000명 이상
✅ 교육기관 페이지 홍보글: 50개 이상

수익:
✅ 월 매출: 500만원 이상
✅ 연 매출: 6,000만원 이상
```

### 10.2 핵심 측정 지표

#### 사용자 지표
```
- 신규 가입자 수 (주간/월간)
- MAU (Monthly Active Users)
- DAU (Daily Active Users)
- 사용자 유지율 (1개월, 3개월, 6개월)
- 등급별 분포
- 이탈률
```

#### 참여 지표
```
- 게시물 수 (주간/월간)
- 댓글 수
- 평균 세션 시간
- 페이지뷰
- 사용자당 평균 활동 수
```

#### 멘토링 지표
```
- 멘토링 신청 건수
- 멘토링 성사율
- 평균 멘토링 만족도
- 멘토 활동 비율
- 재매칭 비율
```

#### 프로젝트 지표
```
- 생성된 프로젝트 수
- 프로젝트 완료율
- 평균 팀원 수
- 태스크 완료율
- Help 상태 전환 빈도
- Help 해결 시간
- 산출문서 업로드 수
- 프로젝트당 활동량
```

#### 교육기관 지표
```
- 등록된 교육기관 수
- 홍보 게시글 수
- 홍보 게시글 조회수
- 외부 링크 클릭수
- 기관별 소속 신청 수
- 소속 승인율
```

#### 비즈니스 지표
```
- Premium 전환율
- 이탈율 (Churn Rate)
- LTV (고객 생애 가치)
- CAC (고객 획득 비용)
- MRR (월간 반복 매출)
- 부트캠프 파트너 수
```

### 10.3 성공 정의

#### 3개월 후 (MVP 성공)
```
✅ 스마트인재개발원 학생 50명 이상 사용
✅ 주간 활성 사용자 100명 이상
✅ 멘토링 만족도 4.0/5.0 이상
✅ 프로젝트 관리 도구 사용률 50% 이상
✅ Help 상태 활용률 20% 이상
```

#### 6개월 후 (제품 시장 적합성 달성)
```
✅ 부트캠프 3곳 이상 파트너십
✅ 자발적 가입자 50% 이상
✅ Premium 전환율 5% 이상
✅ 월 매출 100만원 돌파
✅ 교육기관 페이지 활성화
```

#### 12개월 후 (성장 단계)
```
✅ 부트캠프 10곳 이상 파트너십
✅ MAU 2,000명 이상
✅ 월 매출 500만원 이상
✅ 프리미엄 사용자 300명 이상
✅ 프로덕트 마켓 핏 검증 완료
```

---

## 11. 위험 요소 및 대응

### 11.1 주요 위험 요소

#### 기술적 위험
```
❌ 실시간 기능 안정성
대응: Phase 2에서 충분한 테스트
     → Redis 활용한 안정적 세션 관리

❌ 트래픽 급증 시 성능
대응: Railway → AWS 마이그레이션 플랜
     → 초기부터 확장 가능한 아키텍처 설계

❌ 파일 업로드 처리
대응: Cloudflare R2로 안정적인 파일 저장
     → 파일 크기 제한 (50MB)
```

#### 비즈니스 위험
```
❌ 부트캠프 영업 실패
대응: 
- Plan A: 스마트인재개발원 집중 공략
- Plan B: 일반 개인 사용자 확보로 전환
- Plan C: 교육기관 홍보 플랫폼으로 피봇

❌ 경쟁 서비스 등장
대응: 
- 빠른 MVP 출시로 선점
- 부트캠프 특화 기능 (Help 상태)
- 부트캠프와 긴밀한 파트너십
- 지속적인 기능 업데이트

❌ 교육기관 유치 어려움
대응:
- 초기 무료 홍보 제공
- 성공 사례 빠르게 구축
- B2C 사용자 기반 확보 → B2B 전환
```

#### 팀 운영 위험
```
❌ 팀원 이탈
대응:
- 명확한 역할 분담
- 주 1회 정기 미팅
- 단기 목표로 성취감 제공

❌ 개발 일정 지연
대응:
- 2주 스프린트로 진행 관리
- 핵심 기능 우선순위 명확화
- 기능 축소 가능한 백업 플랜
```

---

## 12. DB 스키마 (신규 추가)

### 12.1 교육기관 관련 테이블

#### Organizations (교육기관)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  student_count INTEGER DEFAULT 0,
  logo_url VARCHAR(255),
  website_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Organization_Promotions (홍보 게시글)
```sql
CREATE TABLE organization_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  external_link VARCHAR(500) NOT NULL, -- 지원 링크
  link_text VARCHAR(50) DEFAULT '지원하기', -- 링크 버튼 텍스트
  image_url VARCHAR(255),
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Organization_Members (기관 소속)
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'ADMIN', 'STUDENT', 'GRADUATE'
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  UNIQUE(organization_id, user_id)
);
```

### 12.2 프로젝트 관리 관련 테이블

#### Projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  overview TEXT, -- Markdown
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'archived'
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Project_Members
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'PM', 'TEAM_LEADER', 'MEMBER', 'MENTOR'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

#### Tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'TODO', -- 'TODO', 'IN_PROGRESS', 'DONE', 'HELP'
  priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
  help_reason TEXT, -- Help 상태 시 이유
  due_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Task_Labels
```sql
CREATE TABLE task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL
);
```

#### Task_Comments
```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Project_Files (산출문서)
```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  folder VARCHAR(50) NOT NULL, -- '기획서', '설계서', '발표자료', '기타'
  description TEXT,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

## 13. 다음 단계 (Action Items)

### 13.1 즉시 시작 (이번 주)
```
✅ 팀 킥오프 미팅
   - 기획서 v1.3 공유
   - 역할 확정
   - 개발 환경 세팅

✅ 디자인 시작
   - 와이어프레임
   - 디자인 시스템 기본 색상, 폰트
   - 교육기관 페이지 디자인

✅ 기술 스택 환경 구축
   - 레포지토리 생성
   - 개발 환경 세팅
   - Railway, Vercel 계정 준비
```

### 13.2 1주차 목표
```
✅ 프로젝트 초기 세팅 완료
✅ 주요 페이지 와이어프레임
✅ DB 스키마 최종 확정
✅ API 명세 최종 검토
```

### 13.3 정기 미팅 계획
```
주 1회 전체 회의 (매주 토요일)
- 진행 상황 공유
- 이슈 논의
- 다음 주 계획

필요시 개발 스탠드업
- 프론트/백엔드 싱크
- 기술적 이슈 해결
```

---

## 14. 부록

### 14.1 참고 사이트
```
벤치마킹:
- Blind (등급별 커뮤니티)
- Okky (국내 개발자 커뮤니티)
- Linear (프로젝트 관리)
- Wanted (멘토링 시스템)
- 인프런 (교육기관 홍보)

디자인 참고:
- Vercel
- Linear
- Notion
- Figma Community
```

### 14.2 용어 정의
```
- MVP: Minimum Viable Product (최소 기능 제품)
- MAU: Monthly Active Users (월간 활성 사용자)
- DAU: Daily Active Users (일간 활성 사용자)
- PM: Product Manager (프로덕트 매니저) 또는 Project Manager
- 칸반: Kanban, 작업 시각화 보드
- 스프린트: 2주 단위 개발 주기
- Help 상태: 부트캠프 특화 기능, 학생이 막혔을 때 도움 요청
```

---

**문서 버전**: v1.3  
**최종 수정**: 2025년 1월 17일  
**작성자**: TechBuddy 팀  
**상태**: Final Draft

---

## 변경 이력
- 2025.10.29: v1.0 초안 작성
- 2025.11.04: v1.2 기술 스택 변경 (Next.js → Nuxt.js)
- 2025.01.17: v1.3 교육기관 기능 추가, 프로젝트 관리 상세화, DB 스키마 추가
