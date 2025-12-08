import type { Board } from '~/types/board'
import { getBoardName } from '~/types/board'

export function useBoard() {
  const config = useRuntimeConfig()
  const boards = ref<Board[]>([])
  const currentBoard = ref<Board | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 모든 게시판 목록 조회
  async function fetchBoards() {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Board[]>(`${config.public.apiBaseUrl}/boards`)
      boards.value = response
      return response
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '게시판 목록을 불러오는데 실패했습니다.'
      error.value = errorMessage
      console.error('Failed to fetch boards:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  // slug로 게시판 조회 (boards 목록에서 찾기)
  function findBoardBySlug(slug: string): Board | undefined {
    const boardName = getBoardName(slug)
    if (!boardName) return undefined
    return boards.value.find(b => b.name === boardName)
  }

  // ID로 게시판 조회
  async function fetchBoardById(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Board>(`${config.public.apiBaseUrl}/boards/${id}`)
      currentBoard.value = response
      return response
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '게시판을 찾을 수 없습니다.'
      error.value = errorMessage
      console.error('Failed to fetch board:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  // slug로 현재 게시판 설정
  async function setCurrentBoardBySlug(slug: string) {
    // 이미 boards가 로드되어 있다면 그걸 사용
    if (boards.value.length === 0) {
      await fetchBoards()
    }

    const board = findBoardBySlug(slug)
    if (board) {
      currentBoard.value = board
      return board
    }

    error.value = '게시판을 찾을 수 없습니다.'
    return null
  }

  return {
    boards,
    currentBoard,
    loading,
    error,
    fetchBoards,
    fetchBoardById,
    findBoardBySlug,
    setCurrentBoardBySlug,
  }
}
