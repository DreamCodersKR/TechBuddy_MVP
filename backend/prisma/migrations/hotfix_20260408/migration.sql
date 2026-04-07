-- =======================================================
-- Hotfix Migration: DRE-195, DRE-196, DRE-197, DRE-200
-- 실행: Supabase SQL Editor에서 순서대로 실행
-- =======================================================

-- 1. BadgeType enum에 STREAK_7 추가 (DRE-196)
ALTER TYPE "BadgeType" ADD VALUE IF NOT EXISTS 'STREAK_7';

-- 2. TilVisibility enum 신규 생성 (DRE-197)
DO $$ BEGIN
  CREATE TYPE "TilVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'PUBLIC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Til 테이블에 workspaceId, visibility 컬럼 추가 (DRE-197)
ALTER TABLE "tils"
  ADD COLUMN IF NOT EXISTS "workspaceId" TEXT,
  ADD COLUMN IF NOT EXISTS "visibility" "TilVisibility" NOT NULL DEFAULT 'PUBLIC';

-- 4. workspaceId 외래키 제약 추가
ALTER TABLE "tils"
  ADD CONSTRAINT IF NOT EXISTS "tils_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "projects"("id") ON DELETE SET NULL;

-- 5. workspaceId 인덱스 추가
CREATE INDEX IF NOT EXISTS "tils_workspaceId_idx" ON "tils"("workspaceId");

-- 6. Quest creditReward 전체 0으로 업데이트 (DRE-195)
UPDATE "quests" SET "creditReward" = 0 WHERE type = 'DAILY';

-- =======================================================
-- _prisma_migrations 수동 삽입 (마이그레이션 기록용)
-- =======================================================
INSERT INTO "_prisma_migrations" (
  id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
) VALUES (
  gen_random_uuid()::text,
  'hotfix_manual_20260408',
  NOW(),
  'hotfix_20260408',
  NULL,
  NULL,
  NOW(),
  1
) ON CONFLICT DO NOTHING;
