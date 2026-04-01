/*
  Warnings:

  - You are about to drop the column `page_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `page_id` on the `blocks` table. All the data in the column will be lost.
  - You are about to drop the column `page_id` on the `media_resources` table. All the data in the column will be lost.
  - You are about to drop the column `most_viewed_page_id` on the `module_metrics` table. All the data in the column will be lost.
  - You are about to drop the column `page_id` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `page_id` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `page_id` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `page_id` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `page_id` on the `student_questions` table. All the data in the column will be lost.
  - You are about to drop the `page_concepts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `page_feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `page_relations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `page_views` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pages` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[learning_object_id,order_index]` on the table `blocks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,learning_object_id]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `learning_object_id` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `learning_object_id` to the `blocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `learning_object_id` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `learning_object_id` to the `student_questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_page_id_fkey";

-- DropForeignKey
ALTER TABLE "blocks" DROP CONSTRAINT "blocks_page_id_fkey";

-- DropForeignKey
ALTER TABLE "media_resources" DROP CONSTRAINT "media_resources_page_id_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_page_id_fkey";

-- DropForeignKey
ALTER TABLE "page_concepts" DROP CONSTRAINT "page_concepts_page_id_fkey";

-- DropForeignKey
ALTER TABLE "page_feedback" DROP CONSTRAINT "page_feedback_page_id_fkey";

-- DropForeignKey
ALTER TABLE "page_feedback" DROP CONSTRAINT "page_feedback_user_id_fkey";

-- DropForeignKey
ALTER TABLE "page_relations" DROP CONSTRAINT "page_relations_origin_page_id_fkey";

-- DropForeignKey
ALTER TABLE "page_relations" DROP CONSTRAINT "page_relations_related_page_id_fkey";

-- DropForeignKey
ALTER TABLE "page_views" DROP CONSTRAINT "page_views_page_id_fkey";

-- DropForeignKey
ALTER TABLE "page_views" DROP CONSTRAINT "page_views_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pages" DROP CONSTRAINT "pages_module_id_fkey";

-- DropForeignKey
ALTER TABLE "podcasts" DROP CONSTRAINT "podcasts_page_id_fkey";

-- DropForeignKey
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_page_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_page_id_fkey";

-- DropForeignKey
ALTER TABLE "student_questions" DROP CONSTRAINT "student_questions_page_id_fkey";

-- DropIndex
DROP INDEX "activities_page_id_idx";

-- DropIndex
DROP INDEX "blocks_page_id_order_index_key";

-- DropIndex
DROP INDEX "media_resources_page_id_idx";

-- DropIndex
DROP INDEX "notes_page_id_idx";

-- DropIndex
DROP INDEX "podcasts_page_id_idx";

-- DropIndex
DROP INDEX "prompts_page_id_idx";

-- DropIndex
DROP INDEX "sessions_user_id_page_id_key";

-- DropIndex
DROP INDEX "student_questions_page_id_idx";


-- ===========================================
-- CUSTOM MIGRATION FOR DATA PRESERVATION (1:N)
-- ===========================================

-- Drop old indexes from tables that we will rename, so Prisma can recreate them smoothly
DROP INDEX IF EXISTS "pages_module_id_idx";
DROP INDEX IF EXISTS "pages_module_id_order_index_key";

DROP INDEX IF EXISTS "page_concepts_page_id_idx";
DROP INDEX IF EXISTS "page_concepts_page_id_term_key";

DROP INDEX IF EXISTS "page_relations_origin_page_id_idx";
DROP INDEX IF EXISTS "page_relations_related_page_id_idx";
DROP INDEX IF EXISTS "page_relations_is_embedded_idx";
DROP INDEX IF EXISTS "page_relations_origin_page_id_related_page_id_key";

DROP INDEX IF EXISTS "page_views_user_id_idx";
DROP INDEX IF EXISTS "page_views_page_id_idx";
DROP INDEX IF EXISTS "page_views_is_completed_idx";
DROP INDEX IF EXISTS "page_views_user_id_page_id_key";

DROP INDEX IF EXISTS "page_feedback_page_id_idx";
DROP INDEX IF EXISTS "page_feedback_user_id_idx";


-- 1. Rename Tables
ALTER TABLE "pages" RENAME TO "learning_objects";
ALTER TABLE "page_concepts" RENAME TO "lo_concepts";
ALTER TABLE "page_relations" RENAME TO "lo_relations";
ALTER TABLE "page_views" RENAME TO "lo_views";
ALTER TABLE "page_feedback" RENAME TO "lo_feedbacks";

-- Rename sequences
ALTER SEQUENCE "pages_id_seq" RENAME TO "learning_objects_id_seq";
ALTER SEQUENCE "page_concepts_id_seq" RENAME TO "lo_concepts_id_seq";
ALTER SEQUENCE "page_relations_id_seq" RENAME TO "lo_relations_id_seq";
ALTER SEQUENCE "page_views_id_seq" RENAME TO "lo_views_id_seq";
ALTER SEQUENCE "page_feedback_id_seq" RENAME TO "lo_feedbacks_id_seq";

-- Rename primary keys
ALTER TABLE "learning_objects" RENAME CONSTRAINT "pages_pkey" TO "learning_objects_pkey";
ALTER TABLE "lo_concepts" RENAME CONSTRAINT "page_concepts_pkey" TO "lo_concepts_pkey";
ALTER TABLE "lo_relations" RENAME CONSTRAINT "page_relations_pkey" TO "lo_relations_pkey";
ALTER TABLE "lo_views" RENAME CONSTRAINT "page_views_pkey" TO "lo_views_pkey";
ALTER TABLE "lo_feedbacks" RENAME CONSTRAINT "page_feedback_pkey" TO "lo_feedbacks_pkey";

-- 2. Rename Columns
ALTER TABLE "activities" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "blocks" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "media_resources" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "module_metrics" RENAME COLUMN "most_viewed_page_id" TO "most_viewed_lo_id";
ALTER TABLE "notes" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "podcasts" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "prompts" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "sessions" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "student_questions" RENAME COLUMN "page_id" TO "learning_object_id";

ALTER TABLE "lo_concepts" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "lo_views" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "lo_feedbacks" RENAME COLUMN "page_id" TO "learning_object_id";
ALTER TABLE "lo_relations" RENAME COLUMN "origin_page_id" TO "origin_lo_id";
ALTER TABLE "lo_relations" RENAME COLUMN "related_page_id" TO "related_lo_id";

-- 3. Create lo_types
CREATE TABLE "lo_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lo_types_pkey" PRIMARY KEY ("id")
);

INSERT INTO "lo_types" ("name", "updated_at") VALUES ('PAGE', NOW());

-- 4. Add type_id to learning_objects
ALTER TABLE "learning_objects" ADD COLUMN "type_id" INTEGER;
UPDATE "learning_objects" SET "type_id" = (SELECT id FROM "lo_types" WHERE "name" = 'PAGE');
ALTER TABLE "learning_objects" ALTER COLUMN "type_id" SET NOT NULL;

-- ===========================================

-- CreateIndex
CREATE UNIQUE INDEX "lo_types_name_key" ON "lo_types"("name");

-- CreateIndex
CREATE INDEX "learning_objects_module_id_idx" ON "learning_objects"("module_id");

-- CreateIndex
CREATE INDEX "learning_objects_type_id_idx" ON "learning_objects"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_objects_module_id_order_index_key" ON "learning_objects"("module_id", "order_index");

-- CreateIndex
CREATE INDEX "lo_views_user_id_idx" ON "lo_views"("user_id");

-- CreateIndex
CREATE INDEX "lo_views_learning_object_id_idx" ON "lo_views"("learning_object_id");

-- CreateIndex
CREATE INDEX "lo_views_is_completed_idx" ON "lo_views"("is_completed");

-- CreateIndex
CREATE UNIQUE INDEX "lo_views_user_id_learning_object_id_key" ON "lo_views"("user_id", "learning_object_id");

-- CreateIndex
CREATE INDEX "lo_relations_origin_lo_id_idx" ON "lo_relations"("origin_lo_id");

-- CreateIndex
CREATE INDEX "lo_relations_related_lo_id_idx" ON "lo_relations"("related_lo_id");

-- CreateIndex
CREATE INDEX "lo_relations_is_embedded_idx" ON "lo_relations"("is_embedded");

-- CreateIndex
CREATE UNIQUE INDEX "lo_relations_origin_lo_id_related_lo_id_key" ON "lo_relations"("origin_lo_id", "related_lo_id");

-- CreateIndex
CREATE INDEX "lo_concepts_learning_object_id_idx" ON "lo_concepts"("learning_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "lo_concepts_learning_object_id_term_key" ON "lo_concepts"("learning_object_id", "term");

-- CreateIndex
CREATE INDEX "lo_feedbacks_learning_object_id_idx" ON "lo_feedbacks"("learning_object_id");

-- CreateIndex
CREATE INDEX "lo_feedbacks_user_id_idx" ON "lo_feedbacks"("user_id");

-- CreateIndex
CREATE INDEX "activities_learning_object_id_idx" ON "activities"("learning_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_learning_object_id_order_index_key" ON "blocks"("learning_object_id", "order_index");

-- CreateIndex
CREATE INDEX "media_resources_learning_object_id_idx" ON "media_resources"("learning_object_id");

-- CreateIndex
CREATE INDEX "notes_learning_object_id_idx" ON "notes"("learning_object_id");

-- CreateIndex
CREATE INDEX "podcasts_learning_object_id_idx" ON "podcasts"("learning_object_id");

-- CreateIndex
CREATE INDEX "prompts_learning_object_id_idx" ON "prompts"("learning_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_user_id_learning_object_id_key" ON "sessions"("user_id", "learning_object_id");

-- CreateIndex
CREATE INDEX "student_questions_learning_object_id_idx" ON "student_questions"("learning_object_id");

-- AddForeignKey
ALTER TABLE "learning_objects" ADD CONSTRAINT "learning_objects_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "lo_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objects" ADD CONSTRAINT "learning_objects_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_views" ADD CONSTRAINT "lo_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_views" ADD CONSTRAINT "lo_views_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_relations" ADD CONSTRAINT "lo_relations_origin_lo_id_fkey" FOREIGN KEY ("origin_lo_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_relations" ADD CONSTRAINT "lo_relations_related_lo_id_fkey" FOREIGN KEY ("related_lo_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_concepts" ADD CONSTRAINT "lo_concepts_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_feedbacks" ADD CONSTRAINT "lo_feedbacks_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_feedbacks" ADD CONSTRAINT "lo_feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_questions" ADD CONSTRAINT "student_questions_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_resources" ADD CONSTRAINT "media_resources_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
