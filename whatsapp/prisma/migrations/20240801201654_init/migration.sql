/*
  Warnings:

  - Added the required column `connectionStatus` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "connectionStatus" TEXT NOT NULL;
