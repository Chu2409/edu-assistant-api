-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "AiTargetLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AiAudience" AS ENUM ('HIGH_SCHOOL', 'UNIVERSITY', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "AiLength" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- CreateEnum
CREATE TYPE "AiTone" AS ENUM ('FORMAL', 'EDUCATIONAL', 'CASUAL');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEXT', 'CODE', 'IMAGE', 'IMAGE_SUGGESTION');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'developer', 'tool', 'system');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('SEMANTIC', 'PREREQUISITE', 'COMPLEMENTARY', 'DEEPENING', 'APPLIED_EXAMPLE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MATCH');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('PAGE_CONTENT', 'EXPLANATION', 'SUMMARY', 'QUIZ', 'PODCAST_SCRIPT', 'REFINEMENT', 'RELATED_CONTENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_PAGE', 'PAGE_UPDATE', 'CONCEPT_ADDED', 'SUGGESTED_CONTENT', 'QUESTION_ANSWERED', 'TEACHER_REPLY', 'EXCESSIVE_USE_WARNING', 'MODULE_UPDATE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "microsoft_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "profile_picture" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "teacher_id" INTEGER NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "allow_self_enroll" BOOLEAN NOT NULL DEFAULT true,
    "allow_self_unenroll" BOOLEAN NOT NULL DEFAULT true,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_configurations" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "target_level" "AiTargetLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "audience" "AiAudience" NOT NULL DEFAULT 'UNIVERSITY',
    "content_length" "AiLength" NOT NULL DEFAULT 'MEDIUM',
    "tone" "AiTone" NOT NULL DEFAULT 'EDUCATIONAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "embedding" vector(1536),
    "keywords" TEXT[],
    "compiled_content" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "ai_response_id" TEXT,
    "has_manual_edits" BOOLEAN NOT NULL DEFAULT false,
    "concepts_processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL,
    "content" JSONB NOT NULL,
    "tip_tap_content" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "page_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "role" "MessageRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sessionId" INTEGER NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "page_id" INTEGER NOT NULL,
    "first_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at" TIMESTAMP(3) NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 1,
    "time_spent" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_relations" (
    "id" SERIAL NOT NULL,
    "origin_page_id" INTEGER NOT NULL,
    "related_page_id" INTEGER NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "relation_type" "RelationType" NOT NULL,
    "mention_text" TEXT NOT NULL,
    "explanation" TEXT,
    "is_embedded" BOOLEAN NOT NULL DEFAULT false,
    "embedded_at" TIMESTAMP(3),
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_concepts" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "type" "ActivityType" NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB,
    "explanation" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "order_index" INTEGER NOT NULL,
    "is_approved_by_teacher" BOOLEAN NOT NULL DEFAULT false,
    "used_as_example" BOOLEAN NOT NULL DEFAULT false,
    "generated_from_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_attempts" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_answer" JSONB NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_feedback" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_questions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "page_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_replies" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reply_text" TEXT NOT NULL,
    "is_from_teacher" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_entity_id" INTEGER,
    "related_entity_type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcasts" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "audio_url" TEXT NOT NULL,
    "duration" INTEGER,
    "script_content" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_resources" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER,
    "type" "MediaType" NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_metrics" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "average_completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "most_viewed_page_id" INTEGER,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_microsoft_id_key" ON "users"("microsoft_id");

-- CreateIndex
CREATE INDEX "users_microsoft_id_idx" ON "users"("microsoft_id");

-- CreateIndex
CREATE INDEX "modules_teacher_id_idx" ON "modules"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_configurations_module_id_key" ON "ai_configurations"("module_id");

-- CreateIndex
CREATE INDEX "enrollments_user_id_idx" ON "enrollments"("user_id");

-- CreateIndex
CREATE INDEX "enrollments_module_id_idx" ON "enrollments"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_module_id_key" ON "enrollments"("user_id", "module_id");

-- CreateIndex
CREATE INDEX "pages_module_id_idx" ON "pages"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_module_id_order_index_key" ON "pages"("module_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_page_id_order_index_key" ON "blocks"("page_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_user_id_page_id_key" ON "sessions"("user_id", "page_id");

-- CreateIndex
CREATE INDEX "page_views_user_id_idx" ON "page_views"("user_id");

-- CreateIndex
CREATE INDEX "page_views_page_id_idx" ON "page_views"("page_id");

-- CreateIndex
CREATE INDEX "page_views_is_completed_idx" ON "page_views"("is_completed");

-- CreateIndex
CREATE UNIQUE INDEX "page_views_user_id_page_id_key" ON "page_views"("user_id", "page_id");

-- CreateIndex
CREATE INDEX "page_relations_origin_page_id_idx" ON "page_relations"("origin_page_id");

-- CreateIndex
CREATE INDEX "page_relations_related_page_id_idx" ON "page_relations"("related_page_id");

-- CreateIndex
CREATE INDEX "page_relations_is_embedded_idx" ON "page_relations"("is_embedded");

-- CreateIndex
CREATE UNIQUE INDEX "page_relations_origin_page_id_related_page_id_key" ON "page_relations"("origin_page_id", "related_page_id");

-- CreateIndex
CREATE INDEX "page_concepts_page_id_idx" ON "page_concepts"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "page_concepts_page_id_term_key" ON "page_concepts"("page_id", "term");

-- CreateIndex
CREATE INDEX "activities_page_id_idx" ON "activities"("page_id");

-- CreateIndex
CREATE INDEX "activities_is_approved_by_teacher_idx" ON "activities"("is_approved_by_teacher");

-- CreateIndex
CREATE INDEX "activities_used_as_example_idx" ON "activities"("used_as_example");

-- CreateIndex
CREATE INDEX "activity_attempts_activity_id_idx" ON "activity_attempts"("activity_id");

-- CreateIndex
CREATE INDEX "activity_attempts_user_id_idx" ON "activity_attempts"("user_id");

-- CreateIndex
CREATE INDEX "activity_attempts_is_correct_idx" ON "activity_attempts"("is_correct");

-- CreateIndex
CREATE INDEX "prompts_page_id_idx" ON "prompts"("page_id");

-- CreateIndex
CREATE INDEX "prompts_user_id_idx" ON "prompts"("user_id");

-- CreateIndex
CREATE INDEX "page_feedback_page_id_idx" ON "page_feedback"("page_id");

-- CreateIndex
CREATE INDEX "page_feedback_user_id_idx" ON "page_feedback"("user_id");

-- CreateIndex
CREATE INDEX "notes_page_id_idx" ON "notes"("page_id");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "student_questions_user_id_idx" ON "student_questions"("user_id");

-- CreateIndex
CREATE INDEX "student_questions_page_id_idx" ON "student_questions"("page_id");

-- CreateIndex
CREATE INDEX "student_questions_is_public_idx" ON "student_questions"("is_public");

-- CreateIndex
CREATE INDEX "question_replies_question_id_idx" ON "question_replies"("question_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "podcasts_page_id_idx" ON "podcasts"("page_id");

-- CreateIndex
CREATE INDEX "media_resources_page_id_idx" ON "media_resources"("page_id");

-- CreateIndex
CREATE INDEX "media_resources_type_idx" ON "media_resources"("type");

-- CreateIndex
CREATE UNIQUE INDEX "module_metrics_module_id_key" ON "module_metrics"("module_id");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_configurations" ADD CONSTRAINT "ai_configurations_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_relations" ADD CONSTRAINT "page_relations_origin_page_id_fkey" FOREIGN KEY ("origin_page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_relations" ADD CONSTRAINT "page_relations_related_page_id_fkey" FOREIGN KEY ("related_page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_concepts" ADD CONSTRAINT "page_concepts_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_generated_from_id_fkey" FOREIGN KEY ("generated_from_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_feedback" ADD CONSTRAINT "page_feedback_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_feedback" ADD CONSTRAINT "page_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_questions" ADD CONSTRAINT "student_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_questions" ADD CONSTRAINT "student_questions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_replies" ADD CONSTRAINT "question_replies_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "student_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_replies" ADD CONSTRAINT "question_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_resources" ADD CONSTRAINT "media_resources_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_metrics" ADD CONSTRAINT "module_metrics_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
