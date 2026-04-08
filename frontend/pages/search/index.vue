<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PostListItem } from '~/types/post'

definePageMeta({ layout: 'default' })

const route = useRoute()
const config = useRuntimeConfig()

// ─── 타입 ────────────────────────────────────────────────
interface AgoraItem {
  id: string
  title: string
  content: string
  status: 'OPEN' | 'CLOSED'
  bounty: number
  viewCount: number
  createdAt: string
  author: { id: string; name: string; nickname: string | null; avatarUrl: string | null }
  _count: { answers: number }
}

interface RecruitItem {
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
const searchQuery = ref((route.query.q as string) ?? '')
const inputValue = ref(searchQuery.value)

const posts = ref<PostListItem[]>([])
const agoraItems = ref<AgoraItem[]>([])
const recruitItems = ref<RecruitItem[]>([])

const postTotal = ref(0)
const agoraTotal = ref(0)
const recruitTotal = ref(0)

const page = ref(1)
const limit = 20
const loading = ref(false)
const searched = ref(false)

useHead(() => ({
  title: searchQuery.value ? `"${searchQuery.value}" 검색 결과 - FLOWIT` : '검색 - FLOWIT',
}))

// ─── 데이터 패칭 (3개 API 병렬 호출) ─────────────────────
async function fetchSearch(q: string, p = 1) {
  if (!q.trim()) return
  loading.value = true
  try {
    const postParams = new URLSearchParams({ query: q, page: String(p), limit: String(limit) })
    const agoraParams = new URLSearchParams({ query: q, limit: '5' })
    const recruitParams = new URLSearchParams({ query: q, limit: '5' })

    const [postRes, agoraRes, recruitRes] = await Promise.all([
      $fetch<{ data: PostListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
        `${config.public.apiBaseUrl}/posts/search?${postParams}`
      ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } })),
      $fetch<{ data: AgoraItem[]; meta: { total: number } }>(
        `${config.public.apiBaseUrl}/agora?${agoraParams}`
      ).catch(() => ({ data: [], meta: { total: 0 } })),
      $fetch<{ data: RecruitItem[]; meta: { total: number } }>(
        `${config.public.apiBaseUrl}/recruit?${recruitParams}`
      ).catch(() => ({ data: [], meta: { total: 0 } })),
    ])

    posts.value = postRes.data
    postTotal.value = postRes.meta.total
    page.value = postRes.meta.page

    agoraItems.value = agoraRes.data
    agoraTotal.value = agoraRes.meta.total

    recruitItems.value = recruitRes.data
    recruitTotal.value = recruitRes.meta.total
  }
  finally {
    loading.value = false
    searched.value = true
  }
}

function handleSearch() {
  if (!inputValue.value.trim()) return
  searchQuery.value = inputValue.value.trim()
  page.value = 1
  navigateTo(`/search?q=${encodeURIComponent(searchQuery.value)}`)
  fetchSearch(searchQuery.value, 1)
}

function changePage(p: number) {
  page.value = p
  fetchSearch(searchQuery.value, p)
}

if (searchQuery.value) {
  await fetchSearch(searchQuery.value, 1)
}

const totalPages = computed(() => Math.ceil(postTotal.value / limit))
const hasAnyResult = computed(() => postTotal.value > 0 || agoraTotal.value > 0 || recruitTotal.value > 0)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 검색 헤더 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-foreground mb-4">검색</h1>
      <form class="flex gap-2" @submit.prevent="handleSearch">
        <div class="relative flex-1">
          <Icon
            icon="heroicons:magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <input
            v-model="inputValue"
            type="search"
            placeholder="검색어를 입력하세요"
            class="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          검색
        </button>
      </form>
    </div>

    <!-- 검색 결과 -->
    <template v-if="searchQuery && searched">
      <!-- 전체 요약 -->
      <div class="mb-6 text-sm text-muted-foreground">
        <span class="font-medium text-foreground">"{{ searchQuery }}"</span>
        에 대한 검색 결과
        <span class="ml-1 font-medium text-foreground">{{ (postTotal + agoraTotal + recruitTotal).toLocaleString() }}건</span>
      </div>

      <!-- 로딩 -->
      <template v-if="loading">
        <div v-for="n in 3" :key="n" class="mb-8">
          <div class="h-5 bg-muted animate-pulse rounded w-24 mb-3" />
          <div class="border border-border rounded-lg bg-card">
            <div v-for="m in 3" :key="m" class="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0">
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div class="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="hasAnyResult">
        <!-- ── 섹션 1: 게시판 ─────────────────────────────── -->
        <section v-if="postTotal > 0" class="mb-10">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Icon icon="heroicons:document-text" class="w-4 h-4 text-muted-foreground" />
              게시판
              <span class="text-sm font-normal text-muted-foreground">{{ postTotal.toLocaleString() }}건</span>
            </h2>
            <NuxtLink
              :to="`/community?q=${encodeURIComponent(searchQuery)}`"
              class="text-xs text-primary hover:underline"
            >
              게시판에서 더보기
            </NuxtLink>
          </div>
          <div class="border border-border rounded-lg bg-card">
            <ul class="divide-y divide-border">
              <li
                v-for="post in posts"
                :key="post.id"
                class="px-4 py-4 hover:bg-accent/50 cursor-pointer transition-colors"
                @click="navigateTo(`/community/${post.id}`)"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs text-muted-foreground">[{{ post.board?.name ?? '일반' }}]</span>
                      <h3 class="text-sm font-medium text-foreground truncate">{{ post.title }}</h3>
                    </div>
                    <p class="text-xs text-muted-foreground line-clamp-1">{{ post.content.replace(/<[^>]*>/g, '').slice(0, 100) }}</p>
                    <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{{ post.author.nickname ?? post.author.name }}</span>
                      <span>{{ useRelativeTime(post.createdAt) }}</span>
                      <span class="flex items-center gap-1">
                        <Icon icon="heroicons:eye" class="w-3 h-3" />
                        {{ post.viewCount }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Icon icon="heroicons:chat-bubble-left" class="w-3 h-3" />
                        {{ post._count.comments }}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <!-- 페이지네이션 (게시판만) -->
          <div v-if="totalPages > 1" class="flex justify-center gap-1 mt-4">
            <button
              v-if="page > 1"
              class="w-8 h-8 rounded text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              @click="changePage(page - 1)"
            >&lt;</button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="w-8 h-8 rounded text-sm font-medium transition-colors"
              :class="page === p ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent'"
              @click="changePage(p)"
            >{{ p }}</button>
            <button
              v-if="page < totalPages"
              class="w-8 h-8 rounded text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              @click="changePage(page + 1)"
            >&gt;</button>
          </div>
        </section>

        <!-- ── 섹션 2: 아고라 ─────────────────────────────── -->
        <section v-if="agoraTotal > 0" class="mb-10">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Icon icon="heroicons:light-bulb" class="w-4 h-4 text-muted-foreground" />
              아고라
              <span class="text-sm font-normal text-muted-foreground">{{ agoraTotal.toLocaleString() }}건</span>
            </h2>
            <NuxtLink
              :to="`/agora?query=${encodeURIComponent(searchQuery)}`"
              class="text-xs text-primary hover:underline"
            >
              아고라에서 더보기
            </NuxtLink>
          </div>
          <div class="border border-border rounded-lg bg-card">
            <ul class="divide-y divide-border">
              <li
                v-for="item in agoraItems"
                :key="item.id"
                class="px-4 py-4 hover:bg-accent/50 cursor-pointer transition-colors"
                @click="navigateTo(`/agora/${item.id}`)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        class="text-xs px-1.5 py-0.5 rounded font-medium"
                        :class="item.status === 'CLOSED'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'"
                      >{{ item.status === 'CLOSED' ? '채택완료' : '답변대기' }}</span>
                      <h3 class="text-sm font-medium text-foreground truncate">{{ item.title }}</h3>
                    </div>
                    <div class="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
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
                  <span class="flex-shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {{ item.bounty }}C
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <!-- ── 섹션 3: 팀원모집 ───────────────────────────── -->
        <section v-if="recruitTotal > 0" class="mb-10">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Icon icon="heroicons:user-group" class="w-4 h-4 text-muted-foreground" />
              팀원모집
              <span class="text-sm font-normal text-muted-foreground">{{ recruitTotal.toLocaleString() }}건</span>
            </h2>
            <NuxtLink
              :to="`/recruit?query=${encodeURIComponent(searchQuery)}`"
              class="text-xs text-primary hover:underline"
            >
              팀원모집에서 더보기
            </NuxtLink>
          </div>
          <div class="grid gap-3">
            <div
              v-for="item in recruitItems"
              :key="item.id"
              class="border border-border rounded-lg p-4 hover:bg-accent/30 cursor-pointer transition-colors"
              @click="navigateTo(`/recruit/${item.id}`)"
            >
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
              <h3 class="text-sm font-semibold text-foreground mb-1 line-clamp-1">{{ item.title }}</h3>
              <p class="text-xs text-muted-foreground mb-3 line-clamp-1">{{ item.description }}</p>
              <div class="flex items-center justify-between gap-2">
                <div class="flex flex-wrap gap-1 min-w-0">
                  <span
                    v-for="pos in item.positions.slice(0, 4)"
                    :key="pos"
                    class="inline-block px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                  >{{ pos }}</span>
                  <span v-if="item.positions.length > 4" class="text-xs text-muted-foreground self-center">
                    +{{ item.positions.length - 4 }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                  <span class="flex items-center gap-1">
                    <Icon icon="heroicons:user-group" class="w-3 h-3" />
                    {{ item._count.applications }}/{{ item.maxMembers }}명
                  </span>
                  <span>{{ item.author.nickname ?? item.author.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- 결과 없음 -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <Icon icon="heroicons:magnifying-glass" class="w-12 h-12 text-muted-foreground mb-4" />
        <h2 class="text-lg font-semibold text-foreground mb-2">검색 결과가 없어요</h2>
        <p class="text-muted-foreground text-sm">다른 검색어로 다시 시도해보세요.</p>
      </div>
    </template>

    <!-- 초기 상태 -->
    <template v-else-if="!searchQuery">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <Icon icon="heroicons:magnifying-glass" class="w-12 h-12 text-muted-foreground mb-4" />
        <p class="text-muted-foreground text-sm">검색어를 입력하면 게시판, 아고라, 팀원모집을 한번에 찾을 수 있어요.</p>
      </div>
    </template>
  </div>
</template>
