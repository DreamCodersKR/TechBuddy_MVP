<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'auth',
})

const authStore = useAuthStore()
const toast = useToast()

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

type Schema = z.output<typeof schema>

// 폼 상태
const state = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
})

const isLoading = ref(false)

// 회원가입 처리
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true

  try {
    await authStore.signup({
      email: event.data.email,
      password: event.data.password,
      name: event.data.name,
      nickname: event.data.nickname || undefined,
    })

    toast.add({
      title: '회원가입 완료',
      description: '환영합니다! TechBuddy에 가입되었습니다.',
      color: 'success',
    })

    // 앱 메인으로 이동
    navigateTo('/app')
  }
  catch (error: unknown) {
    const apiError = error as { data?: { message?: string | string[] } }
    const message = apiError?.data?.message || '회원가입에 실패했습니다'
    toast.add({
      title: '회원가입 실패',
      description: Array.isArray(message) ? message[0] : message,
      color: 'error',
    })
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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        회원가입
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        TechBuddy와 함께 성장하세요
      </p>
    </div>

    <!-- 회원가입 폼 -->
    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        label="이메일"
        name="email"
        required
      >
        <UInput
          v-model="state.email"
          type="email"
          placeholder="example@email.com"
          icon="i-heroicons-envelope"
          size="lg"
        />
      </UFormField>

      <UFormField
        label="비밀번호"
        name="password"
        required
        hint="최소 8자 이상"
      >
        <UInput
          v-model="state.password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          icon="i-heroicons-lock-closed"
          size="lg"
        />
      </UFormField>

      <UFormField
        label="비밀번호 확인"
        name="passwordConfirm"
        required
      >
        <UInput
          v-model="state.passwordConfirm"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          icon="i-heroicons-lock-closed"
          size="lg"
        />
      </UFormField>

      <UFormField
        label="이름"
        name="name"
        required
      >
        <UInput
          v-model="state.name"
          type="text"
          placeholder="이름을 입력하세요"
          icon="i-heroicons-user"
          size="lg"
        />
      </UFormField>

      <UFormField
        label="닉네임"
        name="nickname"
        hint="선택사항"
      >
        <UInput
          v-model="state.nickname"
          type="text"
          placeholder="닉네임을 입력하세요"
          icon="i-heroicons-at-symbol"
          size="lg"
        />
      </UFormField>

      <UButton
        type="submit"
        block
        size="lg"
        :loading="isLoading"
        class="mt-6"
      >
        회원가입
      </UButton>
    </UForm>

    <!-- 구분선 -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">또는</span>
      </div>
    </div>

    <!-- 로그인 링크 -->
    <p class="text-center text-sm text-gray-600 dark:text-gray-400">
      이미 계정이 있으신가요?
      <NuxtLink
        to="/auth/login"
        class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
      >
        로그인
      </NuxtLink>
    </p>
  </div>
</template>
