-- CreateTable
CREATE TABLE "FriendLink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FriendLink_isActive_idx" ON "FriendLink"("isActive");

-- CreateIndex
CREATE INDEX "FriendLink_sortOrder_idx" ON "FriendLink"("sortOrder");

-- CreateIndex
CREATE INDEX "FriendLink_featured_idx" ON "FriendLink"("featured");
