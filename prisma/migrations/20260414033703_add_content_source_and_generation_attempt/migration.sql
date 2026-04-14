-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('YOUTUBE_URL', 'VIDEO_FILE');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'EXTRACTING', 'GENERATING', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BlockType" ADD VALUE 'SUMMARY';
ALTER TYPE "BlockType" ADD VALUE 'FLASHCARDS';
ALTER TYPE "BlockType" ADD VALUE 'QUIZ';
ALTER TYPE "BlockType" ADD VALUE 'GLOSSARY';

-- CreateTable
CREATE TABLE "content_sources" (
    "id" SERIAL NOT NULL,
    "learning_object_id" INTEGER NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "source_url" VARCHAR(1000) NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "output_language" VARCHAR(10) NOT NULL DEFAULT 'auto',
    "raw_text" TEXT,
    "detected_language" VARCHAR(10),
    "duration_seconds" DOUBLE PRECISION,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_attempts" (
    "id" SERIAL NOT NULL,
    "learning_object_id" INTEGER NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "requested_types" "BlockType"[],
    "completed_types" "BlockType"[],
    "failed_types" JSONB,
    "tokens_input" INTEGER,
    "tokens_output" INTEGER,
    "processing_time_ms" INTEGER,
    "quality_metrics" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "generation_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_sources_learning_object_id_key" ON "content_sources"("learning_object_id");

-- CreateIndex
CREATE INDEX "content_sources_status_idx" ON "content_sources"("status");

-- CreateIndex
CREATE INDEX "content_sources_kind_idx" ON "content_sources"("kind");

-- CreateIndex
CREATE INDEX "generation_attempts_learning_object_id_idx" ON "generation_attempts"("learning_object_id");

-- CreateIndex
CREATE INDEX "generation_attempts_provider_idx" ON "generation_attempts"("provider");

-- AddForeignKey
ALTER TABLE "content_sources" ADD CONSTRAINT "content_sources_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_attempts" ADD CONSTRAINT "generation_attempts_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
