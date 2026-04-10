-- CreateEnum
CREATE TYPE "CoffeeChatStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "coffee_chats" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "requesterId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "CoffeeChatStatus" NOT NULL DEFAULT 'PENDING',
  "meetingUrl" TEXT,
  "creditCost" INTEGER NOT NULL DEFAULT 10,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "coffee_chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coffee_chats_requesterId_idx" ON "coffee_chats"("requesterId");
CREATE INDEX "coffee_chats_receiverId_idx" ON "coffee_chats"("receiverId");
CREATE INDEX "coffee_chats_status_idx" ON "coffee_chats"("status");

-- AddForeignKey
ALTER TABLE "coffee_chats" ADD CONSTRAINT "coffee_chats_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coffee_chats" ADD CONSTRAINT "coffee_chats_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum: NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'COFFEE_CHAT_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'COFFEE_CHAT_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'COFFEE_CHAT_DECLINED';
