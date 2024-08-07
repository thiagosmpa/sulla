/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `Chat2` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chat2_sessionId_key" ON "Chat2"("sessionId");
