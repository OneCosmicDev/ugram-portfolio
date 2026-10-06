-- Create hashtags table if it was missing (old schema may not have had it)
CREATE TABLE IF NOT EXISTS "hashtags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "hashtags_name_key" ON "hashtags"("name");
CREATE INDEX IF NOT EXISTS "hashtags_name_idx" ON "hashtags"("name");

-- Create image_hashtags join table if it was missing
CREATE TABLE IF NOT EXISTS "image_hashtags" (
    "imageId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    CONSTRAINT "image_hashtags_pkey" PRIMARY KEY ("imageId","hashtagId")
);

-- Create image_mentions table if it was missing
CREATE TABLE IF NOT EXISTS "image_mentions" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "image_mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "image_mentions_imageId_userId_key" ON "image_mentions"("imageId", "userId");

-- Add foreign keys safely (skip if they already exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'image_hashtags_imageId_fkey') THEN
        ALTER TABLE "image_hashtags" ADD CONSTRAINT "image_hashtags_imageId_fkey"
        FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'image_hashtags_hashtagId_fkey') THEN
        ALTER TABLE "image_hashtags" ADD CONSTRAINT "image_hashtags_hashtagId_fkey"
        FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'image_mentions_imageId_fkey') THEN
        ALTER TABLE "image_mentions" ADD CONSTRAINT "image_mentions_imageId_fkey"
        FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'image_mentions_userId_fkey') THEN
        ALTER TABLE "image_mentions" ADD CONSTRAINT "image_mentions_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
