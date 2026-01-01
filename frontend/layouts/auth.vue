<script setup lang="ts">
// 인증 페이지용 레이아웃 (중앙 정렬) - 다크 테마
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- 로고 -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2"
        >
          <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
            FL
          </div>
          <span class="text-2xl font-bold text-white">FLOWIT</span>
        </NuxtLink>
      </div>

      <!-- 폼 컨테이너 -->
      <div class="bg-gray-900 rounded-xl border border-gray-800 p-8">
        <slot />
      </div>

      <!-- 하단 링크 -->
      <div class="mt-6 text-center text-sm text-gray-500">
        <NuxtLink
          to="/"
          class="hover:text-white transition-colors"
        >
          &larr; 홈으로 돌아가기
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
