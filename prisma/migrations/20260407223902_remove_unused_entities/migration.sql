/*
  Warnings:

  - You are about to drop the `lo_views` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prompts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "lo_views" DROP CONSTRAINT "lo_views_learning_object_id_fkey";

-- DropForeignKey
ALTER TABLE "lo_views" DROP CONSTRAINT "lo_views_user_id_fkey";

-- DropForeignKey
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_learning_object_id_fkey";

-- DropForeignKey
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_user_id_fkey";

-- DropTable
DROP TABLE "lo_views";

-- DropTable
DROP TABLE "prompts";
