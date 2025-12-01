<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <div class="max-w-4xl mx-auto">
      <!-- 헤더 -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          TechBuddy
        </h1>
        <UButton
          color="gray"
          variant="ghost"
          @click="authStore.logout()"
        >
          로그아웃
        </UButton>
      </div>

      <!-- 환영 메시지 -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            환영합니다, {{ authStore.currentUser?.name }}님!
          </h2>
        </template>

        <p class="text-gray-600 dark:text-gray-400">
          TechBuddy 커뮤니티에 오신 것을 환영합니다.
          곧 더 많은 기능이 추가될 예정입니다.
        </p>

        <template #footer>
          <div class="flex gap-4">
            <UBadge
              color="primary"
              variant="soft"
            >
              커뮤니티 (준비중)
            </UBadge>
            <UBadge
              color="gray"
              variant="soft"
            >
              프로젝트 (준비중)
            </UBadge>
            <UBadge
              color="gray"
              variant="soft"
            >
              멘토링 (준비중)
            </UBadge>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
