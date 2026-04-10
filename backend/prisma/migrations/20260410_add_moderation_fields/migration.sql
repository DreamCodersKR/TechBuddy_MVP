-- AlterEnum: NotificationType에 CONTENT_MODERATED 추가
ALTER TYPE "NotificationType" ADD VALUE 'CONTENT_MODERATED';

-- AlterTable: agoras에 isHidden 추가
ALTER TABLE "agoras" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: agora_answers에 isHidden 추가
ALTER TABLE "agora_answers" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
