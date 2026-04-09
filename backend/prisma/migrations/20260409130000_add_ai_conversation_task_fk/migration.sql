-- DRE-240: AIConversation.taskId FK 추가
-- 1. orphan 데이터 null 처리 (deleted task 참조 정리)
UPDATE "ai_conversations"
SET "taskId" = NULL
WHERE "taskId" IS NOT NULL
  AND "taskId" NOT IN (SELECT id FROM "tasks");

-- 2. FK 제약 추가 (Task 삭제 시 taskId를 NULL로)
ALTER TABLE "ai_conversations"
  ADD CONSTRAINT "ai_conversations_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "tasks"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
