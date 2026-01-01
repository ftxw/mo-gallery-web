/*
  Warnings:

  - A unique constraint covering the columns `[oauthProvider,oauthId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oauthId" TEXT,
ADD COLUMN     "oauthProvider" TEXT,
ADD COLUMN     "oauthUsername" TEXT,
ADD COLUMN     "trustLevel" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "User_oauthProvider_idx" ON "User"("oauthProvider");

-- CreateIndex
CREATE UNIQUE INDEX "User_oauthProvider_oauthId_key" ON "User"("oauthProvider", "oauthId");
