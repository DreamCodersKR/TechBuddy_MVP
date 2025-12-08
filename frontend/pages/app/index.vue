<script setup lang="ts">
// 앱 홈 페이지 = 커뮤니티 메인
definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

const authStore = useAuthStore()

// 커뮤니티로 리다이렉트 (앱 홈 = 커뮤니티)
// 또는 대시보드 형태로 보여줄 수도 있음
</script>

<template>
  <div>
    <!-- 환영 메시지 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-2">
        안녕하세요, {{ authStore.currentUser?.name || '사용자' }}님!
      </h1>
      <p class="text-gray-400">
        TechBuddy 커뮤니티에 오신 것을 환영합니다.
      </p>
    </div>

    <!-- 퀵 액션 카드 -->
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <!-- 커뮤니티 -->
      <NuxtLink
        to="/app/community"
        class="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500 transition-colors group"
      >
        <div class="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600/30 transition-colors">
          <UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6 text-indigo-400" />
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">커뮤니티</h3>
        <p class="text-sm text-gray-400">
          인사이트를 나누고 네트워크를 넓히세요
        </p>
      </NuxtLink>

      <!-- 프로젝트 -->
      <NuxtLink
        to="/app/projects"
        class="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500 transition-colors group"
      >
        <div class="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600/30 transition-colors">
          <UIcon name="i-heroicons-folder" class="w-6 h-6 text-green-400" />
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">프로젝트</h3>
        <p class="text-sm text-gray-400">
          팀을 구성하고 함께 만들어가세요
        </p>
      </NuxtLink>

      <!-- 멘토링 -->
      <div class="p-6 bg-gray-800/50 rounded-xl border border-gray-700/50 opacity-60 cursor-not-allowed">
        <div class="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
          <UIcon name="i-heroicons-academic-cap" class="w-6 h-6 text-gray-500" />
        </div>
        <div class="flex items-center gap-2 mb-2">
          <h3 class="text-lg font-semibold text-gray-400">멘토링</h3>
          <span class="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-500">Coming Soon</span>
        </div>
        <p class="text-sm text-gray-500">
          현직자에게 조언을 받아보세요
        </p>
      </div>
    </div>

    <!-- 최근 활동 (추후 구현) -->
    <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-white mb-4">최근 활동</h2>
      <div class="text-center py-8 text-gray-500">
        <UIcon name="i-heroicons-clock" class="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p>아직 활동 내역이 없습니다.</p>
        <p class="text-sm mt-1">커뮤니티에서 첫 게시글을 작성해보세요!</p>
      </div>
    </div>
  </div>
</template>
