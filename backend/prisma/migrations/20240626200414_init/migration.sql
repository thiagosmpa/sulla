/*
  Warnings:

  - The primary key for the `Chats` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Chats" DROP CONSTRAINT "Chats_pkey";
