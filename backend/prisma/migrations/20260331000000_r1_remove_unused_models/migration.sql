-- R-1: 불필요한 모델 삭제 (Organization, MentorProfile, ChatRoom, ProjectFile)
-- FLOWIT 방향과 맞지 않는 모델 제거 + UserRole enum 단순화

-- ========================
-- 1. NotificationType enum 수정 (MENTORING_REQUEST 제거)
-- ========================
-- 기존 MENTORING_REQUEST 알림 데이터 삭제
DELETE FROM "notifications" WHERE "type" = 'MENTORING_REQUEST';

BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'COMMENT_ADDED', 'HELP_REQUESTED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- ========================
-- 2. UserRole enum 수정 (GENERAL_USER → USER, CERTIFIED_MENTOR → ADMIN)
-- ========================
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'GENERAL_USER' THEN 'USER'::"UserRole_new"
    WHEN 'CERTIFIED_MENTOR' THEN 'ADMIN'::"UserRole_new"
    ELSE 'USER'::"UserRole_new"
  END
);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- ========================
-- 3. Foreign Key 제약 삭제
-- ========================
ALTER TABLE "_UserChatRooms" DROP CONSTRAINT IF EXISTS "_UserChatRooms_A_fkey";
ALTER TABLE "_UserChatRooms" DROP CONSTRAINT IF EXISTS "_UserChatRooms_B_fkey";
ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_chatRoomId_fkey";
ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_senderId_fkey";
ALTER TABLE "mentor_profiles" DROP CONSTRAINT IF EXISTS "mentor_profiles_userId_fkey";
ALTER TABLE "mentoring_requests" DROP CONSTRAINT IF EXISTS "mentoring_requests_mentorId_fkey";
ALTER TABLE "mentoring_requests" DROP CONSTRAINT IF EXISTS "mentoring_requests_mentorProfileId_fkey";
ALTER TABLE "mentoring_requests" DROP CONSTRAINT IF EXISTS "mentoring_requests_userId_fkey";
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_approvedById_fkey";
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_organizationId_fkey";
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_userId_fkey";
ALTER TABLE "organization_promotions" DROP CONSTRAINT IF EXISTS "organization_promotions_createdById_fkey";
ALTER TABLE "organization_promotions" DROP CONSTRAINT IF EXISTS "organization_promotions_organizationId_fkey";
ALTER TABLE "project_files" DROP CONSTRAINT IF EXISTS "project_files_projectId_fkey";
ALTER TABLE "project_files" DROP CONSTRAINT IF EXISTS "project_files_uploadedById_fkey";
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_organizationId_fkey";

-- ========================
-- 4. 인덱스 삭제
-- ========================
DROP INDEX IF EXISTS "projects_organizationId_idx";

-- ========================
-- 5. projects 테이블에서 organizationId 컬럼 삭제
-- ========================
ALTER TABLE "projects" DROP COLUMN IF EXISTS "organizationId";

-- ========================
-- 6. 테이블 삭제 (순서 중요: 참조 테이블 먼저)
-- ========================
DROP TABLE IF EXISTS "_UserChatRooms";
DROP TABLE IF EXISTS "chat_messages";
DROP TABLE IF EXISTS "chat_rooms";
DROP TABLE IF EXISTS "mentoring_requests";
DROP TABLE IF EXISTS "mentor_profiles";
DROP TABLE IF EXISTS "organization_members";
DROP TABLE IF EXISTS "organization_promotions";
DROP TABLE IF EXISTS "organizations";
DROP TABLE IF EXISTS "project_files";

-- ========================
-- 7. Enum 삭제
-- ========================
DROP TYPE IF EXISTS "OrganizationMemberRole";
DROP TYPE IF EXISTS "OrganizationMemberStatus";
