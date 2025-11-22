-- Create authorized_users table for managing dashboard access
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS authorized_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);
CREATE INDEX IF NOT EXISTS idx_authorized_users_active ON authorized_users(is_active);

-- Insert current authorized users
INSERT INTO authorized_users (email, name, notes) VALUES
    ('kdh9981@gmail.com', 'Donghyun Kim', 'Initial admin user'),
    ('donghyun.kim@sentio.ltd', 'Donghyun Kim (Sentio)', 'Initial admin user'),
    ('simon.song@sentio.ltd', 'Simon Song', 'Added on 2025-11-22')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to read (for auth checks)
CREATE POLICY "Allow service role to read authorized users"
ON authorized_users
FOR SELECT
TO service_role
USING (true);

-- Policy: Allow service role to manage users
CREATE POLICY "Allow service role to manage authorized users"
ON authorized_users
FOR ALL
TO service_role
USING (true);

-- Grant permissions
GRANT SELECT ON authorized_users TO service_role;
GRANT ALL ON authorized_users TO service_role;
