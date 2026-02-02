/*
  Warnings:

  - You are about to drop the column `keywords` on the `articles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "articles" DROP COLUMN "keywords",
ADD COLUMN     "impactType" TEXT,
ADD COLUMN     "sentiment" TEXT;
