<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '북마크 - FLOWIT' })

const { get: authGet } = useAuthFetch()

interface BookmarkItem {
  id: string
  post: {
    id: string
    title: string
    createdAt: string
    viewCount: number
    board: { id: string; name: string } | null
    _count: { comments: number; likes: number }
    author: { nickname: string | null; name: string }
  }
  createdAt: string
}

const bookmarks = ref<BookmarkItem[]>([])
const loading = ref(true)
const page = ref(1)
const meta = ref({ total: 0, totalPages: 1 })

async function loadBookmarks() {
  loading.value = true
  try {
    const result = await authGet<{ data: BookmarkItem[]; meta: typeof meta.value }>(
      `/bookmarks/my?page=${page.value}&limit=20`,
    )
    bookmarks.value = result.data
    meta.value = result.meta
  }
  catch { bookmarks.value = [] }
  finally { loading.value = false }
}

watch(page, () => loadBookmarks())
onMounted(() => loadBookmarks())
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/mypage">
        <Button variant="ghost" size="icon">
          <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
        </Button>
      </NuxtLink>
      <h1 class="text-xl font-bold text-foreground">북마크</h1>
      <span v-if="!loading" class="text-sm text-muted-foreground">({{ meta.total }}개)</span>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 5" :key="n" class="border border-border rounded-xl p-4">
        <div class="h-4 bg-muted animate-pulse rounded w-2/3 mb-2" />
        <div class="h-3 bg-muted animate-pulse rounded w-1/3" />
      </div>
    </div>

    <div v-else-if="bookmarks.length > 0" class="space-y-3">
      <NuxtLink
        v-for="item in bookmarks"
        :key="item.id"
        :to="`/community/${item.post.id}`"
        class="block border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors"
      >
        <p class="text-sm font-medium text-foreground line-clamp-2">{{ item.post.title }}</p>
        <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span v-if="item.post.board">{{ item.post.board.name }}</span>
          <span>{{ item.post.author.nickname || item.post.author.name }}</span>
          <span>{{ useRelativeTime(item.post.createdAt) }}</span>
          <span class="flex items-center gap-0.5">
            <Icon icon="heroicons:eye" class="w-3 h-3" />
            {{ item.post.viewCount }}
          </span>
          <span class="flex items-center gap-0.5">
            <Icon icon="heroicons:chat-bubble-left" class="w-3 h-3" />
            {{ item.post._count.comments }}
          </span>
        </div>
      </NuxtLink>

      <!-- 페이지네이션 -->
      <div v-if="meta.totalPages > 1" class="flex justify-center gap-2 mt-4">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">이전</Button>
        <span class="text-sm text-muted-foreground flex items-center px-2">
          {{ page }} / {{ meta.totalPages }}
        </span>
        <Button variant="outline" size="sm" :disabled="page >= meta.totalPages" @click="page++">다음</Button>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-20 text-center border border-border rounded-xl">
      <Icon icon="heroicons:bookmark" class="w-10 h-10 text-muted-foreground mb-3" />
      <p class="text-sm font-medium text-foreground">북마크한 게시글이 없습니다</p>
      <p class="text-xs text-muted-foreground mt-1 mb-4">관심 있는 게시글을 북마크해보세요</p>
      <NuxtLink to="/community">
        <Button variant="outline" size="sm">게시글 보러 가기</Button>
      </NuxtLink>
    </div>
  </div>
</template>
