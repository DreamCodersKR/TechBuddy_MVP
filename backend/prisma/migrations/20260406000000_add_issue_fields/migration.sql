-- AlterTable: Project에 issuePrefix 추가
ALTER TABLE "projects" ADD COLUMN "issuePrefix" TEXT;

-- AlterTable: Task에 issueNumber, position 추가
ALTER TABLE "tasks" ADD COLUMN "issueNumber" INTEGER;
ALTER TABLE "tasks" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
