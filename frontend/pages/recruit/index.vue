<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// 팀원 모집 목록 페이지
definePageMeta({
  layout: 'default',
})

useHead({
  title: '팀원 모집 - FLOWIT',
})

// 임시 모집 글 데이터
const recruitPosts = ref([
  {
    id: 1,
    title: '사이드 프로젝트 프론트엔드 개발자 모집',
    description: '주말마다 함께 사이드 프로젝트를 진행할 프론트엔드 개발자를 모집합니다.',
    author: '팀장A',
    techStack: ['React', 'TypeScript', 'Tailwind'],
    positions: ['프론트엔드'],
    currentMembers: 2,
    maxMembers: 4,
    deadline: '2025-01-15',
    views: 234,
    createdAt: '2025-01-02',
  },
  {
    id: 2,
    title: '포트폴리오용 풀스택 프로젝트 팀원 구합니다',
    description: '취업용 포트폴리오를 함께 만들 팀원을 모집합니다. 2개월 내 MVP 완성이 목표입니다.',
    author: '기획자B',
    techStack: ['Next.js', 'Node.js', 'PostgreSQL'],
    positions: ['백엔드', '프론트엔드'],
    currentMembers: 3,
    maxMembers: 5,
    deadline: '2025-01-20',
    views: 456,
    createdAt: '2025-01-01',
  },
  {
    id: 3,
    title: 'AI 기반 서비스 MVP 개발 팀 모집',
    description: 'AI를 활용한 서비스 MVP를 개발할 팀원을 모집합니다. 창업에 관심 있으신 분 환영!',
    author: '창업자C',
    techStack: ['Python', 'FastAPI', 'React'],
    positions: ['AI/ML', '백엔드'],
    currentMembers: 1,
    maxMembers: 4,
    deadline: '2025-01-25',
    views: 678,
    createdAt: '2024-12-30',
  },
])

// 포지션 필터
const positionFilters = ['전체', '프론트엔드', '백엔드', '풀스택', 'AI/ML', '기획', '디자인']
const selectedPosition = ref('전체')
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">팀원 모집</h1>
        <p class="text-muted-foreground mt-1">함께 프로젝트를 진행할 팀원을 찾아보세요</p>
      </div>
      <Button>
        <Icon icon="heroicons:pencil" class="w-4 h-4 mr-2" />
        모집글 작성
      </Button>
    </div>

    <!-- 포지션 필터 -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
      <button
        v-for="position in positionFilters"
        :key="position"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        :class="selectedPosition === position
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'"
        @click="selectedPosition = position"
      >
        {{ position }}
      </button>
    </div>

    <!-- 모집글 목록 -->
    <div class="grid md:grid-cols-2 gap-4">
      <Card v-for="recruit in recruitPosts" :key="recruit.id" class="hover:border-primary/50 transition-colors">
        <CardContent class="p-5">
          <!-- 제목 -->
          <h3 class="font-medium text-foreground text-lg mb-2 hover:text-primary cursor-pointer line-clamp-2">
            {{ recruit.title }}
          </h3>

          <!-- 설명 -->
          <p class="text-muted-foreground text-sm line-clamp-2 mb-4">
            {{ recruit.description }}
          </p>

          <!-- 기술 스택 -->
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span
              v-for="tech in recruit.techStack"
              :key="tech"
              class="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
            >
              {{ tech }}
            </span>
          </div>

          <!-- 모집 포지션 -->
          <div class="flex flex-wrap gap-1.5 mb-4">
            <span
              v-for="position in recruit.positions"
              :key="position"
              class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium"
            >
              {{ position }}
            </span>
          </div>

          <!-- 메타 정보 -->
          <div class="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:users" class="w-4 h-4" />
                {{ recruit.currentMembers }}/{{ recruit.maxMembers }}명
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:eye" class="w-4 h-4" />
                {{ recruit.views }}
              </span>
            </div>
            <span class="text-xs">
              마감: {{ recruit.deadline }}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
