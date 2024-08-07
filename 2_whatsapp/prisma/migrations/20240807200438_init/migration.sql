/*
  Warnings:

  - You are about to drop the column `chatId` on the `Message2` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Message2` table. All the data in the column will be lost.
  - Added the required column `content` to the `Message2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `Message2` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message2" DROP COLUMN "chatId",
DROP COLUMN "message",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL;
