# TechBuddy Frontend 아키텍처 가이드

## 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [레퍼런스 프로젝트 분석 (URWI)](#레퍼런스-프로젝트-분석-urwi)
3. [TechBuddy 아키텍처 설계 원칙](#techbuddy-아키텍처-설계-원칙)
4. [프로젝트 구조](#프로젝트-구조)
5. [레이어 아키텍처](#레이어-아키텍처)
6. [코딩 컨벤션](#코딩-컨벤션)

---

## 프로젝트 개요

**기술 스택:**
- Nuxt 3 (Vue 3 기반 풀스택 프레임워크)
- TypeScript (타입 안정성)
- Tailwind CSS (유틸리티 퍼스트 CSS)
- shadcn-vue (UI 컴포넌트)
- Pinia (상태관리)

**개발 철학:**
- **MVP First**: 빠른 검증을 위한 최소 기능 구현
- **Over-engineering 지양**: 필요한 추상화만 도입
- **단순성 우선**: 복잡도보다 명확성과 유지보수성

---

## 레퍼런스 프로젝트 분석 (URWI)

### 분석 내용

URWI 프로젝트(`/Users/yoonjongho/Desktop/YJH_folder/work/front-end/urwi-app`)를 분석하여 다음 패턴들을 발견:

#### 1. Service Class Pattern
```typescript
// URWI 방식
class AuthService {
  async login(credentials) { ... }
  async logout() { ... }
}

// 사용
const authService = new AuthService();
await authService.login(data);
```

**장점:**
- OOP 스타일로 코드 조직화
- 메서드 재사용성

**단점:**
- Vue/Nuxt의 Composable 패턴과 충돌
- 불필요한 인스턴스화 오버헤드
- TypeScript 타입 추론이 Composable보다 복잡
- Vue 3의 Composition API 철학과 맞지 않음

#### 2. useApi Composable
```typescript
// URWI 방식
const useApi = () => {
  const get = async (url) => { ... }
  const post = async (url, data) => { ... }
  return { get, post }
}
```

**평가:**
- 좋은 패턴이지만 MVP에서는 직접 `$fetch` 사용으로 충분

#### 3. Shared Folder (모노레포)
```
monorepo/
├── frontend/
├── backend/
└── shared/
    ├── types/
    └── utils/
```

**평가:**
- TypeScript 타입 공유는 유용
- 하지만 MVP에서는 Backend API 스펙이 자주 변경됨
- 초기에는 Frontend에서 독립적으로 타입 정의하는 것이 더 유연

---

## TechBuddy 아키텍처 설계 원칙

### 채택한 것 ✅

1. **Nuxt 3 기본 패턴 따르기**
   - 파일 기반 라우팅 (`pages/`)
   - Auto-import (components, composables)
   - Server API routes (`server/api/`)

2. **Composable 중심 설계**
   - Service Class 대신 Composable 사용
   - Vue 3 Composition API와 자연스러운 통합

3. **Tailwind CSS + shadcn-vue**
   - 유틸리티 퍼스트 스타일링
   - 재사용 가능한 컴포넌트 라이브러리

4. **Pinia 상태관리**
   - 전역 상태만 Pinia에 저장
   - 로컬 상태는 `ref`, `reactive` 사용

### 채택하지 않은 것 ❌

1. **Service Class Pattern**
   - 이유: Composable이 더 Vue스럽고 간결함
   - 대안: `composables/` 디렉토리에 로직 구현

2. **Shared Folder (초기 단계)**
   - 이유: MVP에서는 API 스펙이 자주 변경되어 동기화 비용이 높음
   - 대안: Frontend에서 독립적으로 타입 정의
   - 향후: 안정화 후 도입 검토

3. **과도한 추상화**
   - 이유: 빠른 개발과 유연성 우선
   - 예시: Custom API wrapper 대신 Nuxt의 `$fetch` 직접 사용

---

## 프로젝트 구조

```
frontend/
├── app.vue                 # 루트 컴포넌트 (NuxtLayout, NuxtPage)
├── nuxt.config.ts          # Nuxt 설정
├── tailwind.config.js      # Tailwind 설정
│
├── assets/
│   └── css/
│       └── tailwind.css    # Tailwind + CSS 변수
│
├── components/
│   ├── ui/                 # shadcn-vue 컴포넌트
│   │   ├── Button.vue
│   │   ├── Card.vue
│   │   └── Input.vue
│   ├── layout/             # 레이아웃 컴포넌트
│   │   ├── Header.vue
│   │   ├── Footer.vue
│   │   └── Sidebar.vue
│   ├── auth/               # 인증 관련 컴포넌트
│   │   ├── LoginForm.vue
│   │   └── RegisterForm.vue
│   ├── post/               # 게시글 컴포넌트
│   │   ├── PostCard.vue
│   │   └── PostList.vue
│   └── project/            # 프로젝트 컴포넌트
│       ├── ProjectCard.vue
│       └── ProjectList.vue
│
├── composables/            # 재사용 로직
│   ├── useAuth.ts          # 인증 로직
│   ├── usePost.ts          # 게시글 CRUD
│   ├── useProject.ts       # 프로젝트 CRUD
│   └── useToast.ts         # 토스트 알림
│
├── stores/                 # Pinia 스토어
│   ├── auth.ts             # 인증 상태
│   └── user.ts             # 사용자 정보
│
├── types/                  # TypeScript 타입
│   ├── auth.ts
│   ├── post.ts
│   ├── project.ts
│   └── user.ts
│
├── utils/                  # 유틸리티 함수
│   ├── date.ts             # 날짜 포맷팅
│   └── validation.ts       # 유효성 검사
│
├── pages/                  # 라우팅 페이지
│   ├── index.vue           # / (홈)
│   ├── login.vue           # /login
│   ├── register.vue        # /register
│   ├── posts/
│   │   ├── index.vue       # /posts
│   │   └── [id].vue        # /posts/:id
│   └── projects/
│       ├── index.vue       # /projects
│       └── [id].vue        # /projects/:id
│
├── layouts/                # 레이아웃
│   ├── default.vue         # 기본 레이아웃
│   └── auth.vue            # 인증 페이지 레이아웃
│
└── middleware/             # 라우트 가드
    ├── auth.ts             # 인증 체크
    └── guest.ts            # 비로그인 전용
```

---

## 레이어 아키텍처

### 1. Presentation Layer (컴포넌트)

**역할:**
- UI 렌더링
- 사용자 인터랙션 처리
- Composable 호출

**원칙:**
- 비즈니스 로직 포함 금지
- Composable과 Store에 의존

**예시:**
```vue
<script setup lang="ts">
// ✅ Good: Composable 사용
const { login, isLoading } = useAuth();

const handleLogin = async (credentials) => {
  await login(credentials);
};
</script>

<template>
  <button @click="handleLogin" :disabled="isLoading">
    로그인
  </button>
</template>
```

### 2. Business Logic Layer (Composables)

**역할:**
- 비즈니스 로직 구현
- API 호출
- 데이터 변환

**원칙:**
- **Service Class 대신 Composable 사용**
- 단일 책임 원칙 (SRP)
- 재사용 가능하도록 설계

**예시:**
```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const authStore = useAuthStore();
  const router = useRouter();
  const isLoading = ref(false);

  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true;
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });

      authStore.setToken(response.accessToken);
      authStore.setUser(response.user);

      await router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' });
    authStore.clearAuth();
    await router.push('/login');
  };

  return {
    login,
    logout,
    isLoading,
  };
};
```

**왜 Service Class가 아닌 Composable인가?**
- Vue 3의 Composition API와 자연스럽게 통합
- 자동 import 지원 (Nuxt auto-import)
- Reactive 상태 관리가 더 간편
- TypeScript 타입 추론이 우수
- 테스트하기 쉬움

### 3. State Management Layer (Pinia)

**역할:**
- 전역 상태 관리
- 인증 토큰, 사용자 정보 등

**원칙:**
- 전역 상태만 Pinia에 저장
- 로컬 상태는 `ref`/`reactive` 사용

**예시:**
```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value);

  const setToken = (token: string) => {
    accessToken.value = token;
  };

  const setUser = (userData: User) => {
    user.value = userData;
  };

  const clearAuth = () => {
    accessToken.value = null;
    user.value = null;
  };

  return {
    accessToken,
    user,
    isAuthenticated,
    setToken,
    setUser,
    clearAuth,
  };
});
```

### 4. API Layer (직접 $fetch 사용)

**역할:**
- Backend API 호출

**원칙:**
- Composable 내부에서 `$fetch` 직접 사용
- Custom API wrapper 없이 단순하게 유지

**예시:**
```typescript
// ❌ Bad: 불필요한 Service Class
class PostService {
  async getPosts() {
    return await $fetch('/api/posts');
  }
}

// ✅ Good: Composable에서 직접 호출
export const usePost = () => {
  const posts = ref<Post[]>([]);

  const fetchPosts = async () => {
    posts.value = await $fetch('/api/posts');
  };

  return { posts, fetchPosts };
};
```

---

## 코딩 컨벤션

### 파일 명명 규칙

```
컴포넌트:    PascalCase     (예: PostCard.vue)
Composables: camelCase      (예: useAuth.ts)
Types:       PascalCase     (예: interface User)
Utils:       camelCase      (예: formatDate)
Pages:       kebab-case     (예: login.vue, user-profile.vue)
```

### TypeScript 타입 정의

```typescript
// types/post.ts
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostDto {
  title: string;
  content: string;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
}
```

### Composable 작성 규칙

1. **함수 이름은 `use`로 시작**
2. **반환값은 객체로 구조화**
3. **로딩 상태, 에러 상태 포함**

```typescript
export const usePost = () => {
  const posts = ref<Post[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const fetchPosts = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      posts.value = await $fetch('/api/posts');
    } catch (e) {
      error.value = e as Error;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
  };
};
```

### 컴포넌트 작성 규칙

1. **`<script setup>` 사용**
2. **Props와 Emits 타입 정의**
3. **템플릿 로직 최소화**

```vue
<script setup lang="ts">
interface Props {
  post: Post;
}

interface Emits {
  (e: 'delete', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleDelete = () => {
  emit('delete', props.post.id);
};
</script>

<template>
  <div class="post-card">
    <h3>{{ post.title }}</h3>
    <p>{{ post.content }}</p>
    <button @click="handleDelete">삭제</button>
  </div>
</template>
```

---

## 결론

TechBuddy Frontend는 **MVP 단계에 최적화된 단순하고 명확한 아키텍처**를 채택합니다.

### 핵심 원칙
1. ✅ **Nuxt 3 기본 패턴 준수**
2. ✅ **Composable 중심 설계** (Service Class ❌)
3. ✅ **필요한 추상화만 도입** (Over-engineering ❌)
4. ✅ **독립적 타입 정의** (Shared folder는 향후 검토)

이 아키텍처는 빠른 개발과 유연한 변경을 가능하게 하며, 향후 확장 시에도 점진적으로 개선할 수 있는 기반을 제공합니다.
