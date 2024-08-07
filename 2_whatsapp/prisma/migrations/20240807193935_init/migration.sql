/*
  Warnings:

  - You are about to drop the column `id` on the `Message2` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "unique_id_per_session_id_5";

-- AlterTable
ALTER TABLE "Message2" DROP COLUMN "id";
