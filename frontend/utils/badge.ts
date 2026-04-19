export interface BadgeInfo {
  key: string
  label: string
  description: string
  icon: string
  imageUrl: string
  color: string
}

const R2_BADGE_BASE = 'https://pub-309be845cb284fb1b47d787e6972022f.r2.dev/badges'

export const BADGE_CONFIG: Record<string, BadgeInfo> = {
  NEWBIE: { key: 'NEWBIE', label: '뉴비', description: '가입을 환영합니다!', icon: '🌱', imageUrl: `${R2_BADGE_BASE}/newbie.jpeg`, color: '#22C55E' },
  COMMUNICATOR: { key: 'COMMUNICATOR', label: '소통장인', description: '활발한 커뮤니티 활동', icon: '💬', imageUrl: `${R2_BADGE_BASE}/communicator.jpeg`, color: '#3B82F6' },
  BEST_ANSWERER: { key: 'BEST_ANSWERER', label: '명답자', description: '최고의 답변 제공자', icon: '⭐', imageUrl: `${R2_BADGE_BASE}/best_answerer.jpeg`, color: '#8B5CF6' },
  CURIOUS: { key: 'CURIOUS', label: '호기심천국', description: '왕성한 질문 활동', icon: '❓', imageUrl: `${R2_BADGE_BASE}/curious.jpeg`, color: '#8B5CF6' },
  TASK_HUNTER: { key: 'TASK_HUNTER', label: '태스크 헌터', description: '묵묵한 실행력의 아이콘', icon: '🎯', imageUrl: `${R2_BADGE_BASE}/task_hunter.jpeg`, color: '#F97316' },
  CAPTAIN: { key: 'CAPTAIN', label: '캡틴', description: '팀을 이끄는 리더십', icon: '🚀', imageUrl: `${R2_BADGE_BASE}/captain.jpeg`, color: '#F97316' },
  TEAM_PLAYER: { key: 'TEAM_PLAYER', label: '팀플레이어', description: '다양한 팀에서 협업', icon: '🤝', imageUrl: `${R2_BADGE_BASE}/team_player.jpeg`, color: '#F97316' },
  ATTENDANCE_30: { key: 'ATTENDANCE_30', label: '개근상', description: '30일 연속 출석 달성', icon: '🔥', imageUrl: `${R2_BADGE_BASE}/attendance_30.jpeg`, color: '#EF4444' },
  PRO_SUBSCRIBER: { key: 'PRO_SUBSCRIBER', label: 'PRO구독', description: 'PRO 플랜 구독 중', icon: '💎', imageUrl: `${R2_BADGE_BASE}/pro_subscriber.jpeg`, color: '#EAB308' },
  PREMIUM_SUBSCRIBER: { key: 'PREMIUM_SUBSCRIBER', label: 'PREMIUM구독', description: 'PREMIUM 플랜 구독 중', icon: '👑', imageUrl: `${R2_BADGE_BASE}/premium_subscriber.jpeg`, color: '#EAB308' },
}

export function getBadgeInfo(displayBadgeType: string | null | undefined): BadgeInfo | null {
  if (!displayBadgeType) return null
  return BADGE_CONFIG[displayBadgeType] ?? null
}
