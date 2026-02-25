<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import type { PostListItem } from '~/types/post'

definePageMeta({
  layout: 'default',
})

useHead({
  title: '게시판 - FLOWIT',
})

const route = useRoute()
const config = useRuntimeConfig()

const { posts, meta, loading: postsLoading, fetchPosts } = usePostList()
const { fetchBoards, findBoardBySlug } = useBoard()

// ─── 현재 카테고리 ───────────────────────────────────────
const selectedCategory = computed(() => (route.query.category as string) || 'all')

const categoryLabels: Record<string, string> = {
  all: '전체',
  free: '자유',
  career: '취업/진로',
  ai: 'AI',
}

const currentCategoryLabel = computed(() => categoryLabels[selectedCategory.value] || '전체')

// ─── 인기글 (전체 탭 전용) ───────────────────────────────
const popularPosts = ref<PostListItem[]>([])
const popularLoading = ref(false)

async function loadPopularPosts() {
  popularLoading.value = true
  try {
    const result = await $fetch<{ data: PostListItem[] }>(
      `${config.public.apiBaseUrl}/posts?sortBy=viewCount&order=desc&limit=5`,
    )
    popularPosts.value = result.data
  }
  catch {
    popularPosts.value = []
  }
  finally {
    popularLoading.value = false
  }
}

// ─── 정렬 ────────────────────────────────────────────────
type SortOption = { label: string; sortBy: 'createdAt' | 'viewCount'; order: 'asc' | 'desc' }

const sortOptions: SortOption[] = [
  { label: '최신순', sortBy: 'createdAt', order: 'desc' },
  { label: '조회순', sortBy: 'viewCount', order: 'desc' },
]
const selectedSort = ref<SortOption>(sortOptions[0]!)
const isSortOpen = ref(false)

async function selectSort(option: SortOption) {
  selectedSort.value = option
  isSortOpen.value = false
  await loadCategoryPosts()
}

// ─── 게시글 로드 ─────────────────────────────────────────
async function loadCategoryPosts(page = 1) {
  const board = selectedCategory.value !== 'all'
    ? findBoardBySlug(selectedCategory.value)
    : undefined

  await fetchPosts(board?.id, {
    page,
    sortBy: selectedSort.value.sortBy,
    sortOrder: selectedSort.value.order,
  })
}

async function loadCurrentCategory() {
  selectedSort.value = sortOptions[0]!

  if (selectedCategory.value === 'all') {
    await Promise.all([
      fetchPosts(undefined, { page: 1 }),
      loadPopularPosts(),
    ])
  }
  else {
    await loadCategoryPosts(1)
  }
}

async function goToPage(page: number) {
  if (selectedCategory.value === 'all') {
    await fetchPosts(undefined, { page })
  }
  else {
    await loadCategoryPosts(page)
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ─── 페이지 번호 목록 ────────────────────────────────────
const pageNumbers = computed<(number | '...')[]>(() => {
  if (!meta.value) return []
  const { page, totalPages } = meta.value
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (page > 3) pages.push('...')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    pages.push(i)
  }
  if (page < totalPages - 2) pages.push('...')
  if (totalPages > 1) pages.push(totalPages)
  return pages
})

// ─── 날짜 포맷 ───────────────────────────────────────────
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000
}

// ─── 마운트 + 카테고리 변경 감시 ──────────────────────────
watch(selectedCategory, () => {
  loadCurrentCategory()
})

onMounted(async () => {
  await fetchBoards()
  await loadCurrentCategory()
})
</script>

<template>
  <div class="container py-6">
    <!-- ── 전체 카테고리 ── -->
    <template v-if="selectedCategory === 'all'">
      <!-- 배너 -->
      <div class="bg-muted rounded-lg p-8 mb-8 text-center">
        <p class="text-muted-foreground">게시판 소개 배너</p>
      </div>

      <!-- 실시간 인기글 -->
      <section class="mb-10">
        <h2 class="text-lg font-bold text-foreground mb-4">
          실시간 인기글
        </h2>
        <div class="bg-card rounded-lg border border-border">
          <!-- 로딩 -->
          <ul v-if="popularLoading" class="divide-y divide-border">
            <li v-for="i in 5" :key="i" class="flex items-center gap-4 px-4 py-3">
              <div class="w-4 h-4 bg-muted rounded animate-pulse shrink-0" />
              <div class="h-4 bg-muted rounded animate-pulse flex-1" />
              <div class="h-4 w-24 bg-muted rounded animate-pulse" />
            </li>
          </ul>

          <!-- 데이터 없음 -->
          <div v-else-if="popularPosts.length === 0" class="px-4 py-8 text-center text-sm text-muted-foreground">
            인기글이 없습니다.
          </div>

          <!-- 목록 -->
          <ul v-else class="divide-y divide-border">
            <li
              v-for="(post, index) in popularPosts"
              :key="post.id"
              class="hover:bg-accent/50 transition-colors"
            >
              <NuxtLink
                :to="`/community/${post.id}`"
                class="flex items-center gap-4 px-4 py-3"
              >
                <span class="text-sm font-bold text-primary w-4 shrink-0">{{ index + 1 }}</span>
                <span v-if="post.board" class="text-sm text-muted-foreground shrink-0">[{{ post.board.name }}]</span>
                <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
                <div class="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                  <span>{{ post.author.nickname || post.author.name }}</span>
                  <span>{{ formatDate(post.createdAt) }}</span>
                  <span class="flex items-center gap-1">
                    <Icon icon="heroicons:eye" class="w-4 h-4" />
                    {{ post.viewCount }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="heroicons:heart" class="w-4 h-4" />
                    {{ post._count.likes }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                    {{ post._count.comments }}
                  </span>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>

      <!-- 전체글 -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-foreground">
            전체글
          </h2>
          <span class="text-sm text-muted-foreground">최신순</span>
        </div>

        <div class="bg-card rounded-lg border border-border">
          <!-- 로딩 -->
          <ul v-if="postsLoading" class="divide-y divide-border">
            <li v-for="i in 10" :key="i" class="flex items-center gap-4 px-4 py-3">
              <div class="h-4 w-16 bg-muted rounded animate-pulse" />
              <div class="h-4 bg-muted rounded animate-pulse flex-1" />
              <div class="h-4 w-32 bg-muted rounded animate-pulse" />
            </li>
          </ul>

          <!-- 데이터 없음 -->
          <div v-else-if="posts.length === 0" class="px-4 py-12 text-center text-sm text-muted-foreground">
            아직 작성된 게시글이 없습니다.
          </div>

          <!-- 목록 -->
          <ul v-else class="divide-y divide-border">
            <li
              v-for="post in posts"
              :key="post.id"
              class="hover:bg-accent/50 transition-colors"
            >
              <NuxtLink
                :to="`/community/${post.id}`"
                class="flex items-center gap-4 px-4 py-3"
              >
                <span v-if="post.board" class="text-sm text-muted-foreground shrink-0">[{{ post.board.name }}]</span>
                <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
                <span v-if="isNew(post.createdAt)" class="text-xs font-bold text-destructive shrink-0">N</span>
                <div class="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                  <span>{{ post.author.nickname || post.author.name }}</span>
                  <span>{{ formatDate(post.createdAt) }}</span>
                  <span class="flex items-center gap-1">
                    <Icon icon="heroicons:eye" class="w-4 h-4" />
                    {{ post.viewCount }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="heroicons:heart" class="w-4 h-4" />
                    {{ post._count.likes }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                    {{ post._count.comments }}
                  </span>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="meta && meta.totalPages > 1" class="flex items-center justify-center gap-1 mt-6">
          <Button
            variant="ghost"
            size="sm"
            :disabled="meta.page <= 1"
            @click="goToPage(meta.page - 1)"
          >
            <Icon icon="heroicons:chevron-left" class="w-4 h-4" />
          </Button>
          <template v-for="p in pageNumbers" :key="String(p) + Math.random()">
            <span v-if="p === '...'" class="px-2 text-muted-foreground">...</span>
            <Button
              v-else
              variant="ghost"
              size="sm"
              :class="p === meta.page ? 'font-bold text-foreground' : 'text-muted-foreground'"
              @click="goToPage(p as number)"
            >
              {{ p }}
            </Button>
          </template>
          <Button
            variant="ghost"
            size="sm"
            :disabled="meta.page >= meta.totalPages"
            @click="goToPage(meta.page + 1)"
          >
            <Icon icon="heroicons:chevron-right" class="w-4 h-4" />
          </Button>
        </div>
      </section>
    </template>

    <!-- ── 카테고리별 ── -->
    <template v-else>
      <!-- 헤더 + 정렬 -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-lg font-bold text-foreground">
          {{ currentCategoryLabel }}
        </h1>
        <div class="relative">
          <button
            class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            @click="isSortOpen = !isSortOpen"
          >
            <span>{{ selectedSort.label }}</span>
            <Icon icon="heroicons:chevron-down" class="w-4 h-4" />
          </button>
          <div
            v-if="isSortOpen"
            class="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-10 min-w-[120px]"
          >
            <button
              v-for="option in sortOptions"
              :key="option.label"
              class="block w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
              :class="selectedSort.label === option.label ? 'text-foreground font-medium' : 'text-muted-foreground'"
              @click="selectSort(option)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 글 목록 -->
      <div class="bg-card rounded-lg border border-border">
        <!-- 로딩 -->
        <ul v-if="postsLoading" class="divide-y divide-border">
          <li v-for="i in 10" :key="i" class="flex items-center gap-4 px-4 py-3">
            <div class="h-4 bg-muted rounded animate-pulse flex-1" />
            <div class="h-4 w-32 bg-muted rounded animate-pulse" />
          </li>
        </ul>

        <!-- 데이터 없음 -->
        <div v-else-if="posts.length === 0" class="px-4 py-12 text-center text-sm text-muted-foreground">
          아직 작성된 게시글이 없습니다.
        </div>

        <!-- 목록 -->
        <ul v-else class="divide-y divide-border">
          <li
            v-for="post in posts"
            :key="post.id"
            class="hover:bg-accent/50 transition-colors"
          >
            <NuxtLink
              :to="`/community/${post.id}`"
              class="flex items-center gap-4 px-4 py-3"
            >
              <span class="text-sm text-muted-foreground shrink-0">[{{ currentCategoryLabel }}]</span>
              <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
              <span v-if="isNew(post.createdAt)" class="text-xs font-bold text-destructive shrink-0">N</span>
              <div class="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                <span>{{ post.author.nickname || post.author.name }}</span>
                <span>{{ formatDate(post.createdAt) }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ post.viewCount }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:heart" class="w-4 h-4" />
                  {{ post._count.likes }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                  {{ post._count.comments }}
                </span>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="meta && meta.totalPages > 1" class="flex items-center justify-center gap-1 mt-6">
        <Button
          variant="ghost"
          size="sm"
          :disabled="meta.page <= 1"
          @click="goToPage(meta.page - 1)"
        >
          <Icon icon="heroicons:chevron-left" class="w-4 h-4" />
        </Button>
        <template v-for="p in pageNumbers" :key="String(p) + Math.random()">
          <span v-if="p === '...'" class="px-2 text-muted-foreground">...</span>
          <Button
            v-else
            variant="ghost"
            size="sm"
            :class="p === meta.page ? 'font-bold text-foreground' : 'text-muted-foreground'"
            @click="goToPage(p as number)"
          >
            {{ p }}
          </Button>
        </template>
        <Button
          variant="ghost"
          size="sm"
          :disabled="meta.page >= meta.totalPages"
          @click="goToPage(meta.page + 1)"
        >
          <Icon icon="heroicons:chevron-right" class="w-4 h-4" />
        </Button>
      </div>

      <!-- 글쓰기 FAB -->
      <div class="fixed bottom-6 right-6 z-40">
        <NuxtLink to="/community/write">
          <Button class="rounded-full shadow-lg px-6">
            <Icon icon="heroicons:pencil" class="mr-2 h-4 w-4" />
            {{ currentCategoryLabel }} 글쓰기
          </Button>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
