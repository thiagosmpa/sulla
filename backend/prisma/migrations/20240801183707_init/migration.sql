/*
  Warnings:

  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `data` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `pkId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `Session` table. All the data in the column will be lost.
  - Added the required column `name` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Session_sessionId_idx";

-- DropIndex
DROP INDEX "unique_id_per_session_id";

-- AlterTable
ALTER TABLE "Session" DROP CONSTRAINT "Session_pkey",
DROP COLUMN "data",
DROP COLUMN "id",
DROP COLUMN "pkId",
DROP COLUMN "sessionId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("name");
