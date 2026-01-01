<script setup lang="ts">
import { BOARD_SLUG_MAP, getBoardSlug } from '~/types/board'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { Icon } from '@iconify/vue'

definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()

// 쿼리 파라미터에서 게시판 타입 가져오기 (기본값: free)
const boardSlug = computed(() => (route.query.board as string) || 'free')

// Composables
const { currentBoard, loading: boardLoading, error: boardError, setCurrentBoardBySlug } = useBoard()
const { posts, meta, loading: postsLoading, error: postsError, fetchPosts, changePage } = usePostList()

// 현재 페이지
const currentPage = computed(() => meta.value?.page || 1)

// 게시판 정보 및 게시글 목록 로드
async function loadBoardAndPosts() {
  const board = await setCurrentBoardBySlug(boardSlug.value)
  if (board) {
    await fetchPosts(board.id)
  }
}

// 페이지 변경 핸들러
async function handlePageChange(page: number) {
  changePage(page)
  if (currentBoard.value) {
    await fetchPosts(currentBoard.value.id, { page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 게시판 변경 핸들러
function handleBoardChange(slug: string) {
  router.push({ query: { board: slug } })
}

// 유효한 게시판 slug인지 확인
const isValidSlug = computed(() => {
  return boardSlug.value in BOARD_SLUG_MAP
})

// 에러 상태
const hasError = computed(() => boardError.value || postsError.value || !isValidSlug.value)
const errorMessage = computed(() => {
  if (!isValidSlug.value) return '존재하지 않는 게시판입니다.'
  return boardError.value || postsError.value
})

// 페이지 로드 시 데이터 fetch
onMounted(() => {
  if (isValidSlug.value) {
    loadBoardAndPosts()
  }
})

// slug 변경 시 데이터 다시 fetch
watch(boardSlug, () => {
  if (isValidSlug.value) {
    loadBoardAndPosts()
  }
})

// 페이지 메타데이터
useHead({
  title: computed(() => currentBoard.value?.name ? `${currentBoard.value.name} - FLOWIT` : '커뮤니티 - FLOWIT'),
})
</script>

<template>
  <div>
    <!-- 에러 상태 -->
    <div v-if="hasError" class="text-center py-16">
      <Icon icon="heroicons:exclamation-triangle" class="w-16 h-16 text-destructive mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-foreground mb-2">
        오류가 발생했습니다
      </h2>
      <p class="text-muted-foreground mb-6">
        {{ errorMessage }}
      </p>
      <Button as="a" href="/app">
        홈으로 돌아가기
      </Button>
    </div>

    <!-- 정상 상태 -->
    <template v-else>
      <!-- 헤더 -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-foreground">
              {{ currentBoard?.name || '커뮤니티' }}
            </h1>
            <p v-if="currentBoard?.description" class="mt-1 text-sm text-muted-foreground">
              {{ currentBoard.description }}
            </p>
          </div>
          <Button as="a" :href="`/app/community/write?board=${boardSlug}`">
            <Icon icon="heroicons:pencil" class="w-4 h-4 mr-1" />
            글쓰기
          </Button>
        </div>

        <!-- 게시판 탭 네비게이션 -->
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="(name, slug) in BOARD_SLUG_MAP"
            :key="slug"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            :class="boardSlug === slug
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'"
            @click="handleBoardChange(slug)"
          >
            {{ name }}
          </button>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <PostListSkeleton v-if="boardLoading || postsLoading" :count="5" />

      <!-- 게시글 목록 -->
      <template v-else>
        <!-- 게시글이 있을 때 -->
        <div v-if="posts.length > 0" class="flex flex-col gap-4">
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
          />

          <!-- 페이지네이션 -->
          <div v-if="meta && meta.totalPages > 1" class="flex justify-center mt-8">
            <Pagination
              :current-page="currentPage"
              :total-pages="meta.totalPages"
              :max-visible="5"
              @update:current-page="handlePageChange"
            />
          </div>
        </div>

        <!-- 게시글이 없을 때 -->
        <PostEmptyPostList
          v-else
          :title="`${currentBoard?.name || '게시판'}에 게시글이 없습니다`"
          description="첫 번째 게시글의 주인공이 되어보세요!"
          :board-slug="boardSlug"
          :show-write-button="false"
        />
      </template>
    </template>
  </div>
</template>
