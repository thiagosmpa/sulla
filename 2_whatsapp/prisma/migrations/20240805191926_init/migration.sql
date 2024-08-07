/*
  Warnings:

  - The primary key for the `Users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `pkId` on the `Users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" DROP CONSTRAINT "Users_pkey",
DROP COLUMN "pkId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "sessionId" SET DATA TYPE TEXT,
ALTER COLUMN "agenda" SET DATA TYPE TEXT,
ALTER COLUMN "connectionStatus" SET DATA TYPE TEXT,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("sessionId");

-- CreateTable
CREATE TABLE "Chat2" (
    "chatId" TEXT NOT NULL,
    "history" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat2_chatId_key" ON "Chat2"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_name_key" ON "Users"("name");

-- AddForeignKey
ALTER TABLE "Chat2" ADD CONSTRAINT "Chat2_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Users"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;
