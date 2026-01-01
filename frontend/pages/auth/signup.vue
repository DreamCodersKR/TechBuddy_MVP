<script setup lang="ts">
import { z } from 'zod'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'auth',
})

const config = useRuntimeConfig()
const authStore = useAuthStore()

// OAuth 로그인 핸들러
const loginWithGoogle = () => {
  window.location.href = `${config.public.apiBaseUrl}/auth/google`
}

const loginWithGitHub = () => {
  window.location.href = `${config.public.apiBaseUrl}/auth/github`
}

// 폼 스키마 정의
const schema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  name: z.string().min(1, '이름을 입력해주세요'),
  nickname: z.string().optional(),
}).refine(data => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
})

// 폼 상태
const state = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
})

const errors = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
})

const isLoading = ref(false)
const errorMessage = ref('')

// 폼 검증
function validateForm() {
  // Reset errors
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ''
  })

  const result = schema.safeParse(state)

  if (!result.success) {
    result.error.errors.forEach((err) => {
      const field = err.path[0] as keyof typeof errors
      if (field in errors) {
        errors[field] = err.message
      }
    })
    return false
  }
  return true
}

// 회원가입 처리
async function onSubmit() {
  errorMessage.value = ''

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    await authStore.signup({
      email: state.email,
      password: state.password,
      name: state.name,
      nickname: state.nickname || undefined,
    })

    // 앱 메인으로 이동
    navigateTo('/')
  }
  catch (error: unknown) {
    const apiError = error as { data?: { message?: string | string[] } }
    const message = apiError?.data?.message || '회원가입에 실패했습니다'
    errorMessage.value = Array.isArray(message) ? message[0] : message
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- 헤더 -->
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-foreground">
        회원가입
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        FLOWIT과 함께 성장하세요
      </p>
    </div>

    <!-- 에러 메시지 -->
    <div
      v-if="errorMessage"
      class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm"
    >
      {{ errorMessage }}
    </div>

    <!-- 회원가입 폼 -->
    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="space-y-2">
        <Label for="email">이메일 <span class="text-destructive">*</span></Label>
        <Input
          id="email"
          v-model="state.email"
          type="email"
          placeholder="example@email.com"
          :class="{ 'border-destructive': errors.email }"
        />
        <p v-if="errors.email" class="text-sm text-destructive">
          {{ errors.email }}
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="password">비밀번호 <span class="text-destructive">*</span></Label>
          <span class="text-xs text-muted-foreground">최소 8자 이상</span>
        </div>
        <Input
          id="password"
          v-model="state.password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          :class="{ 'border-destructive': errors.password }"
        />
        <p v-if="errors.password" class="text-sm text-destructive">
          {{ errors.password }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="passwordConfirm">비밀번호 확인 <span class="text-destructive">*</span></Label>
        <Input
          id="passwordConfirm"
          v-model="state.passwordConfirm"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          :class="{ 'border-destructive': errors.passwordConfirm }"
        />
        <p v-if="errors.passwordConfirm" class="text-sm text-destructive">
          {{ errors.passwordConfirm }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="name">이름 <span class="text-destructive">*</span></Label>
        <Input
          id="name"
          v-model="state.name"
          type="text"
          placeholder="이름을 입력하세요"
          :class="{ 'border-destructive': errors.name }"
        />
        <p v-if="errors.name" class="text-sm text-destructive">
          {{ errors.name }}
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between">
          <Label for="nickname">닉네임</Label>
          <span class="text-xs text-muted-foreground">선택사항</span>
        </div>
        <Input
          id="nickname"
          v-model="state.nickname"
          type="text"
          placeholder="닉네임을 입력하세요"
        />
      </div>

      <Button
        type="submit"
        class="w-full mt-6"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          회원가입 중...
        </span>
        <span v-else>회원가입</span>
      </Button>
    </form>

    <!-- 구분선 -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-border" />
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-background text-muted-foreground">또는</span>
      </div>
    </div>

    <!-- OAuth 소셜 로그인 버튼 -->
    <div class="space-y-3">
      <Button
        type="button"
        variant="outline"
        class="w-full"
        @click="loginWithGoogle"
      >
        <Icon icon="logos:google-icon" width="20" height="20" class="mr-2" />
        Google로 계속하기
      </Button>

      <Button
        type="button"
        variant="outline"
        class="w-full"
        @click="loginWithGitHub"
      >
        <Icon icon="mdi:github" width="22" height="22" class="mr-2" />
        GitHub로 계속하기
      </Button>
    </div>

    <!-- 구분선 -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-border" />
      </div>
    </div>

    <!-- 로그인 링크 -->
    <p class="text-center text-sm text-muted-foreground">
      이미 계정이 있으신가요?
      <NuxtLink
        to="/auth/login"
        class="font-medium text-primary hover:text-primary/80 transition-colors"
      >
        로그인
      </NuxtLink>
    </p>
  </div>
</template>
