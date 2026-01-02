<script setup lang="ts">
// 카테고리 네비게이션 (3단계) - 게시판 카테고리 탭
// 전체 | 자유 | 취업/진로 | AI

const route = useRoute()

// 현재 선택된 카테고리 (쿼리 파라미터로 관리)
const selectedCategory = computed(() => {
  return (route.query.category as string) || 'all'
})

// 게시판 카테고리 메뉴
const categoryItems = [
  { label: '전체', value: 'all' },
  { label: '자유', value: 'free' },
  { label: '취업/진로', value: 'career' },
  { label: 'AI', value: 'ai' },
]

// 카테고리가 활성화되었는지 확인
function isActive(value: string) {
  return selectedCategory.value === value
}

// 카테고리 클릭 시 쿼리 파라미터 업데이트
function handleCategoryClick(value: string) {
  navigateTo({
    path: route.path,
    query: value === 'all' ? {} : { category: value },
  })
}
</script>

<template>
  <div class="border-b border-border bg-background">
    <div class="container">
      <nav class="flex items-center gap-6 overflow-x-auto">
        <button
          v-for="item in categoryItems"
          :key="item.value"
          class="relative py-2.5 text-sm font-medium transition-colors hover:text-foreground whitespace-nowrap"
          :class="isActive(item.value) ? 'text-foreground' : 'text-muted-foreground'"
          @click="handleCategoryClick(item.value)"
        >
          {{ item.label }}
          <!-- Active indicator -->
          <span
            v-if="isActive(item.value)"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          />
        </button>
      </nav>
    </div>
  </div>
</template>
