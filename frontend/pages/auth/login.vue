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
})

type Schema = z.output<typeof schema>

// 폼 상태
const state = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)

// 로그인 처리
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true

  try {
    await authStore.login({
      email: event.data.email,
      password: event.data.password,
    })

    toast.add({
      title: '로그인 성공',
      description: '환영합니다!',
      color: 'green',
    })

    // 앱 메인으로 이동
    navigateTo('/app')
  } catch (error: any) {
    const message = error?.data?.message || '로그인에 실패했습니다'
    toast.add({
      title: '로그인 실패',
      description: Array.isArray(message) ? message[0] : message,
      color: 'red',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- 헤더 -->
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        로그인
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        TechBuddy에 오신 것을 환영합니다
      </p>
    </div>

    <!-- 로그인 폼 -->
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="이메일" name="email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="example@email.com"
          icon="i-heroicons-envelope"
          size="lg"
        />
      </UFormField>

      <UFormField label="비밀번호" name="password">
        <UInput
          v-model="state.password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          icon="i-heroicons-lock-closed"
          size="lg"
        />
      </UFormField>

      <UButton
        type="submit"
        block
        size="lg"
        :loading="isLoading"
      >
        로그인
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

    <!-- 회원가입 링크 -->
    <p class="text-center text-sm text-gray-600 dark:text-gray-400">
      아직 계정이 없으신가요?
      <NuxtLink
        to="/auth/signup"
        class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
      >
        회원가입
      </NuxtLink>
    </p>
  </div>
</template>
