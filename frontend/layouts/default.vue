<script setup lang="ts">
// 기본 레이아웃 - 상단 네비게이션 + 서브탭 + 카테고리탭 + 푸터
// 커뮤니티, Q&A, 팀원모집 등 메인 페이지에서 사용

const route = useRoute()

// 현재 경로가 서브 네비게이션을 보여줘야 하는지 확인
const shouldShowSubNav = computed(() => {
  // 메인 페이지는 정확히 '/'일 때만
  if (route.path === '/') return true
  // 나머지는 해당 경로로 시작하면 표시
  return ['/community', '/qna', '/recruit'].some(path => {
    return route.path === path || route.path.startsWith(`${path}/`)
  })
})

// 카테고리 네비게이션을 보여줄 경로들 (게시판에서만)
const shouldShowCategoryNav = computed(() => {
  return route.path === '/community' || route.path.startsWith('/community/')
})
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- 상단 네비게이션 (항상 최상단 고정) -->
    <LayoutTheNavbar />

    <!-- 서브 네비게이션 + 카테고리 네비게이션 (스크롤 시 상단에 sticky) -->
    <div
      v-if="shouldShowSubNav"
      class="sticky top-0 z-40 bg-background"
    >
      <!-- 서브 네비게이션 (게시판 | Q&A | 팀원 모집) -->
      <LayoutTheSubNav />

      <!-- 카테고리 네비게이션 (게시판에서만: 전체 | 자유 | 취업/진로 | AI) -->
      <LayoutTheCategoryNav v-if="shouldShowCategoryNav" />
    </div>

    <!-- 메인 컨텐츠 -->
    <main class="flex-1 pb-20">
      <slot />
    </main>

    <!-- 푸터 -->
    <LayoutTheFooter />
  </div>
</template>
