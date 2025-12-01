<script setup lang="ts">
// 인증 페이지용 레이아웃 (중앙 정렬)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- 로고 -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">TechBuddy</span>
        </NuxtLink>
      </div>

      <!-- 폼 컨테이너 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <slot />
      </div>

      <!-- 하단 링크 -->
      <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <NuxtLink to="/" class="hover:text-primary-600 dark:hover:text-primary-400">
          &larr; 홈으로 돌아가기
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
