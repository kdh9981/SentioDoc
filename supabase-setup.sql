# Supabase Database Setup Script

This SQL script should be executed in your Supabase SQL Editor to set up the database schema.

## How to Run

1. Go to https://ttllrrekzrbxxixkocdw.supabase.co
2. Navigate to: SQL Editor (in left sidebar)
3. Click "New Query"
4. Copy and paste the SQL below
5. Click "Run" button

---

## SQL Schema Script

```sql
-- ================================================
-- FILES TABLE
-- ================================================
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  views INTEGER DEFAULT 0
);

-- ================================================
-- ACCESS LOGS TABLE
-- ================================================
CREATE TABLE access_logs (
  id SERIAL PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  viewer_name TEXT NOT NULL,
  viewer_email TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  country TEXT
);

-- ================================================
-- PAGE VIEWS TABLE
-- ================================================
CREATE TABLE page_views (
  id SERIAL PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  viewer_email TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  duration_seconds REAL NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX idx_access_logs_file_id ON access_logs(file_id);
CREATE INDEX idx_access_logs_accessed_at ON access_logs(accessed_at DESC);
CREATE INDEX idx_page_views_file_id ON page_views(file_id);
CREATE INDEX idx_files_created_at ON files(created_at DESC);

-- ================================================
-- HELPER FUNCTION: Increment File Views
-- ================================================
CREATE OR REPLACE FUNCTION increment_file_views(file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE files SET views = views + 1 WHERE id = file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Allow public read access to files (for viewing)
CREATE POLICY "Allow public read access to files"
  ON files FOR SELECT
  USING (true);

-- Allow service role full access to files
CREATE POLICY "Allow service role full access to files"
  ON files FOR ALL
  USING (auth.role() = 'service_role');

-- Allow service role full access to access_logs
CREATE POLICY "Allow service role full access to access_logs"
  ON access_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Allow service role full access to page_views
CREATE POLICY "Allow service role full access to page_views"
  ON page_views FOR ALL
  USING (auth.role() = 'service_role');
```

---

## Verification

After running the script, verify the tables were created:

1. In Supabase Dashboard, go to: Table Editor
2. You should see three tables:
   - `files`
   - `access_logs`
   - `page_views`

3. Check that all indexes are created by running:
```sql
SELECT indexname FROM pg_indexes WHERE tablename IN ('files', 'access_logs', 'page_views');
```
