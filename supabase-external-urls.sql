-- Add support for external URL tracking
-- Run this in your Supabase SQL Editor

-- Add type and external_url columns to files table
ALTER TABLE files
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'file' CHECK (type IN ('file', 'url')),
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);

-- Update existing records to type='file' (for backward compatibility)
UPDATE files SET type = 'file' WHERE type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN files.type IS 'Type of content: file (uploaded document) or url (external link)';
COMMENT ON COLUMN files.external_url IS 'Destination URL for type=url entries';
