-- CreateEnum
CREATE TYPE "TeacherFeedbackScope" AS ENUM ('LEARNING_OBJECT', 'MODULE');

-- CreateTable
CREATE TABLE "teacher_ai_feedbacks" (
    "id" SERIAL NOT NULL,
    "scope" "TeacherFeedbackScope" NOT NULL,
    "module_id" INTEGER NOT NULL,
    "learning_object_id" INTEGER,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_ai_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_ai_feedbacks_module_id_idx" ON "teacher_ai_feedbacks"("module_id");

-- CreateIndex
CREATE INDEX "teacher_ai_feedbacks_learning_object_id_idx" ON "teacher_ai_feedbacks"("learning_object_id");

-- CreateIndex
CREATE INDEX "teacher_ai_feedbacks_created_at_idx" ON "teacher_ai_feedbacks"("created_at");

-- AddForeignKey
ALTER TABLE "teacher_ai_feedbacks" ADD CONSTRAINT "teacher_ai_feedbacks_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_ai_feedbacks" ADD CONSTRAINT "teacher_ai_feedbacks_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
