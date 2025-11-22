-- Add slug column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create a unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_files_slug ON files(slug);

-- Optional: Backfill existing files with slugs (using ID as fallback or generating one)
-- For simplicity, we can just set slug = id for existing rows if we want, or leave null
-- But better to generate something. For now, let's leave it nullable and handle nulls in app logic
-- or we can try to generate slugs from names for existing files:

-- UPDATE files SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
-- Note: The above might fail if duplicates exist.
-- Safer to just add the column and let new uploads get slugs.
