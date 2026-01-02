<script setup lang="ts">
import { Icon } from '@iconify/vue'

// 인증 페이지용 레이아웃 (중앙 정렬) - 라이트 모드
</script>

<template>
  <div class="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- 로고 -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Icon icon="heroicons:square-3-stack-3d" class="h-6 w-6 text-primary-foreground" />
          </div>
          <span class="text-2xl font-bold text-foreground">FLOWIT</span>
        </NuxtLink>
      </div>

      <!-- 폼 컨테이너 -->
      <div class="bg-background rounded-xl border border-border p-8 shadow-sm">
        <slot />
      </div>

      <!-- 하단 링크 -->
      <div class="mt-6 text-center text-sm text-muted-foreground">
        <NuxtLink
          to="/"
          class="hover:text-foreground transition-colors"
        >
          &larr; 홈으로 돌아가기
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
