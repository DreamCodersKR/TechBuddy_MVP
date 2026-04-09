-- DRE-239: Sprint.createdById FK 추가
-- 1. orphan 데이터 확인 (이 쿼리로 0건이어야 FK 추가 성공)
-- SELECT s."createdById" FROM "sprints" s LEFT JOIN "users" u ON s."createdById" = u.id WHERE u.id IS NULL;

-- 2. FK 제약 추가
ALTER TABLE "sprints"
  ADD CONSTRAINT "sprints_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. 인덱스 추가
CREATE INDEX "sprints_createdById_idx" ON "sprints"("createdById");
