# FLOWIT Frontend

IT 부트캠프 학생과 취준생을 위한 커뮤니티 플랫폼 - Frontend

## 기술 스택

- **Framework**: Nuxt 3
- **Language**: TypeScript
- **State Management**: Pinia
- **Styling**: Tailwind CSS + shadcn-vue
- **Package Manager**: npm

## 폴더 구조

```
frontend/
├── components/
│   ├── ui/          # shadcn-vue 컴포넌트
│   ├── layout/      # 레이아웃 컴포넌트
│   ├── auth/        # 인증 관련 컴포넌트
│   ├── post/        # 게시글 컴포넌트
│   └── project/     # 프로젝트 컴포넌트
│
├── composables/     # 재사용 로직
├── stores/          # Pinia 상태관리
├── types/           # TypeScript 타입
├── utils/           # 유틸리티 함수
├── pages/           # 라우팅 페이지
├── layouts/         # 레이아웃
└── middleware/      # 라우트 가드
```

## 개발 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3001)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

## 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000
NUXT_PUBLIC_ENVIRONMENT=development
```

## 코딩 컨벤션

- **컴포넌트**: PascalCase (예: `PostCard.vue`)
- **Composables**: camelCase with 'use' prefix (예: `useAuth.ts`)
- **Types**: PascalCase for interfaces (예: `interface Post`)
- **Utils**: camelCase for functions

## 주요 라이브러리

- `@nuxtjs/tailwindcss` - Tailwind CSS 통합
- `@pinia/nuxt` - 상태관리
- `class-variance-authority` - shadcn-vue용 스타일 유틸
- `clsx` + `tailwind-merge` - 클래스 병합

## 참고 문서

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Pinia](https://pinia.vuejs.org/)
- [shadcn-vue](https://www.shadcn-vue.com/)
