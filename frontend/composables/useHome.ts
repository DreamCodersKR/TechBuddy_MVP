import type { PostListItem } from '~/types/post'

// 아고라 응답 타입
interface AgoraItem {
  id: string
  title: string
  content: string
  bounty: number
  status: 'OPEN' | 'CLOSED'
  viewCount: number
  createdAt: string
  author: {
    id: string
    name: string
    nickname: string | null
    avatarUrl: string | null
  }
  _count: {
    answers: number
  }
}

// 팀원모집 응답 타입
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
  author: {
    id: string
    name: string
    nickname: string | null
    avatarUrl: string | null
  }
  _count: {
    applications: number
  }
}

interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

// 상대 시간 표시 (예: "3시간 전")
export function useRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

// 24시간 이내 여부
function isNew(dateStr: string): boolean {
  const now = new Date()
  const date = new Date(dateStr)
  return now.getTime() - date.getTime() < 86400000
}

// D-day 계산
export function calcDDay(deadline: string | null, isClosed: boolean): string {
  if (isClosed) return '모집 마감'
  if (!deadline) return ''
  const now = new Date()
  const end = new Date(deadline)
  const diffDay = Math.ceil((end.getTime() - now.getTime()) / 86400000)
  if (diffDay < 0) return '모집 마감'
  if (diffDay === 0) return '오늘 마감'
  return `D-${diffDay}`
}

export function useHome() {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl as string

  const popularPosts = ref<PostListItem[]>([])
  const popularAgora = ref<AgoraItem[]>([])
  const insightPosts = ref<PostListItem[]>([])
  const waitingAgora = ref<AgoraItem[]>([])
  const recruitPosts = ref<RecruitItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const [postsPopular, agoraLatest, agoraOpen, recruit, postsLatest] = await Promise.allSettled([
        $fetch<PaginatedResponse<PostListItem>>(`${apiBase}/posts?sortBy=viewCount&order=desc&limit=5`),
        $fetch<PaginatedResponse<AgoraItem>>(`${apiBase}/agora?limit=5`),
        $fetch<PaginatedResponse<AgoraItem>>(`${apiBase}/agora?status=OPEN&limit=10`),
        $fetch<PaginatedResponse<RecruitItem>>(`${apiBase}/recruit?limit=4`),
        $fetch<PaginatedResponse<PostListItem>>(`${apiBase}/posts?sortBy=createdAt&order=desc&limit=10`),
      ])

      if (postsPopular.status === 'fulfilled') popularPosts.value = postsPopular.value.data
      if (agoraLatest.status === 'fulfilled') popularAgora.value = agoraLatest.value.data
      if (agoraOpen.status === 'fulfilled') waitingAgora.value = agoraOpen.value.data
      if (recruit.status === 'fulfilled') recruitPosts.value = recruit.value.data
      if (postsLatest.status === 'fulfilled') insightPosts.value = postsLatest.value.data
    } catch (e) {
      error.value = '데이터를 불러오는데 실패했습니다.'
      console.error('useHome fetchAll error:', e)
    } finally {
      loading.value = false
    }
  }

  // 게시글 카테고리명 (board.name)
  function getBoardName(post: PostListItem): string {
    return post.board?.name ?? '일반'
  }

  // 아고라 isNew 유틸
  function agoraIsNew(item: AgoraItem): boolean {
    return isNew(item.createdAt)
  }

  // 포스트 isNew 유틸
  function postIsNew(item: PostListItem): boolean {
    return isNew(item.createdAt)
  }

  return {
    popularPosts,
    popularAgora,
    insightPosts,
    waitingAgora,
    recruitPosts,
    loading,
    error,
    fetchAll,
    getBoardName,
    agoraIsNew,
    postIsNew,
  }
}
