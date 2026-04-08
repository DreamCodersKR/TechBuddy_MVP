-- hotfix_20260408_pin: Post 모델에 isPinned 필드 추가
ALTER TABLE "posts" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "posts_isPinned_idx" ON "posts"("isPinned");
