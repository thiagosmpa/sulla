/*
  Warnings:

  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Client` table. All the data in the column will be lost.
  - The primary key for the `Group` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Group` table. All the data in the column will be lost.
  - The primary key for the `Professional` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Professional` table. All the data in the column will be lost.
  - The primary key for the `Users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ProfessionalId]` on the table `Professional` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - The required column `clientId` was added to the `Client` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `groupId` was added to the `Group` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `ProfessionalId` was added to the `Professional` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `agenda` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructions` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Users` table without a default value. This is not possible if the table is not empty.
  - The required column `userId` was added to the `Users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Professional" DROP CONSTRAINT "Professional_groupId_fkey";

-- DropIndex
DROP INDEX "Users_email_key";

-- DropIndex
DROP INDEX "Users_username_key";

-- AlterTable
ALTER TABLE "Client" DROP CONSTRAINT "Client_pkey",
DROP COLUMN "id",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("clientId");

-- AlterTable
ALTER TABLE "Group" DROP CONSTRAINT "Group_pkey",
DROP COLUMN "id",
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD CONSTRAINT "Group_pkey" PRIMARY KEY ("groupId");

-- AlterTable
ALTER TABLE "Professional" DROP CONSTRAINT "Professional_pkey",
DROP COLUMN "id",
ADD COLUMN     "ProfessionalId" TEXT NOT NULL,
ADD CONSTRAINT "Professional_pkey" PRIMARY KEY ("ProfessionalId");

-- AlterTable
ALTER TABLE "Users" DROP CONSTRAINT "Users_pkey",
DROP COLUMN "email",
DROP COLUMN "id",
DROP COLUMN "password",
DROP COLUMN "username",
ADD COLUMN     "agenda" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "instructions" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("userId");

-- CreateTable
CREATE TABLE "Chats" (
    "chatId" TEXT NOT NULL,
    "history" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Chats_chatId_key" ON "Chats"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_ProfessionalId_key" ON "Professional"("ProfessionalId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_userId_key" ON "Users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_name_key" ON "Users"("name");

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chats" ADD CONSTRAINT "Chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
