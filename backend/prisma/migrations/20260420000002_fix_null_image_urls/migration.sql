-- Fix seed images that have NULL URL fields (from old schema before add_image_variants)
UPDATE "images"
SET
  "urlSmall"  = 'https://picsum.photos/seed/' || "id" || '/300/300',
  "urlMedium" = 'https://picsum.photos/seed/' || "id" || '/600/600',
  "urlLarge"  = 'https://picsum.photos/seed/' || "id" || '/1080/1080'
WHERE "urlSmall" IS NULL AND "urlMedium" IS NULL AND "urlLarge" IS NULL;
