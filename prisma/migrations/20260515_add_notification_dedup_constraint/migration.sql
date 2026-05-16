-- Migration: add_notification_dedup_constraint
-- Date: 2026-05-15
-- Purpose: Prevent duplicate notifications for same user+type+entity
-- Note: DB is not running, creating migration manually

-- Step 1: Create unique index (PostgreSQL handles this via UNIQUE constraint)
CREATE UNIQUE INDEX "notifications_userId_type_relatedEntityId_unique"
  ON "notifications"("user_id", "type", "related_entity_id")
  WHERE "related_entity_id" IS NOT NULL;

-- Note: For records with NULL relatedEntityId, we need separate handling
-- NULL values are not equal to each other in PostgreSQL unique indexes by default
-- This means same user+type with NULL entity would still allow duplicates
-- To prevent this, we add a partial unique index:
CREATE UNIQUE INDEX "notifications_userId_type_null_entity_unique"
  ON "notifications"("user_id", "type")
  WHERE "related_entity_id" IS NULL;