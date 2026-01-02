<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// 게시판 목록 페이지
definePageMeta({
  layout: 'default',
})

useHead({
  title: '게시판 - FLOWIT',
})

// 임시 게시글 데이터
const posts = ref([
  {
    id: 1,
    title: '신입 개발자 연봉 협상 팁 공유합니다',
    content: '면접 때 연봉 협상하는 방법에 대해 공유드립니다...',
    author: '개발자A',
    category: '자유게시판',
    views: 1234,
    comments: 56,
    createdAt: '2025-01-02',
  },
  {
    id: 2,
    title: '부트캠프 vs 국비지원, 솔직한 비교 후기',
    content: '둘 다 경험해본 입장에서 솔직하게 비교해봅니다...',
    author: '취준생B',
    category: '후기',
    views: 987,
    comments: 43,
    createdAt: '2025-01-01',
  },
  {
    id: 3,
    title: '포트폴리오에 꼭 넣어야 할 프로젝트 3가지',
    content: '현직 개발자가 추천하는 포트폴리오 프로젝트...',
    author: '시니어C',
    category: '팁/노하우',
    views: 876,
    comments: 32,
    createdAt: '2024-12-30',
  },
])

// 게시판 카테고리
const categories = ['전체', '자유게시판', '후기', '팁/노하우', '취업정보']
const selectedCategory = ref('전체')
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">게시판</h1>
        <p class="text-muted-foreground mt-1">자유롭게 인사이트를 나누세요</p>
      </div>
      <Button>
        <Icon icon="heroicons:pencil" class="w-4 h-4 mr-2" />
        글쓰기
      </Button>
    </div>

    <!-- 카테고리 탭 -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
      <button
        v-for="category in categories"
        :key="category"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        :class="selectedCategory === category
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'"
        @click="selectedCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <!-- 게시글 목록 -->
    <div class="space-y-4">
      <Card v-for="post in posts" :key="post.id" class="hover:border-primary/50 transition-colors">
        <CardContent class="p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                  {{ post.category }}
                </span>
              </div>
              <h3 class="font-medium text-foreground text-lg mb-2 hover:text-primary cursor-pointer">
                {{ post.title }}
              </h3>
              <p class="text-muted-foreground text-sm line-clamp-2 mb-3">
                {{ post.content }}
              </p>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ post.author }}</span>
                <span>{{ post.createdAt }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ post.views }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                  {{ post.comments }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
