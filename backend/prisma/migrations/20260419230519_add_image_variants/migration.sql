ALTER TABLE "images" DROP COLUMN "url",
ADD COLUMN     "urlLarge" TEXT,
ADD COLUMN     "urlMedium" TEXT,
ADD COLUMN     "urlSmall" TEXT;
