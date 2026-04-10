-- AlterTable: User에 이메일 수신 설정 + 온보딩 완료 필드 추가
ALTER TABLE "users" ADD COLUMN "emailPreferences" JSONB NOT NULL DEFAULT '{"marketing":true,"commentReply":true,"projectActivity":true,"weeklySummary":true}';
ALTER TABLE "users" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
