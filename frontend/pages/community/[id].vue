<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { get: authGet, post: authPost, delete: authDelete } = useAuthFetch()

const postId = route.params.id as string

// ─── 타입 정의 ───────────────────────────────────────────
interface Author {
  id: string
  name: string
  nickname: string | null
  avatarUrl: string | null
}

interface Comment {
  id: string
  content: string
  author: Author
  createdAt: string
  parentId: string | null
}

interface Post {
  id: string
  title: string
  content: string
  viewCount: number
  createdAt: string
  updatedAt: string
  authorId: string
  author: Author
  board: { id: string; name: string } | null
  postTags: Array<{ tag: { name: string } }>
  comments: Comment[]
  _count: { likes: number; bookmarks: number; comments: number }
}

// ─── 상태 ───────────────────────────────────────────────
const post = ref<Post | null>(null)
const isLoading = ref(true)
const loadError = ref('')

const isBookmarked = ref(false)
const isBookmarkLoading = ref(false)

const showDeleteDialog = ref(false)
const isDeleting = ref(false)

// ─── 계산 속성 ──────────────────────────────────────────
const isAuthor = computed(
  () => authStore.isAuthenticated && post.value?.authorId === authStore.currentUser?.id,
)

const pageTitle = computed(() =>
  post.value ? `${post.value.title} - FLOWIT` : '게시글 - FLOWIT',
)

useHead({ title: pageTitle })

// ─── 날짜 포맷 ──────────────────────────────────────────
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
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ─── 데이터 로드 ────────────────────────────────────────
async function fetchPost() {
  isLoading.value = true
  try {
    post.value = await $fetch<Post>(`${authStore.apiBaseUrl}/posts/${postId}`)
    if (authStore.isAuthenticated) {
      fetchBookmarkStatus()
    }
  }
  catch {
    loadError.value = '게시글을 불러오는 데 실패했습니다.'
  }
  finally {
    isLoading.value = false
  }
}

async function fetchBookmarkStatus() {
  try {
    const result = await authGet<{ bookmarked: boolean }>(`/bookmarks/post/${postId}/status`)
    isBookmarked.value = result.bookmarked
  }
  catch {
    // 북마크 상태 조회 실패 시 무시
  }
}

// ─── 북마크 토글 ────────────────────────────────────────
async function toggleBookmark() {
  if (!authStore.isAuthenticated) {
    await router.push('/auth/login')
    return
  }
  if (isBookmarkLoading.value) return

  isBookmarkLoading.value = true
  try {
    const result = await authPost<{ bookmarked: boolean }>(`/bookmarks/post/${postId}`)
    isBookmarked.value = result.bookmarked
  }
  catch {
    // 실패 시 무시
  }
  finally {
    isBookmarkLoading.value = false
  }
}

// ─── 삭제 ───────────────────────────────────────────────
async function handleDelete() {
  isDeleting.value = true
  try {
    await authDelete(`/posts/${postId}`)
    await router.push('/community')
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    alert(err?.data?.message || '게시글 삭제에 실패했습니다.')
  }
  finally {
    isDeleting.value = false
  }
}

// ─── 마운트 ─────────────────────────────────────────────
onMounted(() => {
  fetchPost()
})
</script>

<template>
  <div class="container max-w-4xl py-8">
    <!-- 로딩 스켈레톤 -->
    <div v-if="isLoading" class="space-y-6">
      <div class="h-5 w-48 bg-muted rounded animate-pulse" />
      <div class="h-8 w-3/4 bg-muted rounded animate-pulse" />
      <div class="h-5 w-64 bg-muted rounded animate-pulse" />
      <div class="border-t border-border" />
      <div class="space-y-3">
        <div class="h-4 bg-muted rounded animate-pulse" />
        <div class="h-4 bg-muted rounded animate-pulse" />
        <div class="h-4 w-2/3 bg-muted rounded animate-pulse" />
      </div>
    </div>

    <!-- 에러 -->
    <div v-else-if="loadError" class="flex flex-col items-center justify-center py-20 gap-4">
      <Icon icon="heroicons:exclamation-triangle" class="w-10 h-10 text-destructive" />
      <p class="text-muted-foreground">{{ loadError }}</p>
      <Button variant="outline" @click="router.back()">
        돌아가기
      </Button>
    </div>

    <!-- 게시글 본문 -->
    <article v-else-if="post">
      <!-- 브레드크럼 -->
      <div class="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <button class="hover:text-foreground transition-colors" @click="router.back()">
          <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
        </button>
        <span>/</span>
        <NuxtLink to="/community" class="hover:text-foreground transition-colors">
          게시판
        </NuxtLink>
        <template v-if="post.board">
          <span>/</span>
          <span class="text-foreground">{{ post.board.name }}</span>
        </template>
      </div>

      <!-- 제목 -->
      <h1 class="text-2xl font-bold text-foreground mb-4 leading-snug">
        {{ post.title }}
      </h1>

      <!-- 작성자 정보 + 액션 버튼 -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <!-- 작성자 -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
            <img
              v-if="post.author.avatarUrl"
              :src="post.author.avatarUrl"
              :alt="post.author.nickname || post.author.name"
              class="w-full h-full object-cover"
            >
            <Icon v-else icon="heroicons:user-circle" class="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p class="text-sm font-medium text-foreground">
              {{ post.author.nickname || post.author.name }}
            </p>
            <div class="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{{ formatDate(post.createdAt) }}</span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:eye" class="w-3.5 h-3.5" />
                {{ post.viewCount }}
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:chat-bubble-left" class="w-3.5 h-3.5" />
                {{ post._count.comments }}
              </span>
            </div>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex items-center gap-1 shrink-0">
          <!-- 북마크 -->
          <Button
            variant="ghost"
            size="sm"
            :disabled="isBookmarkLoading"
            @click="toggleBookmark"
          >
            <Icon
              :icon="isBookmarked ? 'heroicons:bookmark-solid' : 'heroicons:bookmark'"
              class="w-4 h-4"
              :class="isBookmarked ? 'text-primary' : ''"
            />
          </Button>

          <!-- 수정/삭제 (본인만) -->
          <template v-if="isAuthor">
            <NuxtLink :to="`/community/edit/${postId}`">
              <Button variant="ghost" size="sm" class="text-muted-foreground hover:text-foreground">
                <Icon icon="heroicons:pencil-square" class="w-4 h-4 mr-1" />
                수정
              </Button>
            </NuxtLink>
            <Button
              variant="ghost"
              size="sm"
              class="text-muted-foreground hover:text-destructive"
              @click="showDeleteDialog = true"
            >
              <Icon icon="heroicons:trash" class="w-4 h-4 mr-1" />
              삭제
            </Button>
          </template>
        </div>
      </div>

      <!-- 태그 -->
      <div v-if="post.postTags.length > 0" class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="pt in post.postTags"
          :key="pt.tag.name"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
        >
          #{{ pt.tag.name }}
        </span>
      </div>

      <!-- 구분선 -->
      <div class="border-t border-border mb-8" />

      <!-- 본문 마크다운 -->
      <div class="min-h-[200px] mb-12">
        <PostMarkdownViewer :content="post.content" />
      </div>

      <!-- 댓글 섹션 -->
      <div class="border-t border-border pt-8">
        <h2 class="text-base font-bold text-foreground mb-6">
          댓글 {{ post._count.comments }}개
        </h2>

        <!-- 댓글 목록 -->
        <ul v-if="post.comments.length > 0" class="space-y-5 mb-6">
          <li
            v-for="comment in post.comments"
            :key="comment.id"
            class="flex gap-3"
          >
            <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              <img
                v-if="comment.author.avatarUrl"
                :src="comment.author.avatarUrl"
                :alt="comment.author.nickname || comment.author.name"
                class="w-full h-full object-cover"
              >
              <Icon v-else icon="heroicons:user-circle" class="w-5 h-5 text-muted-foreground" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium text-foreground">
                  {{ comment.author.nickname || comment.author.name }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ formatDate(comment.createdAt) }}
                </span>
              </div>
              <p class="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {{ comment.content }}
              </p>
            </div>
          </li>
        </ul>

        <div v-else class="text-center py-8 text-muted-foreground text-sm">
          첫 댓글을 남겨보세요.
        </div>

        <!-- 댓글 작성 영역 (DRE-44) -->
        <div class="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          댓글 작성 기능은 곧 제공됩니다.
        </div>
      </div>
    </article>

    <!-- 삭제 확인 다이얼로그 -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>게시글을 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제된 게시글은 복구할 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting">
            취소
          </AlertDialogCancel>
          <AlertDialogAction :disabled="isDeleting" @click="handleDelete">
            <Icon v-if="isDeleting" icon="heroicons:arrow-path" class="mr-2 w-4 h-4 animate-spin" />
            {{ isDeleting ? '삭제 중...' : '삭제' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
