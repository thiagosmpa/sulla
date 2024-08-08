/*
  Warnings:

  - You are about to drop the column `history` on the `Chat2` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat2" DROP COLUMN "history",
ADD COLUMN     "archived" BOOLEAN,
ADD COLUMN     "botInactiveSince" TIMESTAMP(3),
ADD COLUMN     "hasDisappearingMessages" BOOLEAN,
ADD COLUMN     "isGroup" BOOLEAN;
