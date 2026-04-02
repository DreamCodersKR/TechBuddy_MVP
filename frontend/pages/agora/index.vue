<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default' })

useHead({ title: '아고라 - FLOWIT' })

const route = useRoute()
const authStore = useAuthStore()
const config = useRuntimeConfig()

// ─── 타입 ────────────────────────────────────────────────
interface AgoraListItem {
  id: string
  title: string
  content: string
  bounty: number
  status: 'OPEN' | 'CLOSED'
  viewCount: number
  createdAt: string
  author: { id: string; name: string; nickname: string | null; avatarUrl: string | null }
  _count: { answers: number }
}

// ─── 상태 ────────────────────────────────────────────────
const tab = ref<'all' | 'OPEN' | 'CLOSED'>((route.query.tab as 'all' | 'OPEN' | 'CLOSED') || 'all')
const sortBy = ref<'latest' | 'bounty' | 'answers'>('latest')
const items = ref<AgoraListItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(false)

// ─── 정렬 ────────────────────────────────────────────────
const sortedItems = computed(() => {
  const list = [...items.value]
  if (sortBy.value === 'bounty') return list.sort((a, b) => b.bounty - a.bounty)
  if (sortBy.value === 'answers') return list.sort((a, b) => b._count.answers - a._count.answers)
  return list
})

const totalPages = computed(() => Math.ceil(total.value / limit))

// ─── 데이터 패칭 ─────────────────────────────────────────
async function fetchList(p = 1) {
  loading.value = true
  page.value = p
  try {
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (tab.value !== 'all') params.set('status', tab.value)
    const res = await $fetch<{
      data: AgoraListItem[]
      meta: { total: number; page: number; limit: number; totalPages: number }
    }>(`${config.public.apiBaseUrl}/agora?${params}`)
    items.value = res.data
    total.value = res.meta.total
  }
  catch {
    items.value = []
    total.value = 0
  }
  finally {
    loading.value = false
  }
}

watch(tab, () => {
  navigateTo({ query: tab.value !== 'all' ? { tab: tab.value } : {} })
  fetchList(1)
})

await fetchList(1)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">아고라</h1>
        <p class="text-muted-foreground text-sm mt-1">크레딧을 걸고 현실적인 답변을 얻어보세요</p>
      </div>
      <Button v-if="authStore.isAuthenticated" @click="navigateTo('/agora/write')">
        <Icon icon="heroicons:pencil" class="w-4 h-4 mr-2" />
        질문 작성
      </Button>
    </div>

    <!-- 탭 + 정렬 -->
    <div class="flex items-center justify-between mb-4">
      <nav class="flex gap-1">
        <button
          v-for="t in [{ label: '전체', value: 'all' }, { label: '미채택', value: 'OPEN' }, { label: '채택완료', value: 'CLOSED' }]"
          :key="t.value"
          class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
          :class="tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'"
          @click="tab = t.value as 'all' | 'OPEN' | 'CLOSED'"
        >
          {{ t.label }}
        </button>
      </nav>
      <select
        v-model="sortBy"
        class="text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
      >
        <option value="latest">최신순</option>
        <option value="bounty">현상금 높은순</option>
        <option value="answers">답변 많은순</option>
      </select>
    </div>

    <!-- 로딩 -->
    <template v-if="loading">
      <div class="border border-border rounded-lg bg-card">
        <div v-for="n in 5" :key="n" class="px-4 py-4 border-b border-border last:border-0">
          <div class="space-y-2">
            <div class="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div class="h-3 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </div>
      </div>
    </template>

    <!-- 질문 목록 -->
    <template v-else-if="sortedItems.length > 0">
      <div class="border border-border rounded-lg bg-card divide-y divide-border">
        <div
          v-for="item in sortedItems"
          :key="item.id"
          class="px-4 py-4 hover:bg-accent/50 cursor-pointer transition-colors"
          @click="navigateTo(`/agora/${item.id}`)"
        >
          <div class="flex items-start gap-3">
            <!-- 상태 아이콘 -->
            <div class="mt-0.5 flex-shrink-0">
              <Icon
                :icon="item.status === 'CLOSED' ? 'heroicons:check-circle' : 'heroicons:question-mark-circle'"
                :class="item.status === 'CLOSED' ? 'text-green-500' : 'text-amber-500'"
                class="w-5 h-5"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-medium text-foreground line-clamp-1">{{ item.title }}</h3>
                <span class="flex-shrink-0 text-xs font-semibold text-amber-500">
                  💎 {{ item.bounty.toLocaleString() }}cr
                </span>
              </div>
              <p class="text-xs text-muted-foreground mt-1 line-clamp-1">
                {{ item.content.replace(/<[^>]*>/g, '').slice(0, 100) }}
              </p>
              <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{{ item.author.nickname ?? item.author.name }}</span>
                <span>{{ useRelativeTime(item.createdAt) }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-3 h-3" />
                  {{ item._count.answers }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-3 h-3" />
                  {{ item.viewCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="flex justify-center gap-1 mt-6">
        <button
          v-if="page > 1"
          class="w-8 h-8 rounded text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          @click="fetchList(page - 1)"
        >&lt;</button>
        <button
          v-for="p in totalPages"
          :key="p"
          class="w-8 h-8 rounded text-sm font-medium transition-colors"
          :class="page === p ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent'"
          @click="fetchList(p)"
        >{{ p }}</button>
        <button
          v-if="page < totalPages"
          class="w-8 h-8 rounded text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          @click="fetchList(page + 1)"
        >&gt;</button>
      </div>
    </template>

    <!-- 빈 상태 -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <Icon icon="heroicons:question-mark-circle" class="w-12 h-12 text-muted-foreground mb-4" />
      <h2 class="text-lg font-semibold text-foreground mb-2">아직 질문이 없어요</h2>
      <p class="text-muted-foreground text-sm mb-4">첫 번째 질문을 올려보세요!</p>
      <Button v-if="authStore.isAuthenticated" @click="navigateTo('/agora/write')">
        질문 작성하기
      </Button>
    </div>
  </div>
</template>
