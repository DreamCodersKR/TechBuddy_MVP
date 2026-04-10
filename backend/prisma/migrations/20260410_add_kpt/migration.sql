-- CreateTable
CREATE TABLE "kpt_retrospectives" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "sprintId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "keeps" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "problems" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "tries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "kpt_retrospectives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kpt_retrospectives_sprintId_userId_key" ON "kpt_retrospectives"("sprintId", "userId");
CREATE INDEX "kpt_retrospectives_sprintId_idx" ON "kpt_retrospectives"("sprintId");

-- AddForeignKey
ALTER TABLE "kpt_retrospectives" ADD CONSTRAINT "kpt_retrospectives_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kpt_retrospectives" ADD CONSTRAINT "kpt_retrospectives_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "kpt_summaries" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "sprintId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kpt_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kpt_summaries_sprintId_key" ON "kpt_summaries"("sprintId");

-- AddForeignKey
ALTER TABLE "kpt_summaries" ADD CONSTRAINT "kpt_summaries_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
