/*
  Warnings:

  - Added the required column `canAnswer` to the `Chat2` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chat2" ADD COLUMN     "canAnswer" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "Message2" (
    "sessionId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Message2_sessionId_key" ON "Message2"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Message2_chatId_key" ON "Message2"("chatId");
