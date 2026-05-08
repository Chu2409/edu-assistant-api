/*
  Warnings:

  - You are about to drop the column `ai_response_id` on the `learning_objects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "learning_objects" DROP COLUMN "ai_response_id";

-- CreateTable
CREATE TABLE "student_ai_feedbacks" (
    "id" SERIAL NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'WEEKLY_DIGEST',
    "student_id" INTEGER NOT NULL,
    "module_id" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_ai_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_ai_feedbacks_student_id_idx" ON "student_ai_feedbacks"("student_id");

-- CreateIndex
CREATE INDEX "student_ai_feedbacks_module_id_idx" ON "student_ai_feedbacks"("module_id");

-- CreateIndex
CREATE INDEX "student_ai_feedbacks_created_at_idx" ON "student_ai_feedbacks"("created_at");

-- AddForeignKey
ALTER TABLE "student_ai_feedbacks" ADD CONSTRAINT "student_ai_feedbacks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_ai_feedbacks" ADD CONSTRAINT "student_ai_feedbacks_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
