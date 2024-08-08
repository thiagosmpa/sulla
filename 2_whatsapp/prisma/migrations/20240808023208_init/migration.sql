/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,chatId]` on the table `Chat2` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Chat2" DROP CONSTRAINT "Chat2_sessionId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "unique_id_per_chat_id" ON "Chat2"("sessionId", "chatId");
