-- CreateEnum
CREATE TYPE "ExpoStatus" AS ENUM ('Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "ExpoRole" AS ENUM ('Admin', 'Manager', 'Member');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('Active', 'Removed');

-- CreateTable
CREATE TABLE "expos" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "venueName" TEXT NOT NULL,
    "venueAddress" TEXT NOT NULL,
    "capacity" INTEGER,
    "status" "ExpoStatus" NOT NULL DEFAULT 'Draft',
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "registrationDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expo_categories" (
    "expoId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expo_categories_pkey" PRIMARY KEY ("expoId","categoryId")
);

-- CreateTable
CREATE TABLE "expo_memberships" (
    "id" TEXT NOT NULL,
    "expoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ExpoRole" NOT NULL DEFAULT 'Member',
    "status" "MembershipStatus" NOT NULL DEFAULT 'Active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "expo_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expos_slug_key" ON "expos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "expo_memberships_expoId_userId_key" ON "expo_memberships"("expoId", "userId");

-- AddForeignKey
ALTER TABLE "expos" ADD CONSTRAINT "expos_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expo_categories" ADD CONSTRAINT "expo_categories_expoId_fkey" FOREIGN KEY ("expoId") REFERENCES "expos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expo_categories" ADD CONSTRAINT "expo_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expo_memberships" ADD CONSTRAINT "expo_memberships_expoId_fkey" FOREIGN KEY ("expoId") REFERENCES "expos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expo_memberships" ADD CONSTRAINT "expo_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
