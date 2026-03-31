-- R-2: 기존 모델 수정
-- TaskStatus REVIEW 추가, TaskPriority URGENT 추가
-- ProjectRole 단순화 (ADMIN/MEMBER/MENTOR)
-- WorkspaceType enum 추가, Project 모델 필드 추가
-- UserPlan enum 추가, User 모델 필드 추가

-- ========================
-- 1. TaskStatus enum에 REVIEW 추가
-- ========================
ALTER TYPE "TaskStatus" ADD VALUE 'REVIEW' AFTER 'IN_PROGRESS';

-- ========================
-- 2. TaskPriority enum에 URGENT 추가
-- ========================
ALTER TYPE "TaskPriority" ADD VALUE 'URGENT';

-- ========================
-- 3. WorkspaceType enum 생성 + projects 테이블 컬럼 추가
-- ========================
CREATE TYPE "WorkspaceType" AS ENUM ('PROJECT', 'STUDY');

ALTER TABLE "projects" ADD COLUMN "type"          "WorkspaceType" NOT NULL DEFAULT 'PROJECT';
ALTER TABLE "projects" ADD COLUMN "techStack"     TEXT[]         NOT NULL DEFAULT '{}';
ALTER TABLE "projects" ADD COLUMN "coverImageUrl" TEXT;
ALTER TABLE "projects" ADD COLUMN "githubUrl"     TEXT;

CREATE INDEX "projects_type_idx" ON "projects"("type");

-- ========================
-- 4. UserPlan enum 생성 + users 테이블 컬럼 추가
-- ========================
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PRO', 'PREMIUM');

ALTER TABLE "users" ADD COLUMN "plan"         "UserPlan" NOT NULL DEFAULT 'FREE';
ALTER TABLE "users" ADD COLUMN "credit"       INTEGER    NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "githubUrl"    TEXT;
ALTER TABLE "users" ADD COLUMN "portfolioUrl" TEXT;

-- ========================
-- 5. ProjectRole enum 수정 (PM→ADMIN, TEAM_LEADER→MEMBER)
-- ========================
BEGIN;
CREATE TYPE "ProjectRole_new" AS ENUM ('ADMIN', 'MEMBER', 'MENTOR');
ALTER TABLE "project_members" ALTER COLUMN "role" TYPE "ProjectRole_new" USING (
  CASE "role"::text
    WHEN 'PM'          THEN 'ADMIN'::"ProjectRole_new"
    WHEN 'TEAM_LEADER' THEN 'MEMBER'::"ProjectRole_new"
    WHEN 'MEMBER'      THEN 'MEMBER'::"ProjectRole_new"
    WHEN 'MENTOR'      THEN 'MENTOR'::"ProjectRole_new"
    ELSE 'MEMBER'::"ProjectRole_new"
  END
);
ALTER TYPE "ProjectRole" RENAME TO "ProjectRole_old";
ALTER TYPE "ProjectRole_new" RENAME TO "ProjectRole";
DROP TYPE "public"."ProjectRole_old";
COMMIT;
