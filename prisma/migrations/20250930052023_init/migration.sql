/*
  Warnings:

  - You are about to drop the column `content` on the `Record` table. All the data in the column will be lost.
  - Added the required column `cid` to the `Record` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Record" DROP COLUMN "content",
ADD COLUMN     "cid" TEXT NOT NULL;
