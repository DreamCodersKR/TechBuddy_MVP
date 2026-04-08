<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '관리자 대시보드 - FLOWIT' })

const { get: authGet, patch: authPatch } = useAuthFetch()

interface Stats {
  users: { total: number; newToday: number; byPlan: Record<string, number> }
  content: { posts: number; agoraQuestions: number; aiConversations: number }
  operations: { openInquiries: number; pendingReports: number }
}

interface PinnedPost {
  id: string
  title: string
  isPinned: boolean
  createdAt: string
  author: { nickname: string | null; name: string }
}

const stats = ref<Stats | null>(null)
const loading = ref(true)
const recentPosts = ref<PinnedPost[]>([])
const postsLoading = ref(false)

async function loadStats() {
  try {
    stats.value = await authGet<Stats>('/admin/stats')
  }
  finally { loading.value = false }
}

async function loadRecentPosts() {
  postsLoading.value = true
  try {
    const res = await authGet<{ data: PinnedPost[] }>('/posts?limit=10&sortBy=createdAt&order=desc')
    recentPosts.value = res.data
  }
  catch { recentPosts.value = [] }
  finally { postsLoading.value = false }
}

async function togglePin(post: PinnedPost) {
  try {
    const res = await authPatch<{ id: string; isPinned: boolean }>(`/posts/${post.id}/pin`, {})
    post.isPinned = res.isPinned
  }
  catch { alert('핀 변경에 실패했습니다') }
}

onMounted(async () => {
  await Promise.all([loadStats(), loadRecentPosts()])
})
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
      <div class="bg-background rounded-xl border border-border p-5 mb-6">
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

      <!-- 공지사항 핀 관리 -->
      <div class="bg-background rounded-xl border border-border p-5">
        <h2 class="text-sm font-semibold text-foreground mb-4">📌 공지사항 핀 관리 <span class="text-xs text-muted-foreground font-normal ml-1">(최근 게시글 10개)</span></h2>
        <div v-if="postsLoading" class="flex items-center justify-center h-20">
          <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
        <ul v-else class="divide-y divide-border">
          <li v-for="post in recentPosts" :key="post.id" class="flex items-center gap-3 py-2.5" :class="post.isPinned ? 'bg-amber-50/50 dark:bg-amber-950/20 -mx-5 px-5' : ''">
            <span class="text-sm flex-1 truncate">
              <span v-if="post.isPinned" class="mr-1">📌</span>
              <NuxtLink :to="`/community/${post.id}`" class="hover:text-primary transition-colors">{{ post.title }}</NuxtLink>
            </span>
            <span class="text-xs text-muted-foreground shrink-0">{{ post.author.nickname ?? post.author.name }}</span>
            <Button
              size="sm"
              :variant="post.isPinned ? 'destructive' : 'outline'"
              class="shrink-0 h-7 text-xs"
              @click="togglePin(post)"
            >
              {{ post.isPinned ? '핀 해제' : '핀 고정' }}
            </Button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
