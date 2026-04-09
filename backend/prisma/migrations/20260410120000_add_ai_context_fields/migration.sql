-- AlterTable: AI 대화에 컨텍스트 참조 필드 추가
ALTER TABLE "ai_conversations" ADD COLUMN "contextType" TEXT;
ALTER TABLE "ai_conversations" ADD COLUMN "contextId" TEXT;
