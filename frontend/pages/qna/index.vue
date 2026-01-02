<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Q&A 목록 페이지
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Q&A - FLOWIT',
})

// 임시 Q&A 데이터
const questions = ref([
  {
    id: 1,
    title: 'React와 Vue 중 어떤 걸 먼저 배워야 할까요?',
    content: '프론트엔드 개발을 시작하려는 초보자입니다. 어떤 프레임워크를 먼저 배우는 게 좋을까요?',
    author: '초보개발자',
    answers: 12,
    views: 456,
    createdAt: '2025-01-02',
    solved: false,
  },
  {
    id: 2,
    title: 'CS 지식 어디까지 공부해야 하나요?',
    content: '부트캠프 수료 후 취업 준비 중인데, CS 공부를 어느 정도까지 해야 할지 모르겠습니다.',
    author: '취준생A',
    answers: 8,
    views: 321,
    createdAt: '2025-01-01',
    solved: true,
  },
  {
    id: 3,
    title: '코딩테스트 준비 기간 어느정도가 적당할까요?',
    content: '취업 준비를 시작했는데, 코딩테스트에 얼마나 시간을 투자해야 할까요?',
    author: '예비개발자',
    answers: 15,
    views: 543,
    createdAt: '2024-12-30',
    solved: false,
  },
])

// 필터
const filters = ['전체', '미해결', '해결됨']
const selectedFilter = ref('전체')
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Q&A</h1>
        <p class="text-muted-foreground mt-1">궁금한 것을 물어보고 답변을 받아보세요</p>
      </div>
      <Button>
        <Icon icon="heroicons:pencil" class="w-4 h-4 mr-2" />
        질문하기
      </Button>
    </div>

    <!-- 필터 탭 -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
      <button
        v-for="filter in filters"
        :key="filter"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        :class="selectedFilter === filter
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'"
        @click="selectedFilter = filter"
      >
        {{ filter }}
      </button>
    </div>

    <!-- Q&A 목록 -->
    <div class="space-y-4">
      <Card v-for="question in questions" :key="question.id" class="hover:border-primary/50 transition-colors">
        <CardContent class="p-5">
          <div class="flex items-start gap-4">
            <!-- 해결 상태 -->
            <div
              class="flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center"
              :class="question.solved ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'"
            >
              <Icon
                :icon="question.solved ? 'heroicons:check-circle' : 'heroicons:question-mark-circle'"
                class="w-6 h-6 mb-1"
              />
              <span class="text-xs font-medium">
                {{ question.solved ? '해결' : '미해결' }}
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-foreground text-lg mb-2 hover:text-primary cursor-pointer">
                {{ question.title }}
              </h3>
              <p class="text-muted-foreground text-sm line-clamp-2 mb-3">
                {{ question.content }}
              </p>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ question.author }}</span>
                <span>{{ question.createdAt }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-bottom-center-text" class="w-4 h-4" />
                  답변 {{ question.answers }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ question.views }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
