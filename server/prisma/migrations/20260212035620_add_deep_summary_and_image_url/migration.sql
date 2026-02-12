/*
  Warnings:

  - You are about to drop the column `deepAnalysis` on the `articles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "articles" DROP COLUMN "deepAnalysis",
ADD COLUMN     "deepSummary" TEXT,
ADD COLUMN     "imageUrl" TEXT;
