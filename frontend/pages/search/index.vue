<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PostListItem } from '~/types/post'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const config = useRuntimeConfig()

const searchQuery = ref((route.query.q as string) ?? '')
const inputValue = ref(searchQuery.value)

const posts = ref<PostListItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(false)
const searched = ref(false)

useHead(() => ({
  title: searchQuery.value ? `"${searchQuery.value}" 검색 결과 - FLOWIT` : '검색 - FLOWIT',
}))

async function fetchSearch(q: string, p = 1) {
  if (!q.trim()) return
  loading.value = true
  try {
    const params = new URLSearchParams({ query: q, page: String(p), limit: String(limit) })
    const res = await $fetch<{ data: PostListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `${config.public.apiBaseUrl}/posts/search?${params}`
    )
    posts.value = res.data
    total.value = res.meta.total
    page.value = res.meta.page
  } catch {
    posts.value = []
    total.value = 0
  } finally {
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

// 진입 시 자동 검색
if (searchQuery.value) {
  await fetchSearch(searchQuery.value, 1)
}

const totalPages = computed(() => Math.ceil(total.value / limit))
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
      <div class="mb-4 text-sm text-muted-foreground">
        <span class="font-medium text-foreground">"{{ searchQuery }}"</span> 검색 결과
        <span class="ml-1">{{ total.toLocaleString() }}건</span>
      </div>

      <!-- 로딩 -->
      <template v-if="loading">
        <div class="border border-border rounded-lg bg-card">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0">
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div class="h-3 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        </div>
      </template>

      <!-- 결과 목록 -->
      <template v-else-if="posts.length > 0">
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

        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="flex justify-center gap-1 mt-6">
          <button
            v-if="page > 1"
            class="w-8 h-8 rounded text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            @click="changePage(page - 1)"
          >
            &lt;
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="w-8 h-8 rounded text-sm font-medium transition-colors"
            :class="page === p ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent'"
            @click="changePage(p)"
          >
            {{ p }}
          </button>
          <button
            v-if="page < totalPages"
            class="w-8 h-8 rounded text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            @click="changePage(page + 1)"
          >
            &gt;
          </button>
        </div>
      </template>

      <!-- 결과 없음 -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <Icon icon="heroicons:magnifying-glass" class="w-12 h-12 text-muted-foreground mb-4" />
        <h2 class="text-lg font-semibold text-foreground mb-2">검색 결과가 없어요</h2>
        <p class="text-muted-foreground text-sm">다른 검색어로 다시 시도해보세요.</p>
      </div>
    </template>

    <!-- 초기 상태 (검색어 없음) -->
    <template v-else-if="!searchQuery">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <Icon icon="heroicons:magnifying-glass" class="w-12 h-12 text-muted-foreground mb-4" />
        <p class="text-muted-foreground text-sm">검색어를 입력하면 게시글을 찾을 수 있어요.</p>
      </div>
    </template>
  </div>
</template>
