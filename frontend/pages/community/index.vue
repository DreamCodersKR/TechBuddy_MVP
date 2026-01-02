<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

// 게시판 목록 페이지
definePageMeta({
  layout: 'default',
})

useHead({
  title: '게시판 - FLOWIT',
})

const route = useRoute()

// 현재 선택된 카테고리 (쿼리 파라미터로 관리)
const selectedCategory = computed(() => {
  return (route.query.category as string) || 'all'
})

// 카테고리 라벨 매핑
const categoryLabels: Record<string, string> = {
  all: '전체',
  free: '자유',
  career: '취업/진로',
  ai: 'AI',
}

// 현재 카테고리 라벨
const currentCategoryLabel = computed(() => {
  return categoryLabels[selectedCategory.value] || '전체'
})

// 실시간 인기글 데이터
const popularPosts = ref([
  {
    id: 1,
    rank: 1,
    category: '자유',
    title: 'AI랑 일하기 재미있네요.',
    author: '사용자',
    time: '1시간',
    views: 12,
    comments: 6,
  },
  {
    id: 2,
    rank: 2,
    category: '취업/진로',
    title: '현업자분들의 진심 어린 답변 부탁드립니다.',
    author: '사용자',
    time: '1시간',
    views: 12,
    comments: 6,
  },
  {
    id: 3,
    rank: 3,
    category: 'AI',
    title: '개인적인 2026 AI 전망',
    author: '사용자',
    time: '1시간',
    views: 12,
    comments: 6,
  },
  {
    id: 4,
    rank: 4,
    category: '자유',
    title: 'LLM과 자연어로 대화하게 두지 마세요.',
    author: '사용자',
    time: '1시간',
    views: 12,
    comments: 6,
  },
  {
    id: 5,
    rank: 5,
    category: '자유',
    title: '포트폴리오 조언 부탁드립니다.',
    author: '사용자',
    time: '1시간',
    views: 12,
    comments: 6,
  },
])

// 전체글 데이터 (전체 카테고리용)
const allPosts = ref([
  { id: 1, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: true },
  { id: 2, category: '취업/진로', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: true },
  { id: 3, category: '기타', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 4, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 5, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 6, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 7, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 8, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
])

// 카테고리별 글 데이터
const categoryPosts = ref([
  { id: 1, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: true },
  { id: 2, category: '취업/진로', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: true },
  { id: 3, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 4, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 5, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 6, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 7, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 8, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 9, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 10, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 11, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 12, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 13, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 14, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 15, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 16, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 17, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 18, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 19, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 20, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
])

// 정렬 옵션
const sortOptions = ['최신순', '조회순', '댓글 많은 순']
const selectedSort = ref('조회순')

// 정렬 드롭다운 열림 상태
const isSortOpen = ref(false)
</script>

<template>
  <div class="container py-6">
    <!-- 전체 카테고리일 때 -->
    <template v-if="selectedCategory === 'all'">
      <!-- 게시판 소개 배너 -->
      <div class="bg-muted rounded-lg p-8 mb-8 text-center">
        <p class="text-muted-foreground">게시판 소개 배너</p>
      </div>

      <!-- 실시간 인기글 -->
      <section class="mb-10">
        <h2 class="text-lg font-bold text-foreground mb-4">실시간 인기글</h2>
        <div class="bg-card rounded-lg border border-border">
          <ul class="divide-y divide-border">
            <li
              v-for="post in popularPosts"
              :key="post.id"
              class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
            >
              <span class="text-sm font-bold text-primary w-4">{{ post.rank }}</span>
              <span class="text-sm text-muted-foreground">[{{ post.category }}]</span>
              <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ post.author }}</span>
                <span>{{ post.time }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ post.views }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                  {{ post.comments }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- 전체글 -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-foreground">전체글</h2>
          <div class="flex items-center gap-1 text-sm text-muted-foreground">
            <span>최신순</span>
            <Icon icon="heroicons:chevron-up" class="w-4 h-4" />
          </div>
        </div>

        <div class="bg-card rounded-lg border border-border">
          <ul class="divide-y divide-border">
            <li
              v-for="post in allPosts"
              :key="post.id"
              class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
            >
              <span class="text-sm text-muted-foreground">[{{ post.category }}]</span>
              <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
              <span v-if="post.isNew" class="text-xs font-bold text-destructive">N</span>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ post.author }}</span>
                <span>{{ post.time }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ post.views }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                  {{ post.comments }}
                </span>
              </div>
            </li>
          </ul>
        </div>

        <!-- 페이지네이션 -->
        <div class="flex items-center justify-center gap-2 mt-6">
          <Button variant="ghost" size="sm" disabled>
            <Icon icon="heroicons:chevron-left" class="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" class="font-bold text-foreground">1</Button>
          <Button variant="ghost" size="sm" class="text-muted-foreground">2</Button>
          <Button variant="ghost" size="sm" class="text-muted-foreground">3</Button>
          <span class="text-muted-foreground">...</span>
          <Button variant="ghost" size="sm" class="text-muted-foreground">12</Button>
          <Button variant="ghost" size="sm">
            <Icon icon="heroicons:chevron-right" class="w-4 h-4" />
          </Button>
        </div>
      </section>
    </template>

    <!-- 특정 카테고리 선택 시 (자유, 취업/진로, AI) -->
    <template v-else>
      <!-- 카테고리 헤더 -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-lg font-bold text-foreground">{{ currentCategoryLabel }}</h1>
        <!-- 정렬 드롭다운 -->
        <div class="relative">
          <button
            class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            @click="isSortOpen = !isSortOpen"
          >
            <span>{{ selectedSort }}</span>
            <Icon icon="heroicons:chevron-down" class="w-4 h-4" />
          </button>
          <!-- 드롭다운 메뉴 -->
          <div
            v-if="isSortOpen"
            class="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-10 min-w-[120px]"
          >
            <button
              v-for="option in sortOptions"
              :key="option"
              class="block w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
              :class="selectedSort === option ? 'text-foreground font-medium' : 'text-muted-foreground'"
              @click="selectedSort = option; isSortOpen = false"
            >
              {{ option }}
            </button>
          </div>
        </div>
      </div>

      <!-- 글 목록 -->
      <div class="bg-card rounded-lg border border-border">
        <ul class="divide-y divide-border">
          <li
            v-for="post in categoryPosts"
            :key="post.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <span class="text-sm text-muted-foreground">[{{ currentCategoryLabel }}]</span>
            <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
            <span v-if="post.isNew" class="text-xs font-bold text-destructive">N</span>
            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{{ post.author }}</span>
              <span>{{ post.time }}</span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:eye" class="w-4 h-4" />
                {{ post.views }}
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                {{ post.comments }}
              </span>
            </div>
          </li>
        </ul>
      </div>

      <!-- 페이지네이션 -->
      <div class="flex items-center justify-center gap-2 mt-6">
        <Button variant="ghost" size="sm" disabled>
          <Icon icon="heroicons:chevron-left" class="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" class="font-bold text-foreground">1</Button>
        <Button variant="ghost" size="sm" class="text-muted-foreground">2</Button>
        <Button variant="ghost" size="sm" class="text-muted-foreground">3</Button>
        <span class="text-muted-foreground">...</span>
        <Button variant="ghost" size="sm" class="text-muted-foreground">12</Button>
        <Button variant="ghost" size="sm">
          <Icon icon="heroicons:chevron-right" class="w-4 h-4" />
        </Button>
      </div>

      <!-- 글쓰기 버튼 (하단 고정) -->
      <div class="fixed bottom-6 right-6 z-40">
        <Button class="rounded-full shadow-lg px-6">
          <Icon icon="heroicons:pencil" class="mr-2 h-4 w-4" />
          {{ currentCategoryLabel }} 글쓰기
        </Button>
      </div>
    </template>
  </div>
</template>
