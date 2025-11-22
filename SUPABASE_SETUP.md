# Supabase Setup Instructions

Before running the migrated code, you need to set up the Supabase database and storage.

## Step 1: Set Up Database Schema

1. Open your Supabase dashboard: https://ttllrrekzrbxxixkocdw.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase-setup.sql` in this project
5. Copy all the SQL content and paste it into the SQL Editor
6. Click **Run** button (or press Ctrl+Enter)
7. Verify success - you should see "Success. No rows returned"

## Step 2: Verify Tables Created

1. Click **Table Editor** in the left sidebar
2. You should see 3 tables:
   - ✅ `files`
   - ✅ `access_logs`
   - ✅ `page_views`

## Step 3: Set Up Storage Bucket

1. Click **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Configure the bucket:
   - **Name:** `uploaded-files`
   - **Public bucket:** Toggle ON (files need to be publicly accessible)
   - **File size limit:** 50 MB
   - **Allowed MIME types:** Leave empty (allow all)
4. Click **Create bucket**

## Step 4: Configure Storage Policies

1. Click on the `uploaded-files` bucket
2. Click **Policies** tab
3. We need two policies:

### Policy 1: Public Read Access
Click **New Policy** → Choose **For full customization**

```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploaded-files' );
```

### Policy 2: Service Role Upload/Delete
Click **New Policy** → Choose **For full customization**

```sql
CREATE POLICY "Allow service role full access"
ON storage.objects FOR ALL
USING ( bucket_id = 'uploaded-files' AND auth.role() = 'service_role' );
```

## Verification Checklist

- [ ] Database tables created (files, access_logs, page_views)
- [ ] Indexes created successfully
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket `uploaded-files` created
- [ ] Storage bucket is public
- [ ] Storage policies configured

## Next Steps

Once you've completed the above steps, the code migration will work correctly. The application will:
- Store file metadata in PostgreSQL
- Store actual files in Supabase Storage
- Track analytics in the database tables

**Let me know when you've completed these steps and I'll continue with the API migration!**
