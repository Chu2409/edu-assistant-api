-- AlterTable
ALTER TABLE "video_generation_attempts" ADD COLUMN     "instruction" TEXT,
ADD COLUMN     "previous_content" JSONB;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "has_manual_edits" BOOLEAN NOT NULL DEFAULT false;
