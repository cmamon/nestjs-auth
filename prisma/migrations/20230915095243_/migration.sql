/*
  Warnings:

  - You are about to drop the column `fromAddress` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `fromLat` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `fromLng` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `toAddress` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `toLat` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `toLng` on the `Ride` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `fromLatitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromLocation` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromLongitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toLatitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toLocation` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toLongitude` to the `Ride` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "fromAddress",
DROP COLUMN "fromLat",
DROP COLUMN "fromLng",
DROP COLUMN "toAddress",
DROP COLUMN "toLat",
DROP COLUMN "toLng",
ADD COLUMN     "fromLatitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fromLocation" TEXT NOT NULL,
ADD COLUMN     "fromLongitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "toLatitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "toLocation" TEXT NOT NULL,
ADD COLUMN     "toLongitude" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ALTER COLUMN "firstName" SET DEFAULT '',
ALTER COLUMN "lastName" SET DEFAULT '',
ALTER COLUMN "phone" SET DEFAULT '',
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "Role";
