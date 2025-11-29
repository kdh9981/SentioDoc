-- Add column for converted PDF path
ALTER TABLE files
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_files_pdf_path ON files(pdf_path);
