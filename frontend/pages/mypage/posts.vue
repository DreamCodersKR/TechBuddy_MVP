<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '내 게시글 - FLOWIT' })

const authStore = useAuthStore()
const { get: authGet } = useAuthFetch()

interface Post {
  id: string
  title: string
  createdAt: string
  viewCount: number
  board: { id: string; name: string } | null
  _count: { comments: number; likes: number }
}

const posts = ref<Post[]>([])
const loading = ref(true)
const page = ref(1)
const meta = ref({ total: 0, totalPages: 1 })

async function loadPosts() {
  if (!authStore.currentUser) return
  loading.value = true
  try {
    const result = await authGet<{ data: Post[]; meta: typeof meta.value }>(
      `/posts?authorId=${authStore.currentUser.id}&page=${page.value}&limit=20`,
    )
    posts.value = result.data
    meta.value = result.meta
  }
  catch { posts.value = [] }
  finally { loading.value = false }
}

watch(page, () => loadPosts())
onMounted(() => loadPosts())
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/mypage">
        <Button variant="ghost" size="icon">
          <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
        </Button>
      </NuxtLink>
      <h1 class="text-xl font-bold text-foreground">내 게시글</h1>
      <span v-if="!loading" class="text-sm text-muted-foreground">({{ meta.total }}개)</span>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 5" :key="n" class="border border-border rounded-xl p-4">
        <div class="h-4 bg-muted animate-pulse rounded w-2/3 mb-2" />
        <div class="h-3 bg-muted animate-pulse rounded w-1/3" />
      </div>
    </div>

    <div v-else-if="posts.length > 0" class="space-y-3">
      <NuxtLink
        v-for="post in posts"
        :key="post.id"
        :to="`/community/${post.id}`"
        class="block border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors"
      >
        <p class="text-sm font-medium text-foreground line-clamp-2">{{ post.title }}</p>
        <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span v-if="post.board">{{ post.board.name }}</span>
          <span>{{ useRelativeTime(post.createdAt) }}</span>
          <span class="flex items-center gap-0.5">
            <Icon icon="heroicons:eye" class="w-3 h-3" />
            {{ post.viewCount }}
          </span>
          <span class="flex items-center gap-0.5">
            <Icon icon="heroicons:chat-bubble-left" class="w-3 h-3" />
            {{ post._count.comments }}
          </span>
          <span class="flex items-center gap-0.5">
            <Icon icon="heroicons:hand-thumb-up" class="w-3 h-3" />
            {{ post._count.likes }}
          </span>
        </div>
      </NuxtLink>

      <!-- 페이지네이션 -->
      <div v-if="meta.totalPages > 1" class="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          :disabled="page <= 1"
          @click="page--"
        >
          이전
        </Button>
        <span class="text-sm text-muted-foreground flex items-center px-2">
          {{ page }} / {{ meta.totalPages }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="page >= meta.totalPages"
          @click="page++"
        >
          다음
        </Button>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-20 text-center border border-border rounded-xl">
      <Icon icon="heroicons:document-text" class="w-10 h-10 text-muted-foreground mb-3" />
      <p class="text-sm font-medium text-foreground">작성한 게시글이 없습니다</p>
      <p class="text-xs text-muted-foreground mt-1 mb-4">첫 번째 게시글을 작성해보세요</p>
      <NuxtLink to="/community/write">
        <Button variant="outline" size="sm">게시글 작성</Button>
      </NuxtLink>
    </div>
  </div>
</template>
