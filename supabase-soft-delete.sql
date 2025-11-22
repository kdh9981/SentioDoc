-- Add deleted_at column to files table for soft delete
ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at);
