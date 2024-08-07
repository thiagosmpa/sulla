/*
  Warnings:

  - You are about to drop the column `canAnswer` on the `Chat2` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionId,chatId]` on the table `Message2` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Message2_chatId_key";

-- DropIndex
DROP INDEX "Message2_sessionId_key";

-- AlterTable
ALTER TABLE "Chat2" DROP COLUMN "canAnswer",
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Message2" ADD COLUMN     "pkId" SERIAL NOT NULL,
ADD CONSTRAINT "Message2_pkey" PRIMARY KEY ("pkId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_chatid_per_sessionid" ON "Message2"("sessionId", "chatId");
