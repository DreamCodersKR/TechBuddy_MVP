# FLOWIT UI 라이브러리 가이드: Shadcn-vue

## 개요

FLOWIT 프로젝트의 UI 라이브러리 전략:
- **v1.4 이후**: Shadcn-vue (커스터마이징 + 디자이너 협업)
- **이전**: Nuxt UI (빠른 개발) - `_archive-v1/` 참고

---

## 라이브러리 선택 이유

### 왜 Shadcn-vue인가?

| 항목 | Nuxt UI | Shadcn-vue | 선택 이유 |
|------|---------|------------|-----------|
| 커스터마이징 | 테마 변수 제한 | **완전 자유** | 디자이너 커스텀 디자인 대응 |
| 소스 소유 | 라이브러리 의존 | **프로젝트 내 소유** | 장기 유지보수 용이 |
| 디자이너 협업 | 디자인→UI 맞춤 | **디자인 그대로 구현** | 피그마 디자인 반영 |
| 번들 크기 | 자동 트리쉐이킹 | **필요한 것만** | 최적화 |

### 전환 배경

1. 디자이너가 본격 작업 시작 (피그마 하이파이 완성)
2. Nuxt UI 기본 스타일과 디자인 차이 발생
3. 원래 기획서(v1.3)에도 Shadcn-vue 계획이었음
4. 현재 Nuxt UI 사용량 적음 (21곳) → 전환 비용 낮음

---

## 1. Shadcn-vue 설치

### 1.1 기본 설정

```bash
# 1. 기존 Nuxt UI 제거
npm uninstall @nuxt/ui

# 2. Tailwind CSS 설치
npm install -D @nuxtjs/tailwindcss tailwindcss autoprefixer

# 3. Shadcn-vue 초기화
npx shadcn-vue@latest init
```

### 1.2 필수 패키지

```bash
npm install -D class-variance-authority clsx tailwind-merge
npm install @vueuse/core radix-vue
npm install lucide-vue-next  # 아이콘
```

### 1.3 설정 파일

**nuxt.config.ts:**
```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  css: ['~/assets/css/tailwind.css'],
})
```

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
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
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... 다크모드 변수 */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 2. 컴포넌트 설치

### 2.1 필수 컴포넌트

```bash
# 기본 UI
npx shadcn-vue@latest add button
npx shadcn-vue@latest add input
npx shadcn-vue@latest add card
npx shadcn-vue@latest add badge

# 폼 관련
npx shadcn-vue@latest add form
npx shadcn-vue@latest add label
npx shadcn-vue@latest add textarea

# 레이아웃
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add dropdown-menu
npx shadcn-vue@latest add tabs
npx shadcn-vue@latest add separator

# 피드백
npx shadcn-vue@latest add toast
npx shadcn-vue@latest add alert

# 데이터 표시
npx shadcn-vue@latest add table
npx shadcn-vue@latest add avatar
npx shadcn-vue@latest add skeleton
```

### 2.2 컴포넌트 구조

```
frontend/
├── components/
│   └── ui/                    # Shadcn-vue 컴포넌트
│       ├── button/
│       │   ├── Button.vue
│       │   └── index.ts
│       ├── input/
│       │   ├── Input.vue
│       │   └── index.ts
│       ├── card/
│       │   ├── Card.vue
│       │   ├── CardHeader.vue
│       │   ├── CardContent.vue
│       │   └── index.ts
│       └── ...
```

---

## 3. 컴포넌트 사용 예시

### 3.1 버튼

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex gap-4">
    <Button>기본</Button>
    <Button variant="secondary">보조</Button>
    <Button variant="outline">아웃라인</Button>
    <Button variant="ghost">고스트</Button>
    <Button variant="destructive">삭제</Button>
  </div>
</template>
```

**Button variants:**
- `default` - 기본 버튼
- `secondary` - 보조 버튼
- `outline` - 테두리 버튼
- `ghost` - 투명 버튼
- `link` - 링크 스타일
- `destructive` - 삭제/위험 액션

### 3.2 입력 필드

```vue
<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const email = ref('')
</script>

<template>
  <div class="grid gap-2">
    <Label for="email">이메일</Label>
    <Input
      id="email"
      v-model="email"
      type="email"
      placeholder="example@email.com"
    />
  </div>
</template>
```

### 3.3 카드

```vue
<script setup lang="ts">
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>게시글 제목</CardTitle>
      <CardDescription>2025.01.02 작성</CardDescription>
    </CardHeader>
    <CardContent>
      <p>게시글 내용입니다...</p>
    </CardContent>
    <CardFooter class="flex justify-between">
      <Button variant="outline">취소</Button>
      <Button>저장</Button>
    </CardFooter>
  </Card>
</template>
```

### 3.4 폼 (Vee-validate + Zod)

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = toTypedSchema(z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '최소 8자 이상 입력하세요'),
}))

const { handleSubmit } = useForm({
  validationSchema: formSchema,
})

const onSubmit = handleSubmit((values) => {
  console.log(values)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4">
    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel>이메일</FormLabel>
        <FormControl>
          <Input type="email" placeholder="example@email.com" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="password">
      <FormItem>
        <FormLabel>비밀번호</FormLabel>
        <FormControl>
          <Input type="password" placeholder="********" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button type="submit" class="w-full">로그인</Button>
  </form>
</template>
```

### 3.5 Toast 알림

```vue
<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast'
import { Button } from '@/components/ui/button'

const { toast } = useToast()

const showSuccess = () => {
  toast({
    title: '성공',
    description: '작업이 완료되었습니다.',
  })
}

const showError = () => {
  toast({
    title: '오류',
    description: '문제가 발생했습니다.',
    variant: 'destructive',
  })
}
</script>

<template>
  <div class="flex gap-4">
    <Button @click="showSuccess">성공 알림</Button>
    <Button variant="destructive" @click="showError">에러 알림</Button>
  </div>
</template>
```

**app.vue에 Toaster 추가:**
```vue
<script setup lang="ts">
import { Toaster } from '@/components/ui/toast'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster />
</template>
```

### 3.6 아이콘

```vue
<script setup lang="ts">
import { Mail, User, Lock, Eye, EyeOff } from 'lucide-vue-next'

const showPassword = ref(false)
</script>

<template>
  <div class="flex items-center gap-2">
    <Mail class="h-4 w-4" />
    <User class="h-4 w-4" />
    <Lock class="h-4 w-4" />
    <component
      :is="showPassword ? EyeOff : Eye"
      class="h-4 w-4 cursor-pointer"
      @click="showPassword = !showPassword"
    />
  </div>
</template>
```

---

## 4. 마이그레이션 가이드 (Nuxt UI → Shadcn-vue)

### 4.1 컴포넌트 매핑

| Nuxt UI | Shadcn-vue | 비고 |
|---------|------------|------|
| `<UButton>` | `<Button>` | variant 이름 다름 |
| `<UInput>` | `<Input>` | 거의 동일 |
| `<UCard>` | `<Card>` + 서브컴포넌트 | 구조 분리됨 |
| `<UModal>` | `<Dialog>` | API 다름 |
| `<UForm>` | form + vee-validate | 별도 설정 필요 |
| `<UFormField>` | `<FormField>` | vee-validate 연동 |
| `<UTable>` | `<Table>` + 서브컴포넌트 | 구조 분리됨 |
| `<UToast>` | `toast()` 함수 | composable 사용 |
| `<UDropdown>` | `<DropdownMenu>` | 구조 다름 |
| `<UTabs>` | `<Tabs>` | 거의 동일 |
| `<UBadge>` | `<Badge>` | 거의 동일 |
| `<UAvatar>` | `<Avatar>` | 거의 동일 |
| `<UIcon>` | lucide-vue-next | 직접 import |

### 4.2 주요 변경 사항

#### 버튼 variant 변경
```vue
<!-- Nuxt UI -->
<UButton color="primary" variant="solid">버튼</UButton>
<UButton color="error" variant="soft">삭제</UButton>

<!-- Shadcn-vue -->
<Button variant="default">버튼</Button>
<Button variant="destructive">삭제</Button>
```

#### 폼 구조 변경
```vue
<!-- Nuxt UI -->
<UForm :schema="schema" :state="state" @submit="onSubmit">
  <UFormField label="이메일" name="email">
    <UInput v-model="state.email" />
  </UFormField>
</UForm>

<!-- Shadcn-vue -->
<form @submit="onSubmit">
  <FormField v-slot="{ componentField }" name="email">
    <FormItem>
      <FormLabel>이메일</FormLabel>
      <FormControl>
        <Input v-bind="componentField" />
      </FormControl>
      <FormMessage />
    </FormItem>
  </FormField>
</form>
```

#### Toast 사용법 변경
```vue
<!-- Nuxt UI -->
const toast = useToast()
toast.add({ title: '성공', color: 'success' })

<!-- Shadcn-vue -->
const { toast } = useToast()
toast({ title: '성공' })
toast({ title: '에러', variant: 'destructive' })
```

---

## 5. 디자인 시스템 연동

### 5.1 피그마 → CSS 변수

디자이너가 정의한 색상을 CSS 변수로 변환:

```css
/* 피그마 색상 → CSS 변수 */
:root {
  /* Primary - 피그마에서 정의된 브랜드 컬러 */
  --primary: 221.2 83.2% 53.3%;  /* #3B82F6 */
  --primary-foreground: 210 40% 98%;

  /* 피그마 Gray Scale */
  --gray-50: 0 0% 98%;
  --gray-100: 0 0% 96%;
  --gray-200: 0 0% 90%;
  --gray-300: 0 0% 83%;
  --gray-400: 0 0% 64%;
  --gray-500: 0 0% 45%;
  --gray-600: 0 0% 32%;
  --gray-700: 0 0% 25%;
  --gray-800: 0 0% 15%;
  --gray-900: 0 0% 9%;
}
```

### 5.2 커스텀 컴포넌트 수정

Shadcn-vue 컴포넌트는 `components/ui/` 폴더에 복사되므로 직접 수정 가능:

```vue
<!-- components/ui/button/Button.vue -->
<script setup lang="ts">
// 피그마 디자인에 맞게 variants 수정
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // 피그마 디자인에 맞는 커스텀 variant 추가
        brand: 'bg-brand text-white hover:bg-brand/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        // 피그마 사이즈에 맞게 조정
        xl: 'h-14 rounded-lg px-10 text-base',
      },
    },
  }
)
</script>
```

---

## 6. 참고 자료

- [Shadcn-vue 공식 문서](https://www.shadcn-vue.com)
- [Radix Vue](https://www.radix-vue.com) - 기반 라이브러리
- [Lucide Icons](https://lucide.dev) - 아이콘
- [Vee-validate](https://vee-validate.logaretm.com/v4/) - 폼 검증
- [Zod](https://zod.dev) - 스키마 검증

---

*최종 업데이트: 2025.01.02*
