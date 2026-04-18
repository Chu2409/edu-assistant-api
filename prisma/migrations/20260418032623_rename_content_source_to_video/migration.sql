/*
  Warnings:

  - You are about to drop the `content_sources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `generation_attempts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "content_sources" DROP CONSTRAINT "content_sources_learning_object_id_fkey";

-- DropForeignKey
ALTER TABLE "generation_attempts" DROP CONSTRAINT "generation_attempts_learning_object_id_fkey";

-- DropTable
DROP TABLE "content_sources";

-- DropTable
DROP TABLE "generation_attempts";

-- CreateTable
CREATE TABLE "videos" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("learning_object_id")
);

-- CreateTable
CREATE TABLE "video_generation_attempts" (
    "id" SERIAL NOT NULL,
    "video_id" INTEGER NOT NULL,
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

    CONSTRAINT "video_generation_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "videos_status_idx" ON "videos"("status");

-- CreateIndex
CREATE INDEX "videos_kind_idx" ON "videos"("kind");

-- CreateIndex
CREATE INDEX "video_generation_attempts_video_id_idx" ON "video_generation_attempts"("video_id");

-- CreateIndex
CREATE INDEX "video_generation_attempts_provider_idx" ON "video_generation_attempts"("provider");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_generation_attempts" ADD CONSTRAINT "video_generation_attempts_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("learning_object_id") ON DELETE CASCADE ON UPDATE CASCADE;
