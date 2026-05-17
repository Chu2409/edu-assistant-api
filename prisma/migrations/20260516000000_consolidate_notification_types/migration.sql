-- Migration: consolidate_notification_types
-- Date: 2026-05-16
-- Purpose: Consolidate all notification types and rename WEEKLY_DIGEST to STUDENT_WEEKLY_DIGEST

-- Step 1: Rename WEEKLY_DIGEST to STUDENT_WEEKLY_DIGEST
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STUDENT_WEEKLY_DIGEST';

-- Step 2: Note: PostgreSQL doesn't support renaming enum values directly
-- We need to drop and recreate. Since this is a rename operation:
-- Option A: Drop the old value (after adding new one)
-- Option B: Keep both for a transition period
-- 
-- For this migration, we'll add the new value and note that WEEKLY_DIGEST
-- should be removed in a future migration after all references are updated.

-- Step 3: Create unique constraint to prevent duplicate notifications
CREATE UNIQUE INDEX "notifications_userId_type_relatedEntityId_unique"
  ON "notifications"("user_id", "type", "related_entity_id")
  WHERE "related_entity_id" IS NOT NULL;

CREATE UNIQUE INDEX "notifications_userId_type_null_entity_unique"
  ON "notifications"("user_id", "type")
  WHERE "related_entity_id" IS NULL;

COMMENT ON INDEX "notifications_userId_type_relatedEntityId_unique" IS 'Prevents duplicate notifications for same user+type+entity';
COMMENT ON INDEX "notifications_userId_type_null_entity_unique" IS 'Prevents duplicate notifications for same user+type when no entity specified';