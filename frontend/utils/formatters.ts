/**
 * 공통 포맷터 유틸리티
 */

/** 상대 시간 (방금 전, N분 전, N시간 전, N일 전) */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 30) return `${days}일 전`
  return formatDateShort(dateStr)
}

/** 짧은 날짜 (M월 D일) */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 전체 날짜 (YYYY년 M월 D일) */
export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** ISO 날짜 (YYYY-MM-DD) */
export function formatDateISO(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0] as string
}

/** 날짜+시간 (YYYY년 M월 D일 HH:mm) */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 텍스트 자르기 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
