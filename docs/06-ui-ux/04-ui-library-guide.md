# UI 라이브러리 가이드: Nuxt UI vs Shadcn-vue

## 개요

TechBuddy 프로젝트의 UI 라이브러리 전략:
- **MVP 단계**: Nuxt UI (빠른 개발)
- **프로덕트 단계**: Shadcn-vue (커스터마이징) - 검토 예정

---

## 1. 라이브러리 비교

### 1.1 기본 정보

| 항목 | Nuxt UI v4 | Shadcn-vue |
|------|-----------|------------|
| Tailwind 버전 | **v4** | **v3** |
| 컴포넌트 수 | 100+ | 40+ |
| 설치 방식 | 모듈 (`@nuxt/ui`) | 복사-붙여넣기 (소스 소유) |
| 커스터마이징 | 테마 변수 | 완전한 소스 수정 |
| 학습 곡선 | 낮음 | 중간 |
| 번들 크기 | 자동 트리쉐이킹 | 필요한 것만 설치 |

### 1.2 장단점

#### Nuxt UI v4
**장점:**
- Zero-config 설치 (모듈만 추가하면 끝)
- Nuxt 생태계 최적화 (SSR, 자동 임포트)
- 풍부한 컴포넌트 (Form, Table, Modal 등)
- 다크모드 내장
- 공식 지원 및 활발한 업데이트

**단점:**
- 커스터마이징 제한 (블랙박스)
- Nuxt 전용 (Vue 단독 사용 어려움)
- Tailwind v4 강제 (v3 프로젝트와 호환 안됨)

#### Shadcn-vue
**장점:**
- 완전한 소스 소유 (원하는 대로 수정)
- 가볍고 유연함
- Vue/Nuxt 모두 사용 가능
- 디자인 시스템 구축에 적합
- X/Twitter에서 트렌드 (커뮤니티 활발)

**단점:**
- 수동 설치 (각 컴포넌트 개별 추가)
- 초기 설정 복잡
- 컴포넌트 수 적음 (직접 만들어야 할 수도)

---

## 2. 설치 및 설정

### 2.1 Nuxt UI v4 설정

#### 패키지 설치

```bash
# 1. Nuxt UI 설치
npm install @nuxt/ui

# 2. Tailwind CSS v4 설치 (필수!)
npm install -D tailwindcss@4
```

> **중요**: Nuxt UI v4는 내부적으로 Tailwind CSS v4를 사용하지만, CSS import를 위해 `tailwindcss@4`를 devDependency로 별도 설치해야 합니다.

#### 필수 파일

**1. nuxt.config.ts:**
```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],  // CSS 파일 등록 필수!
})
```

**2. assets/css/main.css:**
```css
@import "tailwindcss";
@import "@nuxt/ui";
```

> **핵심**: 두 import 모두 필요합니다. `tailwindcss`만 있으면 Nuxt UI 컴포넌트 스타일이 적용되지 않습니다.

**3. app.vue:**
```vue
<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

#### 중요: `<UApp>` 래퍼
- Nuxt UI의 루트 컴포넌트
- **반드시 필요** - 없으면 스타일이 적용되지 않음
- 역할:
  - 전역 CSS 로드
  - Color mode (다크/라이트) 지원
  - Toast, Modal 등 전역 컴포넌트 제공

#### 설치 체크리스트

1. ✅ `@nuxt/ui` 설치됨
2. ✅ `tailwindcss@4` devDependency로 설치됨
3. ✅ `assets/css/main.css` 생성 및 두 import 포함
4. ✅ `nuxt.config.ts`에 CSS 파일 등록
5. ✅ `app.vue`에 `<UApp>` 래퍼 적용
6. ✅ 기존 `tailwind.config.js` 제거 (또는 백업)

### 2.2 Shadcn-vue 설정 (참고용)

#### 필수 파일

**tailwind.config.js:**
```javascript
export default {
  darkMode: ['class'],
  content: ['./components/**/*.vue', './pages/**/*.vue'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... 기타 색상
      },
    },
  },
}
```

**assets/css/tailwind.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 142 76% 36%;
    /* ... CSS 변수 정의 */
  }
  .dark {
    --background: 222.2 84% 4.9%;
    /* ... 다크모드 변수 */
  }
}
```

---

## 3. 컴포넌트 문법 비교

### 3.1 버튼

#### Nuxt UI
```vue
<UButton color="primary" variant="solid" size="lg" :loading="isLoading">
  제출하기
</UButton>
```

#### Shadcn-vue
```vue
<Button variant="default" size="lg" :disabled="isLoading">
  <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
  제출하기
</Button>
```

### 3.2 폼 입력

#### Nuxt UI
```vue
<UFormField label="이메일" name="email">
  <UInput
    v-model="state.email"
    type="email"
    placeholder="example@email.com"
    icon="i-heroicons-envelope"
  />
</UFormField>
```

#### Shadcn-vue
```vue
<FormField v-slot="{ componentField }" name="email">
  <FormItem>
    <FormLabel>이메일</FormLabel>
    <FormControl>
      <Input type="email" placeholder="example@email.com" v-bind="componentField" />
    </FormControl>
    <FormMessage />
  </FormItem>
</FormField>
```

### 3.3 폼 유효성 검사 (Zod)

#### Nuxt UI
```vue
<script setup>
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '최소 8자'),
})

const state = reactive({ email: '', password: '' })
</script>

<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <!-- 폼 필드들 -->
  </UForm>
</template>
```

#### Shadcn-vue (vee-validate 사용)
```vue
<script setup>
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = toTypedSchema(z.object({
  email: z.string().email(),
  password: z.string().min(8),
}))

const { handleSubmit } = useForm({ validationSchema: schema })
</script>
```

### 3.4 아이콘

#### Nuxt UI
```vue
<!-- 내장 아이콘 (Heroicons, Lucide 등) -->
<UIcon name="i-heroicons-envelope" />
<UIcon name="i-lucide-mail" />
```

#### Shadcn-vue
```vue
<!-- lucide-vue-next 직접 import -->
<script setup>
import { Mail } from 'lucide-vue-next'
</script>

<template>
  <Mail class="h-4 w-4" />
</template>
```

### 3.5 Toast (알림)

#### Nuxt UI
```vue
<script setup>
const toast = useToast()

// 성공 알림
toast.add({
  title: '성공',
  description: '작업이 완료되었습니다.',
  color: 'success',  // ✅ 시맨틱 색상 사용
})

// 에러 알림
toast.add({
  title: '실패',
  description: '오류가 발생했습니다.',
  color: 'error',
})
</script>
```

**Nuxt UI v4 Toast 색상 (color 속성):**

| 색상 | 용도 |
|------|-----|
| `primary` | 주요 액션 |
| `secondary` | 보조 액션 |
| `success` | 성공 메시지 (~~green~~ 사용 불가) |
| `info` | 정보 메시지 |
| `warning` | 경고 메시지 |
| `error` | 에러 메시지 (~~red~~ 사용 불가) |
| `neutral` | 중립적인 메시지 |

> **주의**: CSS 색상명(`green`, `red`, `blue` 등)은 사용할 수 없습니다. 반드시 위의 시맨틱 색상명을 사용하세요.

#### Shadcn-vue
```vue
<script setup>
import { useToast } from '@/components/ui/toast/use-toast'

const { toast } = useToast()

toast({
  title: '성공',
  description: '작업이 완료되었습니다.',
  variant: 'default',  // 또는 'destructive'
})
</script>
```

---

## 4. 트러블슈팅

### 4.1 Nuxt UI 스타일이 적용되지 않는 경우

#### 증상
- 페이지는 로드되지만 컴포넌트가 스타일 없이 표시됨
- Tailwind 클래스가 작동하지 않음

#### 원인 및 해결

**1. `<UApp>` 래퍼 누락**
```vue
<!-- ❌ 잘못됨 -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<!-- ✅ 올바름 -->
<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

**2. "Can't resolve 'tailwindcss'" 에러**

#### 증상
```
Error: Can't resolve 'tailwindcss' in './assets/css'
```

#### 원인
`tailwindcss@4`가 설치되지 않음

#### 해결
```bash
npm install -D tailwindcss@4
```

**3. Tailwind CSS 버전 충돌**

Nuxt UI v4는 Tailwind v4를 사용. 기존 Tailwind v3 설정이 있으면 충돌.

```css
/* ❌ Tailwind v3 문법 (충돌) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ Tailwind v4 문법 */
@import "tailwindcss";
```

**4. tailwind.config.js 충돌**

Nuxt UI v4는 자체 Tailwind 설정을 사용. 기존 `tailwind.config.js`가 있으면 충돌할 수 있음.

```bash
# 해결: 백업 후 제거
mv tailwind.config.js tailwind.config.js.bak
```

**5. .nuxt 캐시 문제**

```bash
# 캐시 삭제 후 재시작
rm -rf .nuxt
npm run dev
```

### 4.2 404 에러가 발생하는 경우

#### 증상
- `/auth/login`, `/auth/signup` 등 페이지 접근 시 404

#### 해결
1. `pages/` 폴더 구조 확인
2. `.nuxt` 캐시 삭제
3. 서버 재시작

---

## 5. 전환 가이드 (Nuxt UI → Shadcn-vue)

### 5.1 전환 시기
- MVP 완료 후 프로덕트 개발 단계
- 커스텀 디자인 시스템 필요 시
- Shadcn-vue의 Tailwind v4 지원 확인 후

### 5.2 전환 체크리스트

#### 패키지 변경
```bash
# 1. Nuxt UI 제거
npm uninstall @nuxt/ui

# 2. Tailwind v3 및 관련 패키지 설치
npm install -D @nuxtjs/tailwindcss tailwindcss@3 autoprefixer postcss

# 3. Shadcn-vue 설정
npx shadcn-vue@latest init
```

#### 설정 파일 변경

1. **nuxt.config.ts**
```typescript
// modules에서 @nuxt/ui 제거, @nuxtjs/tailwindcss 추가
modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
```

2. **tailwind.config.js 복원**
```bash
mv tailwind.config.js.bak tailwind.config.js
```

3. **CSS 파일 변경**
```css
/* Tailwind v3 문법으로 변경 */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* CSS 변수 복원 */
  }
}
```

4. **app.vue**
```vue
<!-- <UApp> 제거 -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

#### 컴포넌트 마이그레이션

| Nuxt UI | Shadcn-vue |
|---------|------------|
| `<UButton>` | `<Button>` |
| `<UInput>` | `<Input>` |
| `<UForm>` | `<form>` + vee-validate |
| `<UFormField>` | `<FormField>` |
| `<UCard>` | `<Card>` |
| `<UModal>` | `<Dialog>` |
| `<UToast>` | `<Toaster>` + toast() |

### 5.3 주의사항

1. **Tailwind v4 vs v3**
   - Shadcn-vue가 Tailwind v4를 지원할 때까지 기다리거나
   - v3로 다운그레이드 필요

2. **백업 파일 활용**
   - `tailwind.config.js.bak`: Shadcn-vue용 테마 설정
   - 프로젝트에 이미 백업해둠

3. **점진적 마이그레이션**
   - 한 번에 모든 컴포넌트 변경하지 말 것
   - 페이지별로 점진적 전환 권장

---

## 6. 참고 자료

- [Nuxt UI 공식 문서](https://ui.nuxt.com)
- [Shadcn-vue 공식 문서](https://www.shadcn-vue.com)
- [Tailwind CSS v4 마이그레이션 가이드](https://tailwindcss.com/docs/v4-beta)

---

*작성일: 2025-12-02*
*마지막 수정: 2025-12-02*
