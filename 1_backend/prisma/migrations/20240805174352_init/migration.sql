/*
  Warnings:

  - Added the required column `agenda` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `connectionStatus` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructions` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "agenda" VARCHAR(255) NOT NULL,
ADD COLUMN     "connectionStatus" VARCHAR(255) NOT NULL,
ADD COLUMN     "instructions" TEXT NOT NULL;
