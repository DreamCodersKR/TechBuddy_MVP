-- R-3: 신규 모델 추가
-- Sprint, Recruit, RecruitApplication, Agora, AgoraAnswer
-- CreditTransaction, UserBadge, AIConversation, AIMessage
-- 기존 모델 컬럼 추가: Task(sprintId, taskType), User(xp, level)

-- ========================
-- 1. 신규 Enum 생성
-- ========================
CREATE TYPE "SprintStatus"         AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');
CREATE TYPE "TaskType"             AS ENUM ('CODE', 'DOCUMENT', 'DESIGN', 'PLANNING', 'RESEARCH', 'OTHER');
CREATE TYPE "AgoraStatus"          AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "RecruitType"          AS ENUM ('PROJECT', 'STUDY');
CREATE TYPE "ApplicationStatus"    AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "CreditTransactionType" AS ENUM ('EARN', 'SPEND', 'REFUND');
CREATE TYPE "BadgeType"            AS ENUM ('NEW_MEMBER', 'ACTIVITY', 'SUBSCRIBER', 'LOYALTY', 'ORGANIZATION');
CREATE TYPE "AIMessageRole"        AS ENUM ('USER', 'ASSISTANT');

-- ========================
-- 2. 기존 모델 컬럼 추가
-- ========================

-- User: xp, level
ALTER TABLE "users" ADD COLUMN "xp"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;

-- Task: sprintId, taskType
ALTER TABLE "tasks" ADD COLUMN "sprintId" TEXT;
ALTER TABLE "tasks" ADD COLUMN "taskType" "TaskType";
CREATE INDEX "tasks_sprintId_idx" ON "tasks"("sprintId");

-- ========================
-- 3. Sprint 테이블 생성
-- ========================
CREATE TABLE "sprints" (
  "id"          TEXT         NOT NULL,
  "projectId"   TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "goal"        TEXT,
  "startDate"   TIMESTAMP(3),
  "endDate"     TIMESTAMP(3),
  "status"      "SprintStatus" NOT NULL DEFAULT 'PLANNED',
  "createdById" TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sprints_projectId_idx" ON "sprints"("projectId");
CREATE INDEX "sprints_status_idx"    ON "sprints"("status");

ALTER TABLE "sprints"
  ADD CONSTRAINT "sprints_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Task: sprintId foreign key
ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_sprintId_fkey"
  FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================
-- 4. Recruit 테이블 생성
-- ========================
CREATE TABLE "recruits" (
  "id"          TEXT          NOT NULL,
  "projectId"   TEXT          NOT NULL,
  "authorId"    TEXT          NOT NULL,
  "title"       TEXT          NOT NULL,
  "description" TEXT          NOT NULL,
  "type"        "RecruitType" NOT NULL,
  "positions"   TEXT[]        NOT NULL DEFAULT '{}',
  "maxMembers"  INTEGER       NOT NULL,
  "deadline"    TIMESTAMP(3),
  "isClosed"    BOOLEAN       NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recruits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recruits_projectId_idx" ON "recruits"("projectId");
CREATE INDEX "recruits_authorId_idx"  ON "recruits"("authorId");
CREATE INDEX "recruits_type_idx"      ON "recruits"("type");
CREATE INDEX "recruits_isClosed_idx"  ON "recruits"("isClosed");

ALTER TABLE "recruits"
  ADD CONSTRAINT "recruits_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recruits"
  ADD CONSTRAINT "recruits_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================
-- 5. RecruitApplication 테이블 생성
-- ========================
CREATE TABLE "recruit_applications" (
  "id"          TEXT                NOT NULL,
  "recruitId"   TEXT                NOT NULL,
  "applicantId" TEXT                NOT NULL,
  "message"     TEXT,
  "status"      "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recruit_applications_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "recruit_applications_recruitId_applicantId_key" UNIQUE ("recruitId", "applicantId")
);

CREATE INDEX "recruit_applications_recruitId_idx"   ON "recruit_applications"("recruitId");
CREATE INDEX "recruit_applications_applicantId_idx" ON "recruit_applications"("applicantId");

ALTER TABLE "recruit_applications"
  ADD CONSTRAINT "recruit_applications_recruitId_fkey"
  FOREIGN KEY ("recruitId") REFERENCES "recruits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recruit_applications"
  ADD CONSTRAINT "recruit_applications_applicantId_fkey"
  FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================
-- 6. Agora 테이블 생성
-- ========================
CREATE TABLE "agoras" (
  "id"        TEXT          NOT NULL,
  "authorId"  TEXT          NOT NULL,
  "title"     TEXT          NOT NULL,
  "content"   TEXT          NOT NULL,
  "bounty"    INTEGER       NOT NULL DEFAULT 1,
  "status"    "AgoraStatus" NOT NULL DEFAULT 'OPEN',
  "viewCount" INTEGER       NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agoras_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agoras_authorId_idx" ON "agoras"("authorId");
CREATE INDEX "agoras_status_idx"   ON "agoras"("status");
CREATE INDEX "agoras_bounty_idx"   ON "agoras"("bounty");

ALTER TABLE "agoras"
  ADD CONSTRAINT "agoras_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================
-- 7. AgoraAnswer 테이블 생성
-- ========================
CREATE TABLE "agora_answers" (
  "id"         TEXT         NOT NULL,
  "agoraId"    TEXT         NOT NULL,
  "authorId"   TEXT         NOT NULL,
  "content"    TEXT         NOT NULL,
  "isAccepted" BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agora_answers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agora_answers_agoraId_idx"  ON "agora_answers"("agoraId");
CREATE INDEX "agora_answers_authorId_idx" ON "agora_answers"("authorId");

ALTER TABLE "agora_answers"
  ADD CONSTRAINT "agora_answers_agoraId_fkey"
  FOREIGN KEY ("agoraId") REFERENCES "agoras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agora_answers"
  ADD CONSTRAINT "agora_answers_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================
-- 8. CreditTransaction 테이블 생성
-- ========================
CREATE TABLE "credit_transactions" (
  "id"          TEXT                    NOT NULL,
  "userId"      TEXT                    NOT NULL,
  "amount"      INTEGER                 NOT NULL,
  "type"        "CreditTransactionType" NOT NULL,
  "description" TEXT                    NOT NULL,
  "relatedId"   TEXT,
  "createdAt"   TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "credit_transactions_userId_idx" ON "credit_transactions"("userId");
CREATE INDEX "credit_transactions_type_idx"   ON "credit_transactions"("type");

ALTER TABLE "credit_transactions"
  ADD CONSTRAINT "credit_transactions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================
-- 9. UserBadge 테이블 생성
-- ========================
CREATE TABLE "user_badges" (
  "id"       TEXT         NOT NULL,
  "userId"   TEXT         NOT NULL,
  "badge"    "BadgeType"  NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_badges_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "user_badges_userId_badge_key"  UNIQUE ("userId", "badge")
);

CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

ALTER TABLE "user_badges"
  ADD CONSTRAINT "user_badges_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================
-- 10. AIConversation 테이블 생성
-- ========================
CREATE TABLE "ai_conversations" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "title"     TEXT,
  "taskId"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_conversations_userId_idx" ON "ai_conversations"("userId");

ALTER TABLE "ai_conversations"
  ADD CONSTRAINT "ai_conversations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================
-- 11. AIMessage 테이블 생성
-- ========================
CREATE TABLE "ai_messages" (
  "id"             TEXT            NOT NULL,
  "conversationId" TEXT            NOT NULL,
  "role"           "AIMessageRole" NOT NULL,
  "content"        TEXT            NOT NULL,
  "taskType"       TEXT,
  "modelUsed"      TEXT,
  "creditsUsed"    INTEGER         NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_messages_conversationId_idx" ON "ai_messages"("conversationId");

ALTER TABLE "ai_messages"
  ADD CONSTRAINT "ai_messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
