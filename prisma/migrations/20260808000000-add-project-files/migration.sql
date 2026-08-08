-- AlterTable
ALTER TABLE "File" ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "taskId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "File_projectId_idx" ON "File"("projectId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
