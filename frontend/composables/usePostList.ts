import type { PostListItem, PostListQuery, PaginationMeta } from '~/types/post'

interface PostListResponse {
  data: PostListItem[]
  meta: PaginationMeta
}

export function usePostList() {
  const config = useRuntimeConfig()

  const posts = ref<PostListItem[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 쿼리 파라미터 상태
  const query = ref<PostListQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  // 게시글 목록 조회
  async function fetchPosts(boardId?: string, additionalQuery?: Partial<PostListQuery>) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()

      // boardId 설정
      if (boardId) {
        params.append('boardId', boardId)
      }

      // 기존 쿼리 파라미터 병합
      const mergedQuery = { ...query.value, ...additionalQuery }

      if (mergedQuery.page) params.append('page', String(mergedQuery.page))
      if (mergedQuery.limit) params.append('limit', String(mergedQuery.limit))
      if (mergedQuery.search) params.append('search', mergedQuery.search)
      if (mergedQuery.sortBy) params.append('sortBy', mergedQuery.sortBy)
      if (mergedQuery.sortOrder) params.append('sortOrder', mergedQuery.sortOrder)

      const response = await $fetch<PostListResponse>(
        `${config.public.apiBaseUrl}/posts?${params.toString()}`
      )

      posts.value = response.data
      meta.value = response.meta

      // 쿼리 상태 업데이트
      if (additionalQuery) {
        query.value = { ...query.value, ...additionalQuery }
      }

      return response
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '게시글 목록을 불러오는데 실패했습니다.'
      error.value = errorMessage
      console.error('Failed to fetch posts:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  // 페이지 변경
  function changePage(newPage: number) {
    query.value.page = newPage
  }

  // 정렬 변경
  function changeSort(sortBy: PostListQuery['sortBy'], sortOrder: PostListQuery['sortOrder']) {
    query.value.sortBy = sortBy
    query.value.sortOrder = sortOrder
    query.value.page = 1 // 정렬 변경 시 첫 페이지로
  }

  // 검색
  function setSearch(searchText: string) {
    query.value.search = searchText
    query.value.page = 1 // 검색 시 첫 페이지로
  }

  // 쿼리 초기화
  function resetQuery() {
    query.value = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
  }

  return {
    posts,
    meta,
    loading,
    error,
    query,
    fetchPosts,
    changePage,
    changeSort,
    setSearch,
    resetQuery,
  }
}
