-- DRE-241: createdAt 인덱스 5개 추가
-- (CONCURRENTLY는 Supabase SQL Editor 트랜잭션 내에서 사용 불가 → 일반 CREATE INDEX 사용)

-- notifications: 알림 폴링 최적화 (30초 폴링)
CREATE INDEX "notifications_recipientId_createdAt_idx"
  ON "notifications"("recipientId", "createdAt" DESC);

-- ai_messages: 대화 메시지 조회 (가장 빠르게 성장하는 테이블)
CREATE INDEX "ai_messages_createdAt_idx"
  ON "ai_messages"("createdAt" DESC);

-- posts: 게시판 최신글 목록
CREATE INDEX "posts_boardId_createdAt_idx"
  ON "posts"("boardId", "createdAt" DESC);

-- agoras: 아고라 최신 질문 목록
CREATE INDEX "agoras_createdAt_idx"
  ON "agoras"("createdAt" DESC);

-- recruits: 마감일 필터 쿼리
CREATE INDEX "recruits_deadline_idx"
  ON "recruits"("deadline");
