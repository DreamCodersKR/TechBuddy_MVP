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
import { toast } from 'vue-sonner'
import { formatRelativeTime } from '@/utils/formatters'

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

const isLiked = ref(false)
const likeCount = ref(0)
const isLikeLoading = ref(false)

const showDeleteDialog = ref(false)
const isDeleting = ref(false)
const showReportModal = ref(false)

const commentCount = ref(0)

// ─── 계산 속성 ──────────────────────────────────────────
const isAuthor = computed(
  () => authStore.isAuthenticated && post.value?.authorId === authStore.currentUser?.id,
)

const pageTitle = computed(() =>
  post.value ? `${post.value.title} - FLOWIT` : '게시글 - FLOWIT',
)

useHead({ title: pageTitle })

// ─── 날짜 포맷 ──────────────────────────────────────────
const formatDate = formatRelativeTime

// ─── 데이터 로드 ────────────────────────────────────────
async function fetchPost() {
  isLoading.value = true
  try {
    post.value = await $fetch<Post>(`${authStore.apiBaseUrl}/posts/${postId}`)
    likeCount.value = post.value._count.likes
    commentCount.value = post.value._count.comments
    if (authStore.isAuthenticated) {
      fetchBookmarkStatus()
      fetchLikeStatus()
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

async function fetchLikeStatus() {
  try {
    const result = await authGet<{ liked: boolean; count: number }>(`/likes/post/${postId}/status`)
    isLiked.value = result.liked
    likeCount.value = result.count
  }
  catch {
    // 좋아요 상태 조회 실패 시 무시
  }
}

// ─── 좋아요 토글 ────────────────────────────────────────
async function toggleLike() {
  if (!authStore.isAuthenticated) {
    await router.push('/auth/login')
    return
  }
  if (isLikeLoading.value) return

  // Optimistic UI
  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1

  isLikeLoading.value = true
  try {
    const result = await authPost<{ liked: boolean }>(`/likes/post/${postId}`)
    isLiked.value = result.liked
  }
  catch {
    // 실패 시 롤백
    isLiked.value = !isLiked.value
    likeCount.value += isLiked.value ? 1 : -1
  }
  finally {
    isLikeLoading.value = false
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
    toast.error(err?.data?.message || '게시글 삭제에 실패했습니다.')
  }
  finally {
    isDeleting.value = false
  }
}

// ─── 미니 프로필 팝업 ─────────────────────────────────────
const popupNickname = ref<string | null>(null)
const popupAnchor = ref<HTMLElement | null>(null)

function openPopup(nickname: string | null | undefined, event: MouseEvent) {
  if (!nickname) return
  event.stopPropagation()
  popupNickname.value = nickname
  popupAnchor.value = event.currentTarget as HTMLElement
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
          <div
            class="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0"
            :class="post.author.nickname ? 'cursor-pointer' : ''"
            @click="openPopup(post.author.nickname, $event)"
          >
            <img
              v-if="post.author.avatarUrl"
              :src="post.author.avatarUrl"
              :alt="post.author.nickname || post.author.name"
              class="w-full h-full object-cover"
            >
            <Icon v-else icon="heroicons:user-circle" class="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p
              class="text-sm font-medium text-foreground"
              :class="post.author.nickname ? 'cursor-pointer hover:underline' : ''"
              @click="openPopup(post.author.nickname, $event)"
            >
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

        <!-- 신고 (비로그인이 아닌 타인만) -->
        <button
          v-if="authStore.isAuthenticated && !isAuthor"
          class="shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
          title="게시글 신고"
          @click="showReportModal = true"
        >
          <Icon icon="heroicons:flag" class="w-4 h-4" />
        </button>

        <!-- 액션 버튼 (본인만: 수정/삭제) -->
        <div v-if="isAuthor" class="flex items-center gap-1 shrink-0">
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
      <div class="min-h-[200px] mb-8">
        <PostMarkdownViewer :content="post.content" />
      </div>

      <!-- 좋아요 / 북마크 액션 바 -->
      <div class="flex items-center justify-center gap-4 py-6 border-y border-border mb-8">
        <button
          class="flex items-center gap-2 px-5 py-2 rounded-full border transition-colors"
          :class="isLiked
            ? 'border-rose-400 bg-rose-50 text-rose-500 dark:bg-rose-950/30'
            : 'border-border text-muted-foreground hover:border-rose-300 hover:text-rose-400'"
          :disabled="isLikeLoading"
          @click="toggleLike"
        >
          <Icon
            :icon="isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'"
            class="w-5 h-5"
          />
          <span class="text-sm font-medium">{{ likeCount }}</span>
        </button>

        <button
          class="flex items-center gap-2 px-5 py-2 rounded-full border transition-colors"
          :class="isBookmarked
            ? 'border-primary/50 bg-primary/5 text-primary'
            : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary'"
          :disabled="isBookmarkLoading"
          @click="toggleBookmark"
        >
          <Icon
            :icon="isBookmarked ? 'heroicons:bookmark-solid' : 'heroicons:bookmark'"
            class="w-5 h-5"
          />
          <span class="text-sm font-medium">북마크</span>
        </button>
      </div>

      <!-- 댓글 섹션 -->
      <div class="border-t border-border pt-8">
        <h2 class="text-base font-bold text-foreground mb-6">
          댓글 {{ commentCount }}개
        </h2>
        <CommentsCommentList
          :post-id="postId"
          :initial-comments="post.comments"
          @count-change="commentCount += $event"
        />
      </div>
    </article>

    <!-- 미니 프로필 팝업 -->
    <UserMiniProfilePopup
      v-if="popupNickname"
      :nickname="popupNickname"
      :anchor-el="popupAnchor"
      @close="popupNickname = null"
    />

    <!-- 게시글 신고 모달 -->
    <CommonReportModal
      v-if="showReportModal"
      target-type="POST"
      :target-id="postId"
      @close="showReportModal = false"
    />

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
