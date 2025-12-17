-- Migration: Create/Update contact_notes table for aggregated contacts
-- Contact identification is by user_id + contact_email (not contact_id)

-- Drop old table if exists with old schema
DROP TABLE IF EXISTS contact_notes;

-- Create contact_notes table
CREATE TABLE contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_contact_notes_user_contact ON contact_notes(user_id, contact_email);
CREATE INDEX idx_contact_notes_created ON contact_notes(created_at DESC);

-- Enable RLS
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own notes
CREATE POLICY "Users can manage their own contact notes"
  ON contact_notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON contact_notes TO authenticated;
