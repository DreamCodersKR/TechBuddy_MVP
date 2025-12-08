import type { User } from './auth'
import type { Board } from './board'

// 게시글 타입
export interface Post {
  id: string
  boardId: string
  authorId: string
  title: string
  content: string
  viewCount: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  // Relations (optional, 포함 여부는 API 응답에 따라 다름)
  board?: Board
  author?: Pick<User, 'id' | 'name' | 'nickname' | 'avatarUrl'>
  tags?: PostTag[]
  _count?: {
    comments: number
    likes: number
    bookmarks: number
  }
}

// 게시글 목록 아이템 (목록 조회용 간소화된 타입)
export interface PostListItem {
  id: string
  title: string
  content: string
  viewCount: number
  createdAt: string
  author: {
    id: string
    name: string
    nickname: string | null
    avatarUrl: string | null
  }
  tags: PostTag[]
  _count: {
    comments: number
    likes: number
  }
}

// 태그 타입
export interface PostTag {
  id: string
  name: string
}

// 게시글 목록 쿼리 파라미터
export interface PostListQuery {
  boardId?: string
  page?: number
  limit?: number
  search?: string
  sortBy?: 'createdAt' | 'viewCount' | 'likeCount'
  sortOrder?: 'asc' | 'desc'
}

// 페이지네이션 메타 정보
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 게시글 목록 응답
export interface PostListResponse {
  data: PostListItem[]
  meta: PaginationMeta
}

// 게시글 생성 요청
export interface CreatePostRequest {
  boardId: string
  title: string
  content: string
  tags?: string[]
  isPublished?: boolean
}

// 게시글 수정 요청
export interface UpdatePostRequest {
  title?: string
  content?: string
  tags?: string[]
  isPublished?: boolean
}
