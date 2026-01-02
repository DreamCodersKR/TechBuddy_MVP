<script setup lang="ts">
// 기본 레이아웃 - 상단 네비게이션 + 서브탭 + 푸터
// 커뮤니티, Q&A, 팀원모집 등 메인 페이지에서 사용

const route = useRoute()

// 서브 네비게이션을 보여줄 경로들 (메인 페이지 제외)
const showSubNavPaths = ['/community', '/qna', '/recruit']

// 현재 경로가 서브 네비게이션을 보여줘야 하는지 확인
const shouldShowSubNav = computed(() => {
  return showSubNavPaths.some(path => {
    return route.path === path || route.path.startsWith(`${path}/`)
  })
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- 상단 네비게이션 -->
    <LayoutTheNavbar />

    <!-- 서브 네비게이션 (커뮤니티 관련 페이지에서만) -->
    <LayoutTheSubNav v-if="shouldShowSubNav" />

    <!-- 메인 컨텐츠 -->
    <main class="flex-1 pb-20">
      <slot />
    </main>

    <!-- 푸터 -->
    <LayoutTheFooter />
  </div>
</template>
