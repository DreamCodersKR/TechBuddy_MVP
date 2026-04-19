import { BadgeType } from '@prisma/client';

export interface BadgeInfo {
  type: 'achievement';
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGE_META: Record<
  BadgeType,
  { label: string; description: string; icon: string; color: string }
> = {
  NEWBIE: {
    label: '뉴비',
    description: '가입을 환영합니다!',
    icon: '🌱',
    color: '#22C55E',
  },
  COMMUNICATOR: {
    label: '소통장인',
    description: '활발한 커뮤니티 활동',
    icon: '💬',
    color: '#3B82F6',
  },
  BEST_ANSWERER: {
    label: '명답자',
    description: '최고의 답변 제공자',
    icon: '⭐',
    color: '#8B5CF6',
  },
  CURIOUS: {
    label: '호기심천국',
    description: '왕성한 질문 활동',
    icon: '❓',
    color: '#8B5CF6',
  },
  TASK_HUNTER: {
    label: '태스크 헌터',
    description: '묵묵한 실행력의 아이콘',
    icon: '🎯',
    color: '#F97316',
  },
  CAPTAIN: {
    label: '캡틴',
    description: '팀을 이끄는 리더십',
    icon: '🚀',
    color: '#F97316',
  },
  TEAM_PLAYER: {
    label: '팀플레이어',
    description: '다양한 팀에서 협업',
    icon: '🤝',
    color: '#F97316',
  },
  ATTENDANCE_30: {
    label: '개근상',
    description: '30일 연속 출석 달성',
    icon: '🔥',
    color: '#EF4444',
  },
  PRO_SUBSCRIBER: {
    label: 'PRO구독',
    description: 'PRO 플랜 구독 중',
    icon: '💎',
    color: '#EAB308',
  },
  PREMIUM_SUBSCRIBER: {
    label: 'PREMIUM구독',
    description: 'PREMIUM 플랜 구독 중',
    icon: '👑',
    color: '#EAB308',
  },
};

export function getBadgeInfo(
  displayBadgeType: BadgeType | null,
): BadgeInfo | null {
  if (!displayBadgeType) return null;
  const meta = BADGE_META[displayBadgeType];
  return {
    type: 'achievement',
    key: displayBadgeType,
    label: meta.label,
    description: meta.description,
    icon: meta.icon,
    color: meta.color,
  };
}
