<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default' })

useHead({ title: '팀원모집 - FLOWIT' })

const route = useRoute()
const authStore = useAuthStore()
const config = useRuntimeConfig()

// ─── 타입 ────────────────────────────────────────────────
interface RecruitListItem {
  id: string
  title: string
  description: string
  type: 'PROJECT' | 'STUDY'
  positions: string[]
  maxMembers: number
  deadline: string | null
  isClosed: boolean
  createdAt: string
  author: { id: string; name: string; nickname: string | null; avatarUrl: string | null }
  project: { id: string; name: string; type: string } | null
  _count: { applications: number }
}

// ─── 상태 ────────────────────────────────────────────────
const tab = ref<'all' | 'PROJECT' | 'STUDY'>((route.query.tab as 'all' | 'PROJECT' | 'STUDY') || 'all')
const selectedPosition = ref((route.query.position as string) || '')
const items = ref<RecruitListItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(false)

const totalPages = computed(() => Math.ceil(total.value / limit))

const POSITIONS = ['프론트엔드', '백엔드', '풀스택', '디자이너', '기획자', 'DevOps', 'iOS', 'Android']

// ─── 데이터 패칭 ─────────────────────────────────────────
async function fetchList(p = 1) {
  loading.value = true
  page.value = p
  try {
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (tab.value !== 'all') params.set('type', tab.value)
    if (selectedPosition.value) params.set('position', selectedPosition.value)
    const res = await $fetch<{
      data: RecruitListItem[]
      meta: { total: number; page: number; limit: number; totalPages: number }
    }>(`${config.public.apiBaseUrl}/recruit?${params}`)
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

function selectPosition(pos: string) {
  selectedPosition.value = selectedPosition.value === pos ? '' : pos
  fetchList(1)
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
        <h1 class="text-2xl font-bold text-foreground">팀원 모집</h1>
        <p class="text-muted-foreground text-sm mt-1">함께할 팀원을 찾고 프로젝트를 성장시켜보세요</p>
      </div>
      <Button v-if="authStore.isAuthenticated" @click="navigateTo('/recruit/write')">
        <Icon icon="heroicons:pencil" class="w-4 h-4 mr-2" />
        모집글 작성
      </Button>
    </div>

    <!-- 탭 -->
    <nav class="flex gap-1 mb-3">
      <button
        v-for="t in [{ label: '전체', value: 'all' }, { label: '프로젝트', value: 'PROJECT' }, { label: '스터디', value: 'STUDY' }]"
        :key="t.value"
        class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'"
        @click="tab = t.value as 'all' | 'PROJECT' | 'STUDY'"
      >
        {{ t.label }}
      </button>
    </nav>

    <!-- 포지션 필터 -->
    <div class="flex flex-wrap gap-1.5 mb-4">
      <button
        v-for="pos in POSITIONS"
        :key="pos"
        class="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
        :class="selectedPosition === pos
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'"
        @click="selectPosition(pos)"
      >
        {{ pos }}
      </button>
    </div>

    <!-- 로딩 -->
    <template v-if="loading">
      <div class="grid gap-4">
        <div v-for="n in 4" :key="n" class="border border-border rounded-lg p-4 space-y-3">
          <div class="h-3 bg-muted animate-pulse rounded w-1/4" />
          <div class="h-5 bg-muted animate-pulse rounded w-3/4" />
          <div class="h-3 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
    </template>

    <!-- 목록 -->
    <template v-else-if="items.length > 0">
      <div class="grid gap-4">
        <div
          v-for="item in items"
          :key="item.id"
          class="border border-border rounded-lg p-4 hover:bg-accent/30 cursor-pointer transition-colors"
          @click="navigateTo(`/recruit/${item.id}`)"
        >
          <!-- 상단: 뱃지 + 마감여부 -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="item.type === 'PROJECT'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'"
              >
                {{ item.type === 'PROJECT' ? '프로젝트' : '스터디' }}
              </span>
              <span v-if="item.project" class="text-xs text-muted-foreground truncate">
                {{ item.project.name }}
              </span>
            </div>
            <span
              v-if="item.isClosed || (item.deadline && new Date(item.deadline) < new Date())"
              class="flex-shrink-0 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded"
            >마감</span>
          </div>

          <!-- 제목 -->
          <h3 class="text-sm font-semibold text-foreground mb-1 line-clamp-1">{{ item.title }}</h3>

          <!-- 설명 한줄 -->
          <p class="text-xs text-muted-foreground mb-3 line-clamp-1">{{ item.description }}</p>

          <!-- 하단: 포지션 태그 + 메타 -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-wrap gap-1 min-w-0">
              <span
                v-for="pos in item.positions.slice(0, 4)"
                :key="pos"
                class="inline-block px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
              >
                {{ pos }}
              </span>
              <span v-if="item.positions.length > 4" class="text-xs text-muted-foreground self-center">
                +{{ item.positions.length - 4 }}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:user-group" class="w-3 h-3" />
                {{ item._count.applications }}/{{ item.maxMembers }}명
              </span>
              <span v-if="item.deadline" class="flex items-center gap-1">
                <Icon icon="heroicons:calendar" class="w-3 h-3" />
                {{ useRelativeTime(item.deadline) }}
              </span>
              <span>{{ item.author.nickname ?? item.author.name }}</span>
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
      <Icon icon="heroicons:user-group" class="w-12 h-12 text-muted-foreground mb-4" />
      <h2 class="text-lg font-semibold text-foreground mb-2">아직 모집글이 없어요</h2>
      <p class="text-muted-foreground text-sm mb-4">첫 번째 모집글을 올려보세요!</p>
      <Button v-if="authStore.isAuthenticated" @click="navigateTo('/recruit/write')">
        모집글 작성하기
      </Button>
    </div>
  </div>
</template>
