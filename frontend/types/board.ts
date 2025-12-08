// 게시판 타입
export interface Board {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// 게시판 목록 응답
export interface BoardListResponse {
  boards: Board[]
}

// 게시판 slug 매핑 (URL 친화적)
export const BOARD_SLUG_MAP: Record<string, string> = {
  free: '자유게시판',
  project: '프로젝트 구인',
  career: '취업/진로',
} as const

// 게시판 name으로 slug 찾기
export function getBoardSlug(boardName: string): string | undefined {
  return Object.entries(BOARD_SLUG_MAP).find(([_, name]) => name === boardName)?.[0]
}

// slug로 게시판 name 찾기
export function getBoardName(slug: string): string | undefined {
  return BOARD_SLUG_MAP[slug]
}
