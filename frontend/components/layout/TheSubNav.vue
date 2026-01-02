<script setup lang="ts">
// 서브 네비게이션 (탭) - 커뮤니티 하위 메뉴
// 게시판 | Q&A | 팀원 모집

const route = useRoute()

// 서브 메뉴 아이템
// 게시판 = /community, Q&A = /qna, 팀원 모집 = /recruit
const subMenuItems = [
  { label: '게시판', to: '/community' },
  { label: 'Q&A', to: '/qna' },
  { label: '팀원 모집', to: '/recruit' },
]

// 현재 경로가 메뉴 아이템과 일치하는지 확인
function isActive(path: string) {
  // 메인 페이지(/)에서는 아무것도 선택하지 않음
  if (route.path === '/') {
    return false
  }
  // 해당 경로로 시작하면 활성화
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <div class="border-b border-border bg-background">
    <div class="container">
      <nav class="flex items-center gap-6 overflow-x-auto">
        <NuxtLink
          v-for="item in subMenuItems"
          :key="item.to"
          :to="item.to"
          class="relative py-3 text-sm font-medium transition-colors hover:text-foreground whitespace-nowrap"
          :class="isActive(item.to) ? 'text-foreground' : 'text-muted-foreground'"
        >
          {{ item.label }}
          <!-- Active indicator -->
          <span
            v-if="isActive(item.to)"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          />
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>
