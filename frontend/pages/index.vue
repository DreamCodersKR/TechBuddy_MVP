<script setup lang="ts">
import { Icon } from '@iconify/vue'

// 메인 페이지 = 커뮤니티 홈
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'FLOWIT - IT 커뮤니티 플랫폼',
  meta: [
    {
      name: 'description',
      content: 'IT 개발자를 위한 커뮤니티 플랫폼. 인사이트 공유, Q&A, 팀원 모집까지.',
    },
  ],
})

// 실시간 인기글 데이터
const popularPosts = ref([
  { id: 1, rank: 1, category: '자유', title: 'AI랑 일하기 재미있네요.', author: '사용자', time: '1시간', views: 12, comments: 6 },
  { id: 2, rank: 2, category: '취업/진로', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6 },
  { id: 3, rank: 3, category: 'AI', title: '개인적인 2026 AI 전망', author: '사용자', time: '1시간', views: 12, comments: 6 },
  { id: 4, rank: 4, category: '자유', title: 'LLM과 자연어로 대화하게 두지 마세요.', author: '사용자', time: '1시간', views: 12, comments: 6 },
  { id: 5, rank: 5, category: '자유', title: '포트폴리오 조언 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6 },
])

// 실시간 인기 Q&A 데이터
const popularQna = ref([
  { id: 1, rank: 1, category: '기술', title: 'AI랑 일하기 재미있네요.', author: '사용자', time: '1시간', views: 12, comments: 6 },
  { id: 2, rank: 2, category: '취업/진로', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6 },
  { id: 3, rank: 3, category: '기타', title: '개인적인 2026 AI 전망', author: '사용자', time: '1시간', views: 12, comments: 6 },
  { id: 4, rank: 4, category: '기술', title: 'LLM과 자연어로 대화하게 두지 마세요.', author: '사용자', time: '1시간', views: 12, comments: 6 },
  { id: 5, rank: 5, category: '기술', title: '포트폴리오 조언 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6 },
])

// 새로운 인사이트 데이터
const insightPosts = ref([
  { id: 1, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: true },
  { id: 2, category: '취업/진로', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: true },
  { id: 3, category: '기타', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 4, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 5, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 6, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 7, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 8, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 9, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 10, category: '자유', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
])
const insightPage = ref(1)

// 답변 대기 Q&A 데이터
const waitingQna = ref([
  { id: 1, category: '기술', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: true },
  { id: 2, category: '취업/진로', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: true },
  { id: 3, category: '기타', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 4, category: '기술', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 5, category: '기술', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 6, category: '기술', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 7, category: '기술', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 8, category: '기술', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 9, category: '기술', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
  { id: 10, category: '기술', title: '현업자분들의 진심 어린 답변 부탁드립니다.', author: '사용자', time: '1시간', views: 12, comments: 6, isNew: false },
])
const waitingPage = ref(1)

// 팀원 모집 데이터 (탭 없이 타입으로 구분)
const recruitPosts = ref([
  {
    id: 1,
    type: '프로젝트',
    title: '[백엔드, 프론트엔드 모집] 단기간에 서비스 출시 도전할 팀원 모집합니다!',
    deadline: '2025. 12. 24',
    dDay: 'D-8',
    duration: '9개월',
    views: 12,
    comments: 12,
    positions: ['프론트엔드', '백엔드'],
  },
  {
    id: 2,
    type: '스터디',
    title: '[백엔드, 프론트엔드 모집] 단기간에 서비스 출시 도전할 팀원 모집합니다!',
    deadline: '2025. 12. 24',
    dDay: '오늘 마감',
    duration: '9개월',
    views: 12,
    comments: 12,
    positions: ['프론트엔드', '백엔드'],
  },
  {
    id: 3,
    type: '프로젝트',
    title: '[백엔드, 프론트엔드 모집] 단기간에 서비스 출시 도전할 팀원 모집합니다!',
    deadline: '2025. 12. 24',
    dDay: '오늘 마감',
    duration: '9개월',
    views: 12,
    comments: 12,
    positions: ['프론트엔드', '백엔드'],
  },
  {
    id: 4,
    type: '프로젝트',
    title: '[백엔드, 프론트엔드 모집] 단기간에 서비스 출시 도전할 팀원 모집합니다!',
    deadline: '2025. 12. 24',
    dDay: '모집 마감',
    duration: '9개월',
    views: 12,
    comments: 12,
    positions: ['프론트엔드', '백엔드'],
  },
])

// D-day 스타일 클래스
function getDdayClass(dDay: string) {
  if (dDay === '모집 마감') return 'bg-muted text-muted-foreground'
  if (dDay === '오늘 마감') return 'bg-destructive/10 text-destructive'
  return 'bg-primary/10 text-primary'
}
</script>

<template>
  <div class="container py-8 space-y-12">
    <!-- 소개 배너 -->
    <section>
      <div class="bg-muted rounded-lg p-12 text-center">
        <p class="text-muted-foreground">소개 배너</p>
      </div>
    </section>

    <!-- 실시간 인기글 -->
    <section>
      <h2 class="text-lg font-bold text-foreground mb-4">실시간 인기글</h2>
      <div class="border border-border rounded-lg bg-card">
        <ul class="divide-y divide-border">
          <li
            v-for="post in popularPosts"
            :key="post.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <span
              class="flex-shrink-0 w-6 text-sm font-bold text-center"
              :class="post.rank <= 3 ? 'text-primary' : 'text-muted-foreground'"
            >
              {{ post.rank }}
            </span>
            <span class="flex-shrink-0 text-sm text-muted-foreground">[{{ post.category }}]</span>
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

    <!-- 실시간 인기 Q&A -->
    <section>
      <h2 class="text-lg font-bold text-foreground mb-4">실시간 인기 Q&A</h2>
      <div class="border border-border rounded-lg bg-card">
        <ul class="divide-y divide-border">
          <li
            v-for="qna in popularQna"
            :key="qna.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <span
              class="flex-shrink-0 w-6 text-sm font-bold text-center"
              :class="qna.rank <= 3 ? 'text-primary' : 'text-muted-foreground'"
            >
              {{ qna.rank }}
            </span>
            <span class="flex-shrink-0 text-sm text-muted-foreground">[{{ qna.category }}]</span>
            <span class="flex-1 text-sm text-foreground truncate">{{ qna.title }}</span>
            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{{ qna.author }}</span>
              <span>{{ qna.time }}</span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:eye" class="w-4 h-4" />
                {{ qna.views }}
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                {{ qna.comments }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- 새로운 인사이트를 얻어가세요 -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-foreground">새로운 인사이트를 얻어가세요</h2>
        <NuxtLink to="/community" class="text-sm text-muted-foreground hover:text-foreground">
          더보기 >
        </NuxtLink>
      </div>
      <div class="border border-border rounded-lg bg-card">
        <ul class="divide-y divide-border">
          <li
            v-for="post in insightPosts"
            :key="post.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <span class="flex-shrink-0 text-sm text-muted-foreground">[{{ post.category }}]</span>
            <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
            <span v-if="post.isNew" class="flex-shrink-0 text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">N</span>
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
      <div class="flex justify-center gap-1 mt-6">
        <button
          v-for="page in 4"
          :key="page"
          class="w-8 h-8 rounded text-sm font-medium transition-colors"
          :class="insightPage === page ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent'"
          @click="insightPage = page"
        >
          {{ page }}
        </button>
      </div>
    </section>

    <!-- 현재 답변을 기다리고 있어요 -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-foreground">현재 답변을 기다리고 있어요</h2>
        <NuxtLink to="/qna" class="text-sm text-muted-foreground hover:text-foreground">
          더보기 >
        </NuxtLink>
      </div>
      <div class="border border-border rounded-lg bg-card">
        <ul class="divide-y divide-border">
          <li
            v-for="qna in waitingQna"
            :key="qna.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <span class="flex-shrink-0 text-sm text-muted-foreground">[{{ qna.category }}]</span>
            <span class="flex-1 text-sm text-foreground truncate">{{ qna.title }}</span>
            <span v-if="qna.isNew" class="flex-shrink-0 text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">N</span>
            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{{ qna.author }}</span>
              <span>{{ qna.time }}</span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:eye" class="w-4 h-4" />
                {{ qna.views }}
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                {{ qna.comments }}
              </span>
            </div>
          </li>
        </ul>
      </div>
      <!-- 페이지네이션 -->
      <div class="flex justify-center gap-1 mt-6">
        <button
          v-for="page in 4"
          :key="page"
          class="w-8 h-8 rounded text-sm font-medium transition-colors"
          :class="waitingPage === page ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent'"
          @click="waitingPage = page"
        >
          {{ page }}
        </button>
      </div>
    </section>

    <!-- 프로젝트 기능 소개 배너 -->
    <section>
      <div class="bg-amber-50 rounded-lg p-12 text-center">
        <p class="text-amber-800">프로젝트 기능 소개 배너</p>
      </div>
    </section>

    <!-- 지금, 함께 할 개발자를 찾고 있어요 -->
    <section>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-foreground">지금, 함께 할 개발자를 찾고 있어요</h2>
        <NuxtLink to="/recruit" class="text-sm text-muted-foreground hover:text-foreground">
          더보기 >
        </NuxtLink>
      </div>

      <!-- 모집 카드 그리드 -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="recruit in recruitPosts"
          :key="recruit.id"
          class="border border-border rounded-lg bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer"
        >
          <!-- 타입 배지 + D-day -->
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium">
              {{ recruit.type }}
            </span>
          </div>

          <!-- 마감일 + D-day -->
          <div class="flex items-center justify-between text-xs mb-2">
            <span class="text-muted-foreground">마감일 {{ recruit.deadline }}</span>
            <span
              class="px-2 py-0.5 rounded font-medium"
              :class="getDdayClass(recruit.dDay)"
            >
              {{ recruit.dDay }}
            </span>
          </div>

          <!-- 제목 -->
          <p class="text-sm text-foreground line-clamp-2 mb-3 leading-relaxed">{{ recruit.title }}</p>

          <!-- 프로젝트 기간 -->
          <p class="text-xs text-muted-foreground mb-3">프로젝트 기간 {{ recruit.duration }}</p>

          <!-- 조회수/댓글 + 포지션 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:eye" class="w-3 h-3" />
                {{ recruit.views }}
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:chat-bubble-left" class="w-3 h-3" />
                {{ recruit.comments }}
              </span>
            </div>
            <div class="flex gap-1">
              <span
                v-for="position in recruit.positions"
                :key="position"
                class="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded"
              >
                {{ position }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
