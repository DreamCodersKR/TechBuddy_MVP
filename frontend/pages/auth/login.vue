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
})

// 폼 상태
const state = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const errorMessage = ref('')

// 폼 검증
function validateForm() {
  errors.email = ''
  errors.password = ''

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

// 로그인 처리
async function onSubmit() {
  errorMessage.value = ''

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    await authStore.login({
      email: state.email,
      password: state.password,
    })

    // 앱 메인으로 이동
    navigateTo('/')
  }
  catch (error: unknown) {
    const apiError = error as { data?: { message?: string | string[] } }
    const message = apiError?.data?.message || '로그인에 실패했습니다'
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
        로그인
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        FLOWIT에 오신 것을 환영합니다
      </p>
    </div>

    <!-- 에러 메시지 -->
    <div
      v-if="errorMessage"
      class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm"
    >
      {{ errorMessage }}
    </div>

    <!-- 로그인 폼 -->
    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="space-y-2">
        <Label for="email">이메일</Label>
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
        <Label for="password">비밀번호</Label>
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

      <Button
        type="submit"
        class="w-full"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          로그인 중...
        </span>
        <span v-else>로그인</span>
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

    <!-- 회원가입 링크 -->
    <p class="text-center text-sm text-muted-foreground">
      아직 계정이 없으신가요?
      <NuxtLink
        to="/auth/signup"
        class="font-medium text-primary hover:text-primary/80 transition-colors"
      >
        회원가입
      </NuxtLink>
    </p>
  </div>
</template>
