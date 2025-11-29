-- ================================================
-- PDF CONVERSION MIGRATION
-- ================================================
-- This migration adds support for storing PDF versions of Office documents
-- Run this in Supabase SQL Editor

-- Add pdf_path column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add comment for documentation
COMMENT ON COLUMN files.pdf_path IS 'Path to the PDF version of Office documents (DOCX, XLSX, PPTX)';
