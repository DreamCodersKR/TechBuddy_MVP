<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '관리자 대시보드 - FLOWIT' })

const { get: authGet } = useAuthFetch()

interface Stats {
  users: { total: number; newToday: number; byPlan: Record<string, number> }
  content: { posts: number; agoraQuestions: number; aiConversations: number }
  operations: { openInquiries: number; pendingReports: number }
}

const stats = ref<Stats | null>(null)
const loading = ref(true)

async function loadStats() {
  try {
    stats.value = await authGet<Stats>('/admin/stats')
  }
  finally { loading.value = false }
}

onMounted(loadStats)
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-foreground mb-6">대시보드</h1>

    <div v-if="loading" class="flex items-center justify-center h-40">
      <Icon icon="heroicons:arrow-path" class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <template v-else-if="stats">
      <!-- 요약 카드 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-background rounded-xl border border-border p-4">
          <p class="text-xs text-muted-foreground">전체 회원</p>
          <p class="text-2xl font-bold text-foreground mt-1">{{ stats.users.total.toLocaleString() }}</p>
          <p class="text-xs text-emerald-500 mt-1">오늘 +{{ stats.users.newToday }}</p>
        </div>
        <div class="bg-background rounded-xl border border-border p-4">
          <p class="text-xs text-muted-foreground">플랜 분포</p>
          <p class="text-sm font-medium text-foreground mt-2 space-y-0.5">
            <span class="block">FREE: {{ stats.users.byPlan.FREE ?? 0 }}</span>
            <span class="block text-blue-500">PRO: {{ stats.users.byPlan.PRO ?? 0 }}</span>
            <span class="block text-violet-500">PREMIUM: {{ stats.users.byPlan.PREMIUM ?? 0 }}</span>
          </p>
        </div>
        <div class="bg-background rounded-xl border border-border p-4">
          <p class="text-xs text-muted-foreground">미처리 문의</p>
          <p class="text-2xl font-bold mt-1" :class="stats.operations.openInquiries > 0 ? 'text-amber-500' : 'text-foreground'">
            {{ stats.operations.openInquiries }}
          </p>
          <NuxtLink to="/admin/inquiries" class="text-xs text-primary mt-1 inline-block">처리하기 →</NuxtLink>
        </div>
        <div class="bg-background rounded-xl border border-border p-4">
          <p class="text-xs text-muted-foreground">대기 중 신고</p>
          <p class="text-2xl font-bold mt-1" :class="stats.operations.pendingReports > 0 ? 'text-red-500' : 'text-foreground'">
            {{ stats.operations.pendingReports }}
          </p>
          <NuxtLink to="/admin/reports" class="text-xs text-primary mt-1 inline-block">처리하기 →</NuxtLink>
        </div>
      </div>

      <!-- 서비스 사용 통계 -->
      <div class="bg-background rounded-xl border border-border p-5">
        <h2 class="text-sm font-semibold text-foreground mb-4">서비스 사용 현황</h2>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">{{ stats.content.posts.toLocaleString() }}</p>
            <p class="text-xs text-muted-foreground mt-1">커뮤니티 게시글</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">{{ stats.content.agoraQuestions.toLocaleString() }}</p>
            <p class="text-xs text-muted-foreground mt-1">아고라 질문</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">{{ stats.content.aiConversations.toLocaleString() }}</p>
            <p class="text-xs text-muted-foreground mt-1">AI 멘토링 대화</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
