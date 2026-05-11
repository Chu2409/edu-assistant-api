-- CreateTable
CREATE TABLE "lo_progress" (
    "id" SERIAL NOT NULL,
    "learning_object_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "last_visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lo_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lo_progress_user_id_idx" ON "lo_progress"("user_id");

-- CreateIndex
CREATE INDEX "lo_progress_learning_object_id_idx" ON "lo_progress"("learning_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "lo_progress_user_id_learning_object_id_key" ON "lo_progress"("user_id", "learning_object_id");

-- AddForeignKey
ALTER TABLE "lo_progress" ADD CONSTRAINT "lo_progress_learning_object_id_fkey" FOREIGN KEY ("learning_object_id") REFERENCES "learning_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_progress" ADD CONSTRAINT "lo_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
