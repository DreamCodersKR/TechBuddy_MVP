/**
 * FLOWIT 데모 데이터 시드 스크립트
 * 실행: npx ts-node --transpile-only scripts/seed-demo.ts
 */
import { PrismaClient } from '@prisma/client'

const BASE_URL = 'http://localhost:8080'
const prisma = new PrismaClient()

// ─── 보드 ID ────────────────────────────────────────────
const BOARDS = {
  FREE:    '1c227c23-784d-47a1-b44d-e78ff2da67a0', // 자유게시판
  RECRUIT: '8624cefd-cc6c-4390-a3c9-588d90fd2518', // 프로젝트 구인
  CAREER:  '7f478f2b-b559-489f-b404-fcaddc818d86', // 취업/진로
  ARTICLE: '3e0a80f9-e502-43a9-b5ad-85e6c4302e60', // 아티클
}

// ─── 유틸 ────────────────────────────────────────────────
async function api<T>(method: string, path: string, body?: any, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(err)}`)
  }
  return res.json()
}

async function login(email: string, pw: string) {
  const r = await api<{ accessToken: string; user: { id: string } }>('POST', '/auth/login', { email, password: pw })
  return { token: r.accessToken, id: r.user.id }
}

async function signup(data: { email: string; password: string; name: string; nickname: string; techStack: string[] }) {
  try {
    await api('POST', '/auth/signup', data)
    console.log(`  ✅ 회원가입: ${data.nickname}`)
  } catch {
    console.log(`  ⏭  이미 존재: ${data.nickname}`)
  }
  return login(data.email, data.password)
}

// ─── 메인 ────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 FLOWIT 데모 데이터 시드 시작\n')

  // ── 1. 유저 생성 ──────────────────────────────────────
  console.log('👤 유저 생성...')
  const u91 = await login('test91@test.com', 'test1234')
  const u92 = await login('test92@test.com', 'test1234')

  const junho  = await signup({ email: 'ljunho@flowit.dev',  password: 'test1234', name: '이준호', nickname: '준호',  techStack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'] })
  const sujin  = await signup({ email: 'sjpark@flowit.dev',  password: 'test1234', name: '박수진', nickname: '수진',  techStack: ['React', 'Next.js', 'Tailwind CSS'] })
  const ymin   = await signup({ email: 'ymchoi@flowit.dev',  password: 'test1234', name: '최영민', nickname: '영민',  techStack: ['NestJS', 'PostgreSQL', 'Docker', 'TypeScript'] })
  const daeun  = await signup({ email: 'daeun@flowit.dev',   password: 'test1234', name: '김다은', nickname: '다은',  techStack: ['Figma', 'Zeplin', 'Adobe XD'] })
  const minseo = await signup({ email: 'minseo@flowit.dev',  password: 'test1234', name: '장민서', nickname: '민서',  techStack: ['JavaScript', 'React', 'Express', 'MySQL'] })

  // ── 2. 크레딧 지급 (Prisma 직접 업데이트) ─────────────
  console.log('\n💎 크레딧 지급...')
  const creditMap: Record<string, number> = {
    [u91.id]:      500,
    [u92.id]:      300,
    [junho.id]:    800,
    [sujin.id]:    600,
    [ymin.id]:     1000,
    [daeun.id]:    400,
    [minseo.id]:   300,
  }
  for (const [userId, credit] of Object.entries(creditMap)) {
    await prisma.user.update({ where: { id: userId }, data: { credit } })
  }
  console.log('  ✅ 크레딧 지급 완료')

  // ── 3. 커뮤니티 게시글 ───────────────────────────────
  console.log('\n📝 커뮤니티 게시글 작성...')

  const posts: { id: string }[] = []

  // 취업/진로
  posts.push(await api('POST', '/posts', {
    boardId: BOARDS.CAREER,
    title: '제로베이스 프론트엔드 스쿨 6개월 후기 - 솔직하게 씁니다',
    content: `안녕하세요! 제로베이스 프론트엔드 스쿨을 수료하고 취업에 성공한 이준호입니다.

많은 분들이 부트캠프 수강 전에 "진짜 도움이 되냐?"고 물어보시는데, 제 경험을 솔직하게 공유하려고 합니다.

## 수강 전 상황
- 비전공자 (경영학과 졸업)
- HTML/CSS 독학 3개월
- JavaScript 거의 모름

## 6개월 커리큘럼 요약
1. HTML/CSS → JavaScript 기초
2. React 실전 프로젝트 (3개)
3. TypeScript, 상태관리 (Redux, Recoil)
4. 팀 프로젝트 (2개월)

## 좋았던 점
- 실무 프로젝트 위주 커리큘럼
- 취업 연계 프로그램 (이력서/포트폴리오 피드백)
- 같이 공부하는 동기들의 존재가 정말 큰 힘

## 아쉬웠던 점
- CS 기초(알고리즘, 자료구조)는 따로 공부해야 함
- 취업 후 회사에서 쓰는 기술 스택이 다를 수 있음

결론: 혼자 독학이 힘드신 분들께는 강력 추천드립니다. 다만 본인의 노력이 없으면 수료 후에도 취업이 어렵습니다.

궁금한 점 댓글로 남겨주세요! 😊`,
    isPublished: true,
  }, junho.token))
  console.log('  ✅ 부트캠프 후기')

  posts.push(await api('POST', '/posts', {
    boardId: BOARDS.CAREER,
    title: '카카오 신입 개발자 코테 + 면접 후기 (합격 후기)',
    content: `드디어 카카오 합격했습니다! 준비 과정 공유드려요.

## 코딩 테스트
- 총 5문제 (2시간)
- 난이도: 중~상
- 주요 유형: DFS/BFS, DP, 구현
- 백준 기준 골드 이상 실력이면 충분히 풀 수 있는 수준

**TIP**: 프로그래머스 카카오 기출 전부 풀어보세요. 유형이 거의 비슷합니다.

## 1차 면접 (기술 면접)
면접관 3명, 1시간 30분

주요 질문 목록:
1. React에서 가상DOM이 성능에 유리한 이유를 설명해주세요
2. 클로저(Closure)란 무엇인지 예시와 함께 설명해주세요
3. RESTful API 설계 원칙에 대해 설명해주세요
4. 본인이 작성한 코드에서 리팩토링한다면 어떤 부분을 개선하겠습니까?
5. 이 프로젝트에서 가장 어려웠던 기술적 도전은 무엇인가요?

## 2차 면접 (컬처핏)
팀장, HR 각 1명, 30분

- 직무 관련 자기소개
- 팀워크 경험
- 카카오 서비스 중 개선하고 싶은 점

## 결과
합격! 초봉 협상 팁: 받은 오퍼에서 10~15% 더 요청하면 대부분 들어줍니다 ㅎㅎ

질문 있으시면 편하게 댓글 달아주세요!`,
    isPublished: true,
  }, sujin.token))
  console.log('  ✅ 카카오 면접 후기')

  posts.push(await api('POST', '/posts', {
    boardId: BOARDS.CAREER,
    title: '포트폴리오 깃허브 정리법 - 채용담당자가 실제로 보는 것들',
    content: `안녕하세요, 최영민입니다. 스타트업에서 개발자 채용 사이드로 참여한 경험이 있어서 채용담당자 관점에서 GitHub 포트폴리오 정리법을 공유드립니다.

## 채용담당자가 GitHub에서 먼저 보는 것

### 1. README.md 퀄리티
첫 인상이 가장 중요합니다. README에는 반드시:
- **기술 스택** (배지 형태로 보기 좋게)
- **프로젝트 구동 방법** (로컬 설치 방법)
- **핵심 기능 설명** (스크린샷 포함)
- **아키텍처 다이어그램** (있으면 큰 플러스)

### 2. 커밋 히스토리
- 의미 있는 커밋 메시지 (feat, fix, refactor 등 prefix 사용)
- 꾸준한 커밋 기록 (잔디가 중요한 게 아니라 패턴이 중요)
- WIP, asdf, 수정 이런 커밋은 절대 금지

### 3. 코드 품질
- 일관된 네이밍 컨벤션
- 적절한 폴더 구조
- 주석보다는 코드 자체가 설명이 되도록

## 자주 하는 실수들

❌ "테스트 프로젝트", "클론 코딩" 이름 그대로 올리기
❌ 환경변수(.env) 파일 올리기 (보안 사고 발생 가능)
❌ README 없이 올리기
❌ 빌드도 안 되는 코드 올리기

## 강력 추천 프로젝트 주제

취업용으로 효과적인 주제:
1. **실생활 문제 해결** - 직접 겪은 불편함을 기술로 해결
2. **규모가 작더라도 완성도** - 기능 10개보다 기능 3개를 제대로
3. **배포까지 완료** - Vercel, Railway, AWS 등 실제 운영되는 것

궁금한 점은 댓글로!`,
    isPublished: true,
  }, ymin.token))
  console.log('  ✅ 포트폴리오 정리법')

  posts.push(await api('POST', '/posts', {
    boardId: BOARDS.CAREER,
    title: '2026 상반기 IT 취업 시장 분석 - 스타트업 vs 대기업, 어디가 나을까?',
    content: `올해 상반기 취업 준비하면서 정리한 IT 취업 시장 분석입니다.

## 현재 취업 시장 상황

최근 IT 채용 시장이 많이 변했습니다. 팬데믹 이후 급격한 채용 확대가 있었다가, 현재는 다시 안정화 국면입니다.

## 대기업 IT 계열사

**장점:**
- 안정적인 연봉 및 복지
- 체계적인 온보딩/교육 프로그램
- 브랜드 네임 (이직 시 유리)

**단점:**
- 신입 채용 TO가 줄어듦
- 기술 스택이 레거시한 경우 많음
- 빠른 성장보다 안정

**준비 방법:** 코딩 테스트 + 기술 면접 위주, 알고리즘 필수

## 스타트업 (시리즈 A~C)

**장점:**
- 다양한 업무 경험 (빠른 성장)
- 최신 기술 스택 사용
- 입사 장벽이 상대적으로 낮음
- 주니어도 중요한 역할 맡을 수 있음

**단점:**
- 불안정한 고용
- 복지 차이
- 사람에 따라 번아웃 위험

**준비 방법:** 포트폴리오 > 알고리즘, 프로덕트 이해도 중요

## 추천 전략

신입이라면 **스타트업 → 2~3년 후 대기업** 루트를 추천드립니다.
1. 스타트업에서 다양한 경험 쌓기
2. 포트폴리오 강화
3. 이직 시 연봉 점프 가능

어떻게 생각하시나요? 각자 생각 댓글로 남겨주세요!`,
    isPublished: true,
  }, minseo.token))
  console.log('  ✅ 취업 시장 분석')

  // 자유게시판
  posts.push(await api('POST', '/posts', {
    boardId: BOARDS.FREE,
    title: '회사 첫 출근 했는데 레거시 코드 폭탄이었습니다 ㅋㅋ',
    content: `드디어 개발자로 첫 출근을 했는데...

입사 첫날 온보딩이 끝나고 바로 코드베이스 파악을 시작했습니다.

**상황 요약:**
- jQuery로 만든 6년 된 프론트엔드
- 변수명이 죄다 a, b, temp, temp2...
- 주석은 한 줄도 없음
- 테스트 코드? 그게 뭔가요?
- git blame 했더니 퇴사한 개발자 이름이...

그래도 긍정적으로 생각하기로 했어요.
레거시 코드를 이해하고 리팩토링하는 것도 중요한 스킬이니까요!

혹시 비슷한 경험 있으신 분들 어떻게 극복하셨는지 공유해주세요 😭`,
    isPublished: true,
  }, junho.token))
  console.log('  ✅ 자유게시판 - 레거시 코드')

  posts.push(await api('POST', '/posts', {
    boardId: BOARDS.FREE,
    title: '개발자 커피챗 처음 해봤는데 이렇게 도움이 될 줄이야',
    content: `취업 준비 중에 처음으로 현업 개발자분께 커피챗 요청을 드렸는데 생각보다 훨씬 좋았어요!

**커피챗 요청 방법:**
1. LinkedIn, 오픈카톡, FLOWIT 커뮤니티 등 활용
2. 짧고 명확한 메시지로 요청 (3~4줄)
3. 구체적인 질문 미리 준비

**실제로 물어본 것들:**
- 현재 팀에서 사용하는 기술 스택
- 신입 채용 시 가장 중요하게 보는 것
- 포트폴리오 피드백
- 주니어로서 성장하는 방법

**배운 것들:**
- "코딩 테스트보다 협업 능력이 더 중요하다"
- 포트폴리오는 '왜' 이 기술을 선택했는지 설명이 있어야 한다
- 팀 프로젝트 경험이 없으면 만들어서라도 해라

용기 내서 커피챗 해보세요! 대부분의 개발자분들이 친절하게 응해주십니다 😊`,
    isPublished: true,
  }, sujin.token))
  console.log('  ✅ 자유게시판 - 커피챗')

  // 아티클
  posts.push(await api('POST', '/posts', {
    boardId: BOARDS.ARTICLE,
    title: 'React 상태관리 2026 - Zustand가 대세인 이유와 실무 패턴',
    content: `2026년 현재 React 상태관리 생태계를 정리해봤습니다.

## 현재 상태관리 트렌드

Redux Toolkit이 오랫동안 업계 표준이었지만, 최근 2-3년 사이 **Zustand**가 빠르게 시장을 장악하고 있습니다.

## 왜 Zustand인가?

### 1. 보일러플레이트가 거의 없음

\`\`\`typescript
// Redux: actions, reducers, selectors, dispatch...
// Zustand: 이게 전부입니다
import { create } from 'zustand'

interface AuthState {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
\`\`\`

### 2. TypeScript 지원이 최고
타입 추론이 완벽하게 됩니다.

### 3. 번들 크기
- Redux Toolkit: ~11KB
- Zustand: ~1KB

## 언제 뭘 써야 하나?

| 상황 | 추천 |
|------|------|
| 간단한 전역 상태 | Zustand |
| 복잡한 상태 로직 | Zustand + immer |
| 서버 상태 | TanStack Query |
| 폼 상태 | React Hook Form |
| 대규모 팀/레거시 | Redux Toolkit |

## 실무 팁

Zustand + TanStack Query 조합이 현재 가장 많이 쓰이는 패턴입니다. 서버 상태는 TanStack Query가 훨씬 잘 처리하기 때문에 Zustand는 순수 클라이언트 상태만 다루게 분리하는 게 좋습니다.

궁금한 점 댓글로!`,
    isPublished: true,
  }, junho.token))
  console.log('  ✅ 아티클 - React 상태관리')

  posts.push(await api('POST', '/posts', {
    boardId: BOARDS.ARTICLE,
    title: 'NestJS + Prisma 조합으로 REST API 5분 만에 만들기',
    content: `실무에서 NestJS + Prisma 조합을 써보니 생산성이 엄청납니다. 세팅부터 CRUD API 완성까지 정리했어요.

## 왜 NestJS + Prisma인가?

- **NestJS**: 구조적인 아키텍처, TypeScript 네이티브
- **Prisma**: 타입 안전한 ORM, 마이그레이션 관리

## 빠른 세팅 가이드

### 1. 프로젝트 생성
\`\`\`bash
nest new my-api
cd my-api
npm install @prisma/client prisma
npx prisma init
\`\`\`

### 2. 스키마 작성
\`\`\`prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String   @db.Text
  createdAt DateTime @default(now())
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}
\`\`\`

### 3. 마이그레이션
\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

### 4. Service에서 사용
\`\`\`typescript
@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    })
  }
}
\`\`\`

이렇게만 해도 타입 안전한 CRUD API가 완성됩니다!

## 팁

- \`prisma.$transaction()\` 적극 활용 (데이터 정합성)
- \`select\`와 \`include\`를 잘 분리해서 N+1 문제 방지
- \`.env\` 파일 절대 git에 올리지 마세요

더 궁금한 것 있으면 댓글로!`,
    isPublished: true,
  }, ymin.token))
  console.log('  ✅ 아티클 - NestJS + Prisma')

  // ── 4. 댓글 달기 ─────────────────────────────────────
  console.log('\n💬 댓글 작성...')

  const postId0 = posts[0].id // 부트캠프 후기
  await api('POST', '/comments', { postId: postId0, content: '저도 제로베이스 수강 중인데 많은 도움이 됐어요! CS는 따로 공부해야 한다는 말이 특히 공감됩니다.' }, sujin.token)
  await api('POST', '/comments', { postId: postId0, content: '비전공자 출신이라 더 와닿네요. 팀 프로젝트 퀄리티가 중요하더라고요. 좋은 글 감사합니다!' }, minseo.token)
  await api('POST', '/comments', { postId: postId0, content: '커리큘럼이 계속 업데이트되던데, 최근에는 어떤 부분이 가장 달라졌나요?' }, daeun.token)

  const postId1 = posts[1].id // 카카오 면접
  await api('POST', '/comments', { postId: postId1, content: '오 축하드려요!! 기술면접 준비는 얼마나 하셨나요?' }, junho.token)
  await api('POST', '/comments', { postId: postId1, content: '연봉 협상 팁이 너무 좋네요 ㅎㅎ 저도 다음주 면접인데 참고할게요!' }, minseo.token)
  await api('POST', '/comments', { postId: postId1, content: 'CS 기초는 주로 어떻게 준비하셨나요? 책인지 유튜브인지 궁금합니다.' }, ymin.token)

  const postId2 = posts[2].id // 포트폴리오
  await api('POST', '/comments', { postId: postId2, content: '아키텍처 다이어그램까지 넣으면 진짜 레벨업이죠. 그림 그리는 툴 추천해주실 수 있나요?' }, sujin.token)
  await api('POST', '/comments', { postId: postId2, content: 'README 퀄리티가 첫인상이라는 말 너무 맞아요. 저도 이 부분 더 신경 써야겠네요.' }, minseo.token)

  const postId4 = posts[4].id // 레거시 코드
  await api('POST', '/comments', { postId: postId4, content: 'ㅋㅋㅋ 공감 100%입니다... 저도 첫 회사에서 jQuery + PHP 스파게티 코드 봤을 때 멘탈 나갔어요.' }, ymin.token)
  await api('POST', '/comments', { postId: postId4, content: '이런 경험이 나중에 다 실력이 됩니다! 레거시 코드 분석하면서 설계에 대한 이해가 엄청 늘었어요.' }, junho.token)

  console.log('  ✅ 댓글 작성 완료')

  // ── 5. 좋아요 ────────────────────────────────────────
  console.log('\n❤️  좋아요...')
  const likeTargets = [
    { postId: posts[0].id, tokens: [sujin.token, ymin.token, minseo.token, daeun.token] },
    { postId: posts[1].id, tokens: [junho.token, ymin.token, minseo.token, daeun.token, u91.token, u92.token] },
    { postId: posts[2].id, tokens: [sujin.token, junho.token, minseo.token, daeun.token, u91.token] },
    { postId: posts[3].id, tokens: [junho.token, ymin.token, daeun.token] },
    { postId: posts[6].id, tokens: [sujin.token, ymin.token, minseo.token, daeun.token] },
    { postId: posts[7].id, tokens: [sujin.token, junho.token, minseo.token, u91.token] },
  ]
  for (const { postId, tokens } of likeTargets) {
    for (const token of tokens) {
      await api('POST', `/likes/post/${postId}`, {}, token).catch(() => {})
    }
  }
  console.log('  ✅ 좋아요 완료')

  // ── 6. 아고라 질문 ───────────────────────────────────
  console.log('\n💎 아고라 질문 작성...')

  // Q1: Open
  const q1 = await api<{ id: string }>('POST', '/agora', {
    title: 'React useEffect 의존성 배열에 뭘 넣어야 하는지 정확히 모르겠어요',
    content: `React를 공부하면서 useEffect 사용법이 헷갈립니다.

\`\`\`jsx
useEffect(() => {
  fetchData(userId)
}, [userId]) // userId만 넣는게 맞나요?
\`\`\`

eslint-plugin-react-hooks를 쓰면 계속 의존성 배열에 뭔가를 추가하라고 경고가 나오는데, 무조건 추가하면 무한루프가 생기고...

구체적으로:
1. 함수는 의존성 배열에 넣어야 하나요?
2. useCallback으로 감싸면 해결되나요?
3. 빈 배열 []을 쓰면 안티패턴인가요?

실무에서 어떻게 처리하시는지 알고 싶어요!`,
    bounty: 30,
  }, minseo.token)
  console.log('  ✅ Q1 (useEffect)')

  // Q2: Closed (답변 채택됨)
  const q2 = await api<{ id: string }>('POST', '/agora', {
    title: 'NestJS에서 RefreshToken 재발급 구현 어떻게 하시나요?',
    content: `NestJS로 JWT 인증을 구현 중인데, AccessToken 만료 시 RefreshToken으로 갱신하는 로직이 헷갈립니다.

현재 상황:
- AccessToken 만료 시간: 1시간
- RefreshToken: 7일

궁금한 점:
1. RefreshToken을 DB에 저장하는 게 맞나요? Redis를 써야 하나요?
2. Token Rotation은 어떻게 구현하나요?
3. Refresh 요청은 별도 엔드포인트로 분리해야 하나요?

실무 패턴을 알고 싶습니다!`,
    bounty: 50,
  }, sujin.token)

  // Q2 답변 by 영민
  const a2 = await api<{ id: string }>('POST', `/agora/${q2.id}/answers`, {
    content: `NestJS JWT 구현 실무 패턴 공유드립니다!

## 1. RefreshToken 저장 위치

**소규모 서비스**: PostgreSQL/MySQL 같은 RDB에 저장해도 충분합니다.
**대규모 서비스**: Redis 추천 (만료 TTL 자동 관리, 빠른 조회)

RDB를 쓴다면 이런 구조:
\`\`\`prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  familyId  String   // Token Rotation용
}
\`\`\`

## 2. Token Rotation

보안을 위해 강력히 추천합니다!

구현 방법:
1. RefreshToken으로 갱신 요청 시 → 기존 토큰 폐기 + 새 토큰 발급
2. 폐기된 토큰이 다시 사용되면 → familyId로 해당 계정 전체 세션 무효화 (탈취 감지)

\`\`\`typescript
async refreshTokens(oldRefreshToken: string) {
  const tokenRecord = await this.findToken(oldRefreshToken)

  if (!tokenRecord || tokenRecord.isRevoked) {
    // 탈취된 토큰! 해당 familyId 전체 폐기
    await this.revokeFamily(tokenRecord.familyId)
    throw new UnauthorizedException('토큰이 탈취되었을 수 있습니다')
  }

  // 기존 폐기 + 새 토큰 발급
  await this.revokeToken(oldRefreshToken)
  return this.issueTokens(tokenRecord.userId, tokenRecord.familyId)
}
\`\`\`

## 3. 엔드포인트 구조

\`\`\`
POST /auth/refresh  → AccessToken + 새 RefreshToken 발급
POST /auth/logout   → RefreshToken 폐기
\`\`\`

RefreshToken은 HttpOnly Cookie로 관리하면 XSS 공격에서 안전합니다!

도움이 됐으면 좋겠네요 :)`,
  }, ymin.token)

  await api('POST', `/agora/${q2.id}/answers/${a2.id}/accept`, {}, sujin.token)
  console.log('  ✅ Q2 (NestJS JWT) - 채택 완료')

  // Q3: Open
  const q3 = await api<{ id: string }>('POST', '/agora', {
    title: '부트캠프 수료 후 포트폴리오 프로젝트 주제 뭐가 좋을까요?',
    content: `부트캠프 수료하고 취업 준비 중입니다.

포트폴리오 프로젝트를 만들려고 하는데 주제 선정이 너무 어렵네요.

현재 기술 스택:
- Frontend: React, TypeScript
- Backend: Express, MySQL

고려 중인 주제들:
1. 영화 리뷰 사이트 (TMDB API 활용)
2. 할일 관리 앱 (투두리스트)
3. 쇼핑몰 (결제 연동까지)

면접관들이 "또 이거야?" 할 것 같은 프로젝트들인지 걱정됩니다.
현업 개발자 분들이 인상 깊게 봤던 포트폴리오 주제가 궁금합니다!`,
    bounty: 20,
  }, minseo.token)

  // Q3에 답변만 달기 (채택 안 함)
  await api('POST', `/agora/${q3.id}/answers`, {
    content: `포트폴리오 프로젝트 주제 선택 팁 드릴게요!

결론부터: 주제보다 **구현 깊이와 문제 해결 과정**이 훨씬 중요합니다.

## 추천 전략

### 1. 본인이 실제 쓸 서비스 만들기
직접 쓰면서 개선하다 보면 자연스럽게 깊이가 생깁니다.

### 2. 기술적 도전이 있는 기능 포함하기
- 실시간 기능 (WebSocket)
- 결제 연동 (토스페이먼츠, 아임포트)
- 이미지 업로드 + 최적화 (S3)
- 검색 기능 (Elasticsearch 또는 Full-text search)

### 3. 클론 코딩도 괜찮습니다
단, 핵심 기능을 직접 구현하고 "왜 이렇게 만들었는가"를 설명할 수 있어야 해요.

포트폴리오에서 가장 중요한 건 README의 **"이 프로젝트에서 해결한 기술적 문제"** 섹션입니다!`,
  }, junho.token)
  console.log('  ✅ Q3 (포트폴리오 주제)')

  // Q4: Closed (채택됨)
  const q4 = await api<{ id: string }>('POST', '/agora', {
    title: 'TypeScript 제네릭 실무에서 어떻게 활용하시나요?',
    content: `TypeScript를 공부하면서 제네릭(Generic) 개념은 이해했는데, 실무에서 어떻게 활용해야 할지 모르겠습니다.

아는 것:
- Array<T>, Promise<T> 같은 기본적인 사용법
- 간단한 제네릭 함수 작성

모르는 것:
- 실제 프로젝트에서 어느 상황에 제네릭을 쓰면 좋은지
- Conditional Types, infer 같은 고급 기능 언제 쓰는지
- 너무 복잡한 타입 체조(?)는 언제 피해야 하는지

실무 예시 위주로 설명해주시면 감사하겠습니다!`,
    bounty: 100,
  }, sujin.token)

  const a4 = await api<{ id: string }>('POST', `/agora/${q4.id}/answers`, {
    content: `제네릭 실무 활용법 정리해드릴게요! 가장 자주 쓰이는 패턴 위주로.

## 1. API 응답 타입 통일

가장 많이 쓰는 패턴:
\`\`\`typescript
interface ApiResponse<T> {
  data: T
  meta: { total: number; page: number }
  success: boolean
}

// 사용
async function fetchPosts(): Promise<ApiResponse<Post[]>> {
  return fetch('/api/posts').then(r => r.json())
}
\`\`\`

## 2. 폼 상태 관리

\`\`\`typescript
function useForm<T extends Record<string, unknown>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)

  const handleChange = (key: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  return { values, handleChange }
}
\`\`\`

## 3. Repository 패턴

\`\`\`typescript
interface Repository<T, CreateDto, UpdateDto> {
  findAll(): Promise<T[]>
  findOne(id: string): Promise<T | null>
  create(dto: CreateDto): Promise<T>
  update(id: string, dto: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
\`\`\`

## 언제 제네릭을 피해야 하나?

- 한 가지 타입에만 쓰인다면 그냥 그 타입 쓰세요
- 타입이 너무 복잡해지면 가독성이 떨어짐
- \`any\` 대신 제네릭을 썼는데 오히려 복잡해진다면 재설계 필요

**황금 규칙**: "이 코드를 3개월 후 내가 봤을 때 이해할 수 있는가?"

도움이 됐으면 좋겠습니다!`,
  }, junho.token)

  await api('POST', `/agora/${q4.id}/answers/${a4.id}/accept`, {}, sujin.token)
  console.log('  ✅ Q4 (TypeScript Generic) - 채택 완료')

  // Q5: Open
  await api<{ id: string }>('POST', '/agora', {
    title: '개발자 첫 이직할 때 연봉 협상 어떻게 하셨나요?',
    content: `1년 6개월 차 주니어 개발자입니다. 현재 이직을 준비 중인데 연봉 협상이 너무 막막합니다.

현재 상황:
- 스타트업 재직 중 (25명 규모)
- 현재 연봉: 3,200만원
- 이직 목표: 중견 IT 기업 또는 시리즈B 이상 스타트업

궁금한 점:
1. 희망 연봉을 처음에 얼마를 써야 하나요?
2. 오퍼 받은 후 협상 여지가 있나요?
3. 복지/주식은 어떻게 비교해야 하나요?
4. 역제안(Counter offer)은 무조건 하는 건가요?

경험자 분들 조언 부탁드립니다!`,
    bounty: 10,
  }, daeun.token)
  console.log('  ✅ Q5 (연봉 협상)')

  // ── 7. 워크스페이스 생성 + 팀원모집 ─────────────────
  console.log('\n🏢 워크스페이스 생성 및 팀원모집 글 작성...')

  // 영민 워크스페이스 (PROJECT)
  const ws1 = await api<{ id: string }>('POST', '/workspaces', {
    name: '핀테크 대출 비교 앱',
    type: 'PROJECT',
    techStack: ['React', 'NestJS', 'PostgreSQL'],
  }, ymin.token)

  await api('POST', '/recruit', {
    projectId: ws1.id,
    type: 'PROJECT',
    title: '핀테크 대출 비교 앱 개발 팀원 모집 (포트폴리오용)',
    description: `안녕하세요! 사이드 프로젝트로 핀테크 대출 비교 서비스를 만들고 있어요.

프로젝트 소개:
- 여러 은행/캐피탈의 대출 금리를 한눈에 비교하는 서비스
- 실제 오픈 API 연동 예정 (금융결제원 오픈뱅킹)
- 포트폴리오 목적이지만 실제 배포까지 목표!

기술 스택:
- Frontend: React 18 + TypeScript + TailwindCSS
- Backend: NestJS + Prisma + PostgreSQL
- 배포: Vercel + Railway

기간: 약 2개월 (주 2회 온라인 미팅)

같이 성장할 분 환영합니다! 🚀`,
    positions: ['프론트엔드', '기획'],
    maxMembers: 4,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }, ymin.token)
  console.log('  ✅ 팀원모집 1 - 핀테크 앱')

  // 이준호 워크스페이스 (STUDY)
  const ws2 = await api<{ id: string }>('POST', '/workspaces', {
    name: 'React + TypeScript 스터디',
    type: 'STUDY',
    techStack: ['React', 'TypeScript'],
  }, junho.token)

  await api('POST', '/recruit', {
    projectId: ws2.id,
    type: 'STUDY',
    title: 'React + TypeScript 심화 스터디 모집 (매주 화, 목 온라인)',
    description: `React와 TypeScript를 함께 공부할 스터디원을 모집합니다!

스터디 방식:
- 매주 화, 목 오후 9시 ~ 11시 (온라인)
- 주차별 주제 선정 후 발표식 진행
- 실습 과제 진행 + 코드 리뷰

커리큘럼 (8주):
1-2주: TypeScript 고급 타입 (Generic, Conditional Types)
3-4주: React 성능 최적화 (memo, useMemo, useCallback)
5-6주: 상태관리 심화 (Zustand, TanStack Query)
7-8주: 팀 미니 프로젝트

지원 조건:
- React 기초 이상 (컴포넌트, 훅 이해)
- 주 2회 참석 가능하신 분
- 발표 / 코드 공유에 적극적인 분

함께 성장해요! 💪`,
    positions: ['풀스택', '프론트엔드'],
    maxMembers: 6,
  }, junho.token)
  console.log('  ✅ 팀원모집 2 - React 스터디')

  // 민서 워크스페이스 (PROJECT)
  const ws3 = await api<{ id: string }>('POST', '/workspaces', {
    name: 'AI 취업 플랫폼 MVP',
    type: 'PROJECT',
    techStack: ['Next.js', 'FastAPI', 'OpenAI'],
  }, minseo.token)

  await api('POST', '/recruit', {
    projectId: ws3.id,
    type: 'PROJECT',
    title: 'AI 기반 IT 취업 플랫폼 MVP 팀원 모집',
    description: `안녕하세요! AI를 활용한 IT 취업 준비 플랫폼을 만들려고 합니다.

서비스 개요:
- AI 이력서 피드백 (GPT-4 활용)
- 맞춤형 면접 질문 생성
- 기업별 채용 트렌드 분석
- 개발자 커뮤니티 (이 FLOWIT과 비슷한!)

원하는 팀원:
- 백엔드 개발자: FastAPI 또는 NestJS 경험자
- AI/ML 엔지니어: OpenAI API, LangChain 관심 있으신 분

진지하게 서비스를 만들고 싶은 분 환영합니다.
추후 예비창업패키지 신청도 계획 중입니다!`,
    positions: ['백엔드', 'AI/ML'],
    maxMembers: 4,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }, minseo.token)
  console.log('  ✅ 팀원모집 3 - AI 취업 플랫폼')

  // 수진 워크스페이스 (STUDY) - 백엔드 스터디
  const ws4 = await api<{ id: string }>('POST', '/workspaces', {
    name: 'Node.js 백엔드 스터디',
    type: 'STUDY',
    techStack: ['Node.js', 'NestJS', 'PostgreSQL'],
  }, sujin.token)

  await api('POST', '/recruit', {
    projectId: ws4.id,
    type: 'STUDY',
    title: 'Node.js 백엔드 스터디 모집 – NestJS + Prisma 실습 중심',
    description: `백엔드에 입문하거나 심화하고 싶은 분들과 함께 공부하고 싶어 스터디를 엽니다!

스터디 개요:
- 매주 토요일 오전 10시 ~ 12시 (온라인 Discord)
- 실습 위주 커리큘럼 + 코드 리뷰
- 8주 완성 과정

커리큘럼:
1-2주: Node.js 비동기 처리 (Promise, async/await, Event Loop)
3-4주: NestJS 핵심 개념 (Module, Controller, Service, Guard)
5-6주: Prisma ORM + PostgreSQL (스키마 설계, 마이그레이션)
7-8주: JWT 인증 + REST API 완성 프로젝트

이런 분 환영해요:
- 프론트엔드 개발자로 백엔드도 배우고 싶은 분
- Node.js 입문자 ~ 중급자
- 주 1회 + 과제 수행 가능하신 분

같이 성장해요! 🌱`,
    positions: ['백엔드', '풀스택'],
    maxMembers: 5,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }, sujin.token)
  console.log('  ✅ 팀원모집 4 - Node.js 백엔드 스터디')

  // 다은 워크스페이스 (STUDY) - 알고리즘 스터디
  const ws5 = await api<{ id: string }>('POST', '/workspaces', {
    name: '코딩테스트 합격 스터디',
    type: 'STUDY',
    techStack: ['Python', 'JavaScript'],
  }, daeun.token)

  await api('POST', '/recruit', {
    projectId: ws5.id,
    type: 'STUDY',
    title: '코딩테스트 합격 스터디 – 카카오/네이버/라인 대비 (파이썬/JS)',
    description: `대기업 코딩테스트를 목표로 하는 스터디원을 모집합니다!

목표:
- 카카오, 네이버, 라인, 쿠팡 등 상반기 코딩테스트 합격
- 프로그래머스 Level 2~3 안정적으로 풀기

진행 방식:
- 매주 월, 수 저녁 8시 (온라인)
- 매 회차 문제 3개 풀어오기 + 풀이 공유
- 모르는 문제는 같이 해결하는 분위기

다루는 주제:
- 완전탐색 / BFS / DFS
- DP (동적 프로그래밍)
- 그리디 / 정렬
- 스택/큐/힙
- 문자열 처리

지원 조건:
- 파이썬 또는 자바스크립트로 기초 문법 이해하는 분
- 꾸준히 참여 가능한 분 (결석 2회 이상 시 퇴출 규칙 있음)
- 취업 준비 중이거나 이직 준비 중인 분

같이 취업 성공 합시다! 💯`,
    positions: ['프론트엔드', '백엔드', '풀스택', 'AI/ML'],
    maxMembers: 8,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }, daeun.token)
  console.log('  ✅ 팀원모집 5 - 코딩테스트 스터디')

  // 영민 워크스페이스 (STUDY) - CS 스터디
  const ws6 = await api<{ id: string }>('POST', '/workspaces', {
    name: 'CS 기초 면접 대비 스터디',
    type: 'STUDY',
    techStack: [],
  }, ymin.token)

  await api('POST', '/recruit', {
    projectId: ws6.id,
    type: 'STUDY',
    title: 'CS 기초 기술면접 대비 스터디 – 네트워크/OS/DB/자료구조',
    description: `기술면접에서 단골로 나오는 CS 기초를 같이 준비할 스터디원 모집합니다.

배경:
부트캠프 출신이라 코딩은 어느 정도 되는데 CS 기초 질문에서 자꾸 막힌다는 분들 많죠.
저도 그래서 CS 스터디를 만들었습니다!

커리큘럼 (12주):
1-2주: 네트워크 (TCP/IP, HTTP/HTTPS, REST API)
3-4주: 운영체제 (프로세스/스레드, 메모리 관리, 교착상태)
5-6주: 데이터베이스 (인덱스, 트랜잭션, 정규화, N+1)
7-8주: 자료구조 (배열/링크드리스트/트리/그래프/해시)
9-10주: 알고리즘 기초 (정렬, 탐색, 시간복잡도)
11-12주: 모의 기술면접 (2인 1조 롤플레이)

진행 방식:
- 매주 일요일 오후 2시 ~ 4시 (온라인)
- 주제별 자료 정리 → 발표 → Q&A
- 예상 질문 100선 같이 정리

이런 분과 함께하고 싶어요:
- 부트캠프 수료 후 취업 준비 중인 분
- CS 면접 준비가 부족하다고 느끼는 분
- 성실하게 참여하실 수 있는 분

취업 같이 뚫어봐요! 🔥`,
    positions: ['프론트엔드', '백엔드', '풀스택'],
    maxMembers: 6,
  }, ymin.token)
  console.log('  ✅ 팀원모집 6 - CS 기술면접 스터디')

  // 준호 워크스페이스 (STUDY) - 마감 임박 스터디
  const ws7 = await api<{ id: string }>('POST', '/workspaces', {
    name: '프론트엔드 취업 준비 스터디',
    type: 'STUDY',
    techStack: ['React', 'TypeScript', 'Next.js'],
  }, junho.token)

  await api('POST', '/recruit', {
    projectId: ws7.id,
    type: 'STUDY',
    title: '🔥 마감 임박! 프론트엔드 취업 스터디 – 포폴 완성까지 (4/3 마감)',
    description: `내일(4/3) 마감되는 스터디입니다! 자리가 얼마 남지 않았어요.

스터디 목표:
- 4주 안에 취업용 포트폴리오 프로젝트 1개 완성
- React + TypeScript 실전 감각 끌어올리기
- 서로 코드 리뷰하며 성장

진행 방식:
- 매주 화/금 저녁 9시 (온라인 Zoom)
- 주차별 미션 수행 → PR → 코드 리뷰
- 4주 후 배포까지 완성

참여 조건:
- React 기초 이상 가능한 분
- 4주 동안 꾸준히 참여 가능한 분
- 취업/이직 준비 중인 분

현재 3명 확정 → 마지막 2자리 남았습니다. 서두르세요!`,
    positions: ['프론트엔드'],
    maxMembers: 5,
    deadline: '2026-04-03',
  }, junho.token)
  console.log('  ✅ 팀원모집 7 - 마감 임박 프론트엔드 스터디 (4/3 마감)')

  // ── 8. 팀원모집 지원 ─────────────────────────────────
  console.log('\n📨 팀원모집 지원...')

  // 첫 번째 모집글에 수진, 민서가 지원
  const recruits = await fetch(`${BASE_URL}/recruit?limit=20`).then(r => r.json())
  const recruitList = recruits.data as { id: string; authorId: string }[]

  for (const recruit of recruitList) {
    if (recruit.authorId === ymin.id) {
      // 핀테크 앱에 수진, 준호 지원
      await api('POST', `/recruit/${recruit.id}/apply`, { message: '안녕하세요! 프론트엔드 포지션 지원합니다. React + TypeScript 6개월 경험 있고 포트폴리오 채울 프로젝트가 절실히 필요합니다 😅' }, sujin.token).catch(() => {})
      await api('POST', `/recruit/${recruit.id}/apply`, { message: '기획 포지션으로 지원합니다. UX/UI 디자인과 서비스 기획 경험이 있습니다. 같이 멋진 서비스 만들어봐요!' }, daeun.token).catch(() => {})
    }
    if (recruit.authorId === minseo.id) {
      // AI 플랫폼에 영민 지원
      await api('POST', `/recruit/${recruit.id}/apply`, { message: 'NestJS 백엔드 개발자로 지원합니다. PostgreSQL + Docker 경험 있고, AI 프로젝트에 관심이 많습니다!' }, ymin.token).catch(() => {})
    }
  }
  console.log('  ✅ 팀원모집 지원 완료')

  console.log('\n✨ 시드 완료!\n')
  console.log('생성 요약:')
  console.log('  - 신규 유저: 5명 (이준호, 박수진, 최영민, 김다은, 장민서)')
  console.log('  - 게시글: 8개 (취업/진로 4, 자유게시판 2, 아티클 2)')
  console.log('  - 댓글: 10개')
  console.log('  - 좋아요: 여러 개')
  console.log('  - 아고라 질문: 5개 (채택 완료 2개, 미채택 3개)')
  console.log('  - 팀원모집: 7개 (프로젝트 2개, 스터디 5개, 지원자 3명)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
