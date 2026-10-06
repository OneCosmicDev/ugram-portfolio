-- The production hashtags table still has an imageId column (NOT NULL) from the
-- pre-normalization schema. The normalize_hashtags_m2m migration was baselined,
-- so the DROP COLUMN never actually ran. This migration removes the stale column.

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hashtags_imageId_fkey') THEN
        ALTER TABLE "hashtags" DROP CONSTRAINT "hashtags_imageId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hashtags' AND column_name = 'imageId'
    ) THEN
        ALTER TABLE "hashtags" DROP COLUMN "imageId";
    END IF;
END $$;
