-- Migration: Make access_logs self-contained for Contact page
-- Add file_name and owner_email columns, backfill from files table

-- Step 1: Add new columns
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Step 2: Backfill existing data from files table
UPDATE access_logs al
SET
  file_name = f.name,
  owner_email = f.user_email
FROM files f
WHERE al.file_id = f.id
  AND (al.file_name IS NULL OR al.owner_email IS NULL);

-- Step 3: Create index for efficient contact queries
CREATE INDEX IF NOT EXISTS idx_access_logs_owner_email ON access_logs(owner_email);
CREATE INDEX IF NOT EXISTS idx_access_logs_owner_viewer ON access_logs(owner_email, viewer_email);

-- Step 4: Verify backfill (run this SELECT to check)
-- SELECT COUNT(*) as total, COUNT(file_name) as has_name, COUNT(owner_email) as has_owner FROM access_logs;
