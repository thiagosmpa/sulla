/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,id]` on the table `Message2` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `Message2` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "unique_chatid_per_sessionid";

-- AlterTable
ALTER TABLE "Message2" ADD COLUMN     "id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "unique_id_per_session_id_5" ON "Message2"("sessionId", "id");
