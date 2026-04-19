-- M15: 뱃지 시스템 리디자인 (DRE-248)
-- BadgeType enum 6종 → 10종 전환 + User.displayBadgeType 추가

-- 1. 기존 데이터 마이그레이션: NEW_MEMBER → NEWBIE
UPDATE "user_badges" SET "badge" = 'NEW_MEMBER' WHERE "badge" = 'NEW_MEMBER';

-- 2. 기존 구형 뱃지 데이터 삭제 (ACTIVITY, SUBSCRIBER, LOYALTY, ORGANIZATION, STREAK_7)
DELETE FROM "user_badges" WHERE "badge" IN ('ACTIVITY', 'SUBSCRIBER', 'LOYALTY', 'ORGANIZATION', 'STREAK_7');

-- 3. 새 enum 타입 생성 (10종)
CREATE TYPE "BadgeType_new" AS ENUM (
  'NEWBIE',
  'COMMUNICATOR',
  'BEST_ANSWERER',
  'CURIOUS',
  'TASK_HUNTER',
  'CAPTAIN',
  'TEAM_PLAYER',
  'ATTENDANCE_30',
  'PRO_SUBSCRIBER',
  'PREMIUM_SUBSCRIBER'
);

-- 4. user_badges 테이블의 badge 컬럼을 새 타입으로 변환
ALTER TABLE "user_badges"
  ALTER COLUMN "badge" TYPE "BadgeType_new"
  USING (
    CASE "badge"::text
      WHEN 'NEW_MEMBER' THEN 'NEWBIE'
      ELSE "badge"::text
    END
  )::"BadgeType_new";

-- 5. users 테이블에 displayBadgeType 컬럼 추가 (새 타입 사용)
ALTER TABLE "users" ADD COLUMN "displayBadgeType" "BadgeType_new";

-- 6. 구 타입 삭제 및 새 타입 이름 변경
DROP TYPE "BadgeType";
ALTER TYPE "BadgeType_new" RENAME TO "BadgeType";
