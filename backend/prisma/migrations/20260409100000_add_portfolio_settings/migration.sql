-- Migration: 포트폴리오 공개 설정 필드 추가 (DRE-175)
-- 2026-04-09

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "portfolioPublic" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "portfolioSections" JSONB;
