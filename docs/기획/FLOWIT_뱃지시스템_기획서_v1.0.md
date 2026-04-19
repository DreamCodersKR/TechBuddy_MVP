# FLOWIT 뱃지 시스템 기획서 v1.0

> 작성일: 2026-04-15 | 작성자: 윤종호 x Claude
> 관련 문서: FLOWIT_기능정의서_v2.3.md (섹션 19)

---

## 1. 개요

### 1-1. 배경

기존 뱃지 시스템은 단순 수집형(NEW_MEMBER, ACTIVITY 등)으로, 닉네임 옆에 시각적으로 표시되지 않아 커뮤니티 내 유저 식별 효과가 낮았음.

### 1-2. 변경 방향 (FM코리아 참고)

- **대표 뱃지 1개**를 유저가 선택하여 닉네임 옆에 항상 표시
- 뱃지는 **업적 기반 + 구독 + 엔터프라이즈 로고**로 구성
- 마우스 hover 시 뱃지 이름/설명 툴팁 표시
- 레벨은 프로필 조회 시에만 확인 가능 (닉네임 옆 표시 X)

### 1-3. 기대 효과

- 커뮤니티 내 유저 활동 수준 즉시 파악
- 뱃지 획득 동기부여 → 활동량 증가
- 엔터프라이즈 로고 뱃지 → B2B 파트너 가시성
- 취준생 포트폴리오 신뢰 시그널

---

## 2. 뱃지 목록 (총 10종 + 엔터프라이즈)

### 2-1. 신규 뱃지

| 뱃지명 | 카테고리 | 달성 조건 | 부여 방식 |
|--------|---------|----------|----------|
| 뉴비 | 신규 | 회원가입 | 자동 |
| 소통장인 | 커뮤니티 | 게시글 10개 + 좋아요 100개 + 댓글 50개 (모두 충족) | 자동 |
| 명답자 | 아고라 | 아고라 답변 채택 10개 | 자동 |
| 호기심천국 | 아고라 | 아고라 질문 10개 | 자동 |
| 태스크 헌터 | PM툴 | 태스크 완료(DONE) 100개 | 자동 |
| 캡틴 | PM툴 | ADMIN으로 프로젝트 3개 운영 + 각 프로젝트 팀원 3명 이상 | 자동 |
| 팀플레이어 | PM툴 | 프로젝트 참여 5개 | 자동 |
| 개근상 | 스트릭 | 30일 연속 출석 | 자동 |
| PRO구독 | 구독 | PRO 플랜 구독 중 | 자동 (구독 시 부여, 해지 시 회수) |
| PREMIUM구독 | 구독 | PREMIUM 플랜 구독 중 | 자동 (구독 시 부여, 해지 시 회수) |

### 2-2. 엔터프라이즈 뱃지

| 항목 | 내용 |
|------|------|
| 뱃지 형태 | B2B 파트너 로고 이미지 |
| 로고 등록 | 엔터프라이즈 관리자가 마이페이지에서 업로드 |
| 관리자 지정 | 사이트 관리자(ADMIN)가 관리자 콘솔에서 등록 |
| 복수 소속 | 허용 (대표 뱃지 1개만 표시) |
| 소속 유저 부여 | 엔터프라이즈 관리자가 멤버 관리 |

---

## 3. 표시 규칙

### 3-1. 대표 뱃지

- 유저가 보유한 뱃지 중 **1개를 대표 뱃지로 선택**
- 기본값: 가장 최근 획득한 뱃지
- 설정 위치: 마이페이지 > 프로필 설정

### 3-2. 표시 방식

```
[뱃지 아이콘] 닉네임
```

- 닉네임 왼쪽에 아이콘 1개 표시
- hover 시 툴팁: 뱃지 이름 + 간단 설명

### 3-3. 표시 위치 (닉네임이 나오는 모든 곳)

| 위치 | 현재 | 변경 후 |
|------|------|--------|
| 커뮤니티 게시글 목록 | 닉네임만 | [뱃지] 닉네임 |
| 커뮤니티 댓글 | 닉네임 | [뱃지] 닉네임 |
| 아고라 질문/답변 | 닉네임 | [뱃지] 닉네임 |
| 미니프로필 팝업 | 닉네임 + Lv.X | [뱃지] 닉네임 Lv.X |
| 마이페이지 | 닉네임 + 뱃지 컬렉션 | [대표뱃지] 닉네임 + 뱃지 컬렉션 |
| 포트폴리오 | 닉네임 + Lv.X | [뱃지] 닉네임 Lv.X |
| 워크스페이스 멤버 목록 | 닉네임 | [뱃지] 닉네임 |

---

## 4. 아이콘 디자인

### 4-1. 디자인 원칙

- **Minimal flat icon** 스타일 (닉네임 옆 작은 사이즈에서도 인식 가능)
- 카테고리별 **색상 체계**로 구분
- 배경 투명, 단일 오브젝트 중심

### 4-2. 카테고리별 컬러 스킴

| 카테고리 | 메인 컬러 | 비고 |
|---------|----------|------|
| 신규 (뉴비) | 그린 (#22C55E) | 새싹 느낌 |
| 커뮤니티 (소통장인) | 블루 (#3B82F6) | 소통/연결 |
| 아고라 (명답자, 호기심천국) | 퍼플 (#8B5CF6) | 지혜/질문 |
| PM툴 (태스크헌터, 캡틴, 팀플레이어) | 오렌지 (#F97316) | 실행/리더십 |
| 스트릭 (개근상) | 레드 (#EF4444) | 열정/불꽃 |
| 구독 (PRO, PREMIUM) | 골드 (#EAB308) | 프리미엄 |
| 엔터프라이즈 | 커스텀 (로고 색상) | 파트너 브랜드 |

### 4-3. 사이즈 스펙

| 항목 | 사이즈 | 비고 |
|------|--------|------|
| **표시 사이즈 (sm)** | 16px (w-4 h-4) | 댓글, 게시글 목록 등 인라인 |
| **표시 사이즈 (md)** | 20px (w-5 h-5) | 미니프로필, 프로필 영역 |
| **원본 에셋** | 128 x 128 px | 8배 스케일 (Retina 대응) |
| **Gemini 생성 사이즈** | 512 x 512 px | 1:1 비율, 생성 후 128px로 리사이즈 |
| **포맷** | PNG (배경 투명) | AI 생성 → PNG, 추후 SVG 트레이싱 검토 |

### 4-4. 제작 워크플로우 (Gemini MCP 활용)

```
1단계: generate_illustration (무료, Nano Banana 2)
  └ 카테고리별 컨셉 4개씩 탐색
  └ style: "vector", aspectRatio: "1:1"
  └ 프롬프트: "simple flat icon, minimal badge design, [뱃지 설명], solid color, no background, centered"

2단계: 방향 확정 후 generate_logo (유료, Nano Banana Pro)
  └ style: "minimal", colorScheme: [카테고리 컬러]
  └ 최종 에셋 제작

3단계: edit_image (무료, Nano Banana 2)
  └ 미세 조정 (색상 보정, 요소 추가/제거)

4단계: 후처리
  └ 배경 제거 → 투명 PNG
  └ 512px → 128px 리사이즈
  └ 16px/20px에서 육안 검증

5단계: 배포
  └ Cloudflare R2 업로드 (flowit-documents 버킷)
  └ URL 패턴: {R2_PUBLIC_URL}/badges/{badge_key}.png
  └ 프로젝트 내부 public/ 미사용 (아이콘 교체 시 재배포 불필요)
```

---

## 5. 기존 시스템 마이그레이션

### 5-1. 기존 뱃지 처리

| 기존 뱃지 (BadgeType) | 처리 | 비고 |
|----------------------|------|------|
| NEW_MEMBER | → **뉴비**로 이름 변경 | 유지 |
| ACTIVITY | 삭제 | 레벨 시스템으로 대체 |
| SUBSCRIBER | 삭제 | PRO구독/PREMIUM구독으로 대체 |
| LOYALTY | 삭제 | 불필요 |
| ORGANIZATION | → 엔터프라이즈 뱃지로 전환 | 구조 변경 |
| STREAK_7 | → **개근상** (30일)로 상향 | 기존 데이터 초기화 |

### 5-2. DB 스키마 변경안

```prisma
// 기존 BadgeType enum 대체
enum BadgeType {
  // 업적 뱃지
  NEWBIE              // 뉴비 (회원가입)
  COMMUNICATOR        // 소통장인 (커뮤니티)
  BEST_ANSWERER       // 명답자 (아고라 채택)
  CURIOUS             // 호기심천국 (아고라 질문)
  TASK_HUNTER         // 태스크 헌터 (태스크 완료)
  CAPTAIN             // 캡틴 (프로젝트 리더)
  TEAM_PLAYER         // 팀플레이어 (프로젝트 참여)
  ATTENDANCE_30       // 개근상 (30일 연속 출석)
  // 구독 뱃지
  PRO_SUBSCRIBER      // PRO 구독
  PREMIUM_SUBSCRIBER  // PREMIUM 구독
}

model UserBadge {
  id       String    @id @default(uuid())
  userId   String
  badge    BadgeType
  earnedAt DateTime  @default(now())
  user     User      @relation(fields: [userId], references: [id])
  @@unique([userId, badge])
  @@map("user_badges")
}

// 엔터프라이즈 뱃지 (별도 모델)
model Enterprise {
  id          String   @id @default(uuid())
  name        String
  logoUrl     String                    // 로고 이미지 URL (R2)
  adminUserId String                    // 엔터프라이즈 관리자
  createdAt   DateTime @default(now())
  members     EnterpriseMembers[]
  @@map("enterprises")
}

model EnterpriseMember {
  id           String     @id @default(uuid())
  enterpriseId String
  userId       String
  joinedAt     DateTime   @default(now())
  enterprise   Enterprise @relation(fields: [enterpriseId], references: [id])
  user         User       @relation(fields: [userId], references: [id])
  @@unique([enterpriseId, userId])
  @@map("enterprise_members")
}

// User 모델 확장
model User {
  // ... 기존 필드
  displayBadgeType    BadgeType?       // 대표 업적 뱃지 (null이면 뉴비 또는 최근 획득)
  displayEnterpriseId String?          // 대표 엔터프라이즈 뱃지 (null이면 업적 뱃지 표시)
}
```

### 5-3. 뱃지 표시 우선순위

```
displayEnterpriseId가 설정됨 → 엔터프라이즈 로고 표시
displayBadgeType이 설정됨 → 해당 업적 뱃지 표시
둘 다 null → 가장 최근 획득 뱃지 표시 (없으면 뉴비)
```

---

## 6. API 변경안

### 6-1. 유저 정보 응답에 뱃지 정보 추가

```typescript
interface UserBadgeInfo {
  displayBadge: {
    type: 'achievement' | 'enterprise';
    key: string;           // BadgeType enum 값 또는 enterprise ID
    label: string;         // '소통장인', '명답자', 기업명 등
    icon: string;          // 아이콘 URL
    description: string;   // 뱃지 설명 (툴팁용)
    color: string;         // 카테고리 컬러
  };
}
```

### 6-2. 영향받는 API

기존 유저 정보를 반환하는 모든 API에 `badgeInfo` 필드 추가:

- `GET /posts` (게시글 목록 — 작성자)
- `GET /posts/:id` (게시글 상세 — 작성자 + 댓글 작성자)
- `GET /agora` (아고라 목록)
- `GET /agora/:id` (아고라 상세 + 답변 작성자)
- `GET /users/by-nickname/:nickname/mini` (미니프로필)
- `GET /portfolio/:nickname` (포트폴리오)
- `GET /users/me` (마이페이지)
- `GET /workspaces/:id/members` (워크스페이스 멤버)

### 6-3. 신규 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/users/me/badges` | 내 뱃지 목록 (보유 + 미보유) |
| PATCH | `/users/me/display-badge` | 대표 뱃지 변경 |
| POST | `/admin/enterprises` | 엔터프라이즈 생성 (관리자) |
| PATCH | `/admin/enterprises/:id` | 엔터프라이즈 수정 |
| POST | `/enterprises/:id/members` | 엔터프라이즈 멤버 추가 |
| DELETE | `/enterprises/:id/members/:userId` | 엔터프라이즈 멤버 제거 |
| PATCH | `/enterprises/:id/logo` | 로고 업로드 (엔터프라이즈 관리자) |

---

## 7. FE 공통 컴포넌트

### 7-1. UserBadge.vue (신규)

닉네임 옆에 표시되는 뱃지 아이콘 컴포넌트.

```
Props:
  badge: UserBadgeInfo    // API 응답의 badgeInfo
  size: 'sm' | 'md'      // sm: 16px, md: 20px (기본: sm)

렌더링:
  <img :src="badge.icon" :alt="badge.label" class="w-4 h-4" />
  hover 시 → 툴팁 (뱃지명 + 설명)
```

### 7-2. 적용 패턴

```vue
<!-- 닉네임 표시하는 모든 곳 -->
<UserBadge :badge="author.badgeInfo" size="sm" />
<span>{{ author.nickname }}</span>
```

---

## 8. 구현 우선순위

### Phase 1: 기반 (업적 뱃지 + 공통 컴포넌트)
1. DB 스키마 마이그레이션 (BadgeType enum 변경)
2. 뱃지 자동 부여 로직 (각 서비스에 트리거 추가)
3. `UserBadge.vue` 공통 컴포넌트 생성
4. API 응답에 `badgeInfo` 추가
5. 닉네임 나오는 모든 곳에 `UserBadge` 적용
6. 대표 뱃지 선택 UI (마이페이지)

### Phase 2: 아이콘 디자인
1. Gemini MCP로 컨셉 탐색
2. 최종 아이콘 에셋 제작 (10종)
3. 아이콘 에셋 적용

### Phase 3: 엔터프라이즈 뱃지
1. Enterprise/EnterpriseMember 모델 추가
2. 관리자 콘솔 엔터프라이즈 관리
3. 엔터프라이즈 관리자 로고 업로드
4. 엔터프라이즈 멤버 뱃지 표시

---

## 9. 미결정 사항

- [ ] 뱃지 미보유 시 빈 상태 표시 여부 (아이콘 없이 닉네임만? 또는 기본 아이콘?)
- [ ] 뱃지 획득 시 축하 애니메이션/토스트 여부
- [ ] 마이페이지 뱃지 컬렉션 UI 상세 디자인
- [ ] 엔터프라이즈 로고 업로드 사이즈/포맷 제한
- [ ] 구독 뱃지 해지 후 유예 기간 여부

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-04-15 | 최초 작성 — 뱃지 리디자인 전체 기획 |
