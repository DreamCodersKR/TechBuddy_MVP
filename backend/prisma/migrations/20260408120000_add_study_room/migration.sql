-- DRE-227: 스터디룸 DB 스키마 추가
-- 마이그레이션: 스터디룸 관련 테이블 생성

-- ENUM 타입 추가
CREATE TYPE "AssignmentSubmissionStatus" AS ENUM ('SUBMITTED', 'LATE');
CREATE TYPE "StudyResourceCategory" AS ENUM ('LINK', 'FILE', 'VIDEO', 'OTHER');

-- 주차별 커리큘럼
CREATE TABLE "study_weeks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_weeks_pkey" PRIMARY KEY ("id")
);

-- 주차별 과제
CREATE TABLE "study_assignments" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_assignments_pkey" PRIMARY KEY ("id")
);

-- 멤버별 과제 제출
CREATE TABLE "study_assignment_submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT,
    "proofUrl" TEXT,
    "status" "AssignmentSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- 벌금 규칙
CREATE TABLE "study_penalty_rules" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" INTEGER NOT NULL DEFAULT 0,
    "penaltyPerMiss" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_penalty_rules_pkey" PRIMARY KEY ("id")
);

-- 벌금 동의
CREATE TABLE "study_penalty_consents" (
    "id" TEXT NOT NULL,
    "penaltyRuleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_penalty_consents_pkey" PRIMARY KEY ("id")
);

-- 벌금 이력
CREATE TABLE "study_penalty_histories" (
    "id" TEXT NOT NULL,
    "penaltyRuleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_penalty_histories_pkey" PRIMARY KEY ("id")
);

-- 자료 공유
CREATE TABLE "study_resources" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "fileUrl" TEXT,
    "r2Key" TEXT,
    "category" "StudyResourceCategory" NOT NULL DEFAULT 'LINK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_resources_pkey" PRIMARY KEY ("id")
);

-- UNIQUE 제약
CREATE UNIQUE INDEX "study_weeks_projectId_weekNumber_key" ON "study_weeks"("projectId", "weekNumber");
CREATE UNIQUE INDEX "study_assignment_submissions_assignmentId_userId_key" ON "study_assignment_submissions"("assignmentId", "userId");
CREATE UNIQUE INDEX "study_penalty_rules_projectId_key" ON "study_penalty_rules"("projectId");
CREATE UNIQUE INDEX "study_penalty_consents_penaltyRuleId_userId_key" ON "study_penalty_consents"("penaltyRuleId", "userId");

-- 인덱스
CREATE INDEX "study_weeks_projectId_idx" ON "study_weeks"("projectId");
CREATE INDEX "study_assignments_weekId_idx" ON "study_assignments"("weekId");
CREATE INDEX "study_assignment_submissions_assignmentId_idx" ON "study_assignment_submissions"("assignmentId");
CREATE INDEX "study_assignment_submissions_userId_idx" ON "study_assignment_submissions"("userId");
CREATE INDEX "study_penalty_consents_penaltyRuleId_idx" ON "study_penalty_consents"("penaltyRuleId");
CREATE INDEX "study_penalty_consents_userId_idx" ON "study_penalty_consents"("userId");
CREATE INDEX "study_penalty_histories_penaltyRuleId_idx" ON "study_penalty_histories"("penaltyRuleId");
CREATE INDEX "study_penalty_histories_userId_idx" ON "study_penalty_histories"("userId");
CREATE INDEX "study_resources_projectId_idx" ON "study_resources"("projectId");
CREATE INDEX "study_resources_uploadedById_idx" ON "study_resources"("uploadedById");
CREATE INDEX "study_resources_category_idx" ON "study_resources"("category");

-- 외래키 제약
ALTER TABLE "study_weeks" ADD CONSTRAINT "study_weeks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_assignments" ADD CONSTRAINT "study_assignments_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "study_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_assignment_submissions" ADD CONSTRAINT "study_assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "study_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_assignment_submissions" ADD CONSTRAINT "study_assignment_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_penalty_rules" ADD CONSTRAINT "study_penalty_rules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_penalty_consents" ADD CONSTRAINT "study_penalty_consents_penaltyRuleId_fkey" FOREIGN KEY ("penaltyRuleId") REFERENCES "study_penalty_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_penalty_consents" ADD CONSTRAINT "study_penalty_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_penalty_histories" ADD CONSTRAINT "study_penalty_histories_penaltyRuleId_fkey" FOREIGN KEY ("penaltyRuleId") REFERENCES "study_penalty_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_penalty_histories" ADD CONSTRAINT "study_penalty_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_resources" ADD CONSTRAINT "study_resources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_resources" ADD CONSTRAINT "study_resources_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
