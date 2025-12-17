# LinkLens Database Schema Documentation

> Complete database schema reference for LinkLens Analytics Platform
> Last Updated: 2025-12-07

## Pending Schema Changes

Run these SQL commands in **Supabase Dashboard > SQL Editor**:

```sql
-- Add missing columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS video_duration_seconds integer;
ALTER TABLE files ADD COLUMN IF NOT EXISTS cached_views_today integer DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add missing columns to access_logs table (December 2025 update)
-- 1. file_type column (pdf, pptx, mp4, png, url, etc.)
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 2. traffic_source column (social, search, direct, email, qr, referral)
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS traffic_source TEXT;

-- 3. pages_time_data JSONB column for per-page tracking
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS pages_time_data JSONB DEFAULT '{}';

-- 4. original_referrer to capture external referrer before redirect
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS original_referrer TEXT;

-- 5. Ensure is_downloaded exists
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS is_downloaded BOOLEAN DEFAULT FALSE;

-- 6. Ensure download_count exists
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- 7. Ensure print/copy tracking exists
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS print_attempted BOOLEAN DEFAULT FALSE;
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS copy_attempted BOOLEAN DEFAULT FALSE;

-- 8. Session end timestamp
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS session_end_at TIMESTAMPTZ;

-- 9. Video tracking fields
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS watch_time_seconds INTEGER DEFAULT 0;
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS video_completion_percent INTEGER DEFAULT 0;
```

## Overview

LinkLens uses **Supabase PostgreSQL** as its primary database. All tables use Row Level Security (RLS) policies to ensure data isolation between users.

**Database URL**: `ttllrrekzrbxxixkocdw.supabase.co`

---

## Table of Contents

1. [Core Tables](#core-tables)
   - [files](#files)
   - [access_logs](#access_logs)
   - [page_views](#page_views)
   - [video_analytics](#video_analytics)
2. [User Management](#user-management)
   - [authorized_users](#authorized_users)
3. [Organization](#organization)
   - [contacts](#contacts)
   - [tags](#tags)
   - [file_tags](#file_tags)
4. [Custom Domains](#custom-domains)
   - [custom_domains](#custom_domains)
5. [Relationships](#relationships)
6. [Indexes](#indexes)
7. [RLS Policies](#rls-policies)

---

## Core Tables

### files

The central table storing all uploaded files and external URLs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `uuid_generate_v4()` | Primary key |
| `name` | text | YES | | Display name (user-editable) |
| `path` | text | YES | | Storage path in Supabase bucket |
| `mime_type` | text | YES | | File MIME type (e.g., 'application/pdf') |
| `size` | bigint | YES | | File size in bytes |
| `created_at` | timestamptz | YES | `now()` | Upload timestamp |
| `views` | integer | YES | `0` | Legacy view count (deprecated) |
| `slug` | text | YES | | Custom URL slug |
| `deleted_at` | timestamptz | YES | | Soft delete timestamp |
| `type` | text | YES | `'file'` | Content type: 'file' or 'url' |
| `external_url` | text | YES | | URL for external links |
| `custom_domain_id` | uuid | YES | | FK to custom_domains |
| `pdf_path` | text | YES | | Converted PDF path for non-PDF files |
| `user_email` | text | YES | | Owner's email address |
| `expires_at` | timestamptz | YES | | Link expiration date |
| `password_hash` | text | YES | | Bcrypt hash for password protection |
| `require_email` | boolean | YES | `false` | Require viewer email |
| `is_active` | boolean | YES | `true` | Link active status |
| `total_pages` | integer | YES | | Total pages for PDFs/documents |
| `require_name` | boolean | YES | `false` | Require viewer name |
| `allow_download` | boolean | YES | `true` | Allow file download |
| `allow_print` | boolean | YES | `true` | Allow printing |
| `cached_health_score` | integer | YES | | Cached engagement score (0-100) |
| `cached_total_views` | integer | YES | | Cached total view count |
| `cached_unique_viewers` | integer | YES | | Cached unique viewer count |
| `cached_avg_engagement` | numeric | YES | | Cached average engagement |
| `cached_hot_leads` | integer | YES | | Cached hot lead count |
| `cache_updated_at` | timestamptz | YES | | Last cache update time |
| `is_favorite` | boolean | YES | `false` | User favorite flag |
| `notes` | text | YES | | User notes |
| `folder_id` | uuid | YES | | FK to folders (if implemented) |
| `tags` | text[] | YES | | Array of tag names |
| `cached_views` | integer | YES | | Alternative cached views |
| `cached_last_viewed` | timestamptz | YES | | Last view timestamp |
| `cached_recent_views` | integer | YES | | Views in last 7 days |
| `stats_updated_at` | timestamptz | YES | | Stats last updated |
| `cached_last_viewed_at` | timestamptz | YES | | Alternate last viewed |
| `unique_viewers` | integer | YES | | Direct unique viewer count |
| `avg_engagement` | numeric | YES | | Direct avg engagement |
| `hot_leads` | integer | YES | | Direct hot leads count |
| `cached_qr_scans` | integer | YES | | QR code scan count |

**Constraints**:
- Primary Key: `id`
- Foreign Key: `custom_domain_id` → `custom_domains.id`
- Unique: `slug` (when not null)

---

### access_logs

Comprehensive viewer activity tracking. One record per file view session.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `uuid_generate_v4()` | Primary key |
| `file_id` | uuid | YES | | FK to files |
| `viewer_name` | text | YES | | Captured viewer name |
| `viewer_email` | text | YES | | Captured viewer email |
| `accessed_at` | timestamptz | YES | `now()` | View start time |
| `ip_address` | inet | YES | | Viewer IP (hashed/anonymized) |
| `user_agent` | text | YES | | Raw user agent string |
| `country` | text | YES | | GeoIP country |
| `city` | text | YES | | GeoIP city |
| `region` | text | YES | | GeoIP region/state |
| `device_type` | text | YES | | 'desktop', 'mobile', 'tablet' |
| `browser` | text | YES | | Browser name |
| `os` | text | YES | | Operating system |
| `referrer` | text | YES | | HTTP referrer URL |
| `session_id` | text | YES | | Unique session identifier |
| `is_return_visit` | boolean | YES | `false` | Returning viewer flag |
| `traffic_source` | text | YES | | Source: 'direct', 'email', 'social', etc. |
| `link_type` | text | YES | | 'file' or 'url' |
| `external_url` | text | YES | | For URL links |
| `total_duration_seconds` | integer | YES | `0` | Total time spent viewing |
| `pages_viewed` | integer | YES | `0` | Number of pages viewed |
| `max_page_reached` | integer | YES | `0` | Highest page number viewed |
| `scroll_depth` | integer | YES | `0` | Maximum scroll depth (%) |
| `download_count` | integer | YES | `0` | Number of downloads |
| `print_count` | integer | YES | `0` | Number of prints |
| `zoom_interactions` | integer | YES | `0` | Zoom actions count |
| `engagement_score` | integer | YES | | Calculated engagement (0-100) |
| `intent_signal` | text | YES | | 'hot', 'warm', 'cold' |
| `utm_source` | text | YES | | UTM source parameter |
| `utm_medium` | text | YES | | UTM medium parameter |
| `utm_campaign` | text | YES | | UTM campaign parameter |
| `utm_term` | text | YES | | UTM term parameter |
| `utm_content` | text | YES | | UTM content parameter |
| `is_downloaded` | boolean | YES | `false` | File was downloaded |
| `is_printed` | boolean | YES | `false` | File was printed |
| `viewer_metadata` | jsonb | YES | | Additional viewer data |
| `unique_pages_viewed` | integer | YES | | Distinct pages viewed |
| `last_activity_at` | timestamptz | YES | | Last interaction time |
| `is_completed` | boolean | YES | `false` | Session completed flag |
| `company` | text | YES | | Inferred company name |
| `job_title` | text | YES | | Inferred job title |
| `linkedin_url` | text | YES | | LinkedIn profile URL |
| `notes` | text | YES | | Internal notes |
| `is_flagged` | boolean | YES | `false` | Flagged for follow-up |
| `video_watch_time` | integer | YES | `0` | Total video watch seconds |
| `video_completion_rate` | numeric | YES | | Video completion (0-100) |
| `qr_scan` | boolean | YES | `false` | Accessed via QR code |
| `custom_branding_shown` | boolean | YES | | Custom branding displayed |
| `password_protected` | boolean | YES | `false` | Required password |
| `email_captured` | boolean | YES | `false` | Email was captured |
| `time_to_first_interaction` | integer | YES | | Seconds to first action |
| `bounce` | boolean | YES | `false` | Left without interaction |

**Constraints**:
- Primary Key: `id`
- Foreign Key: `file_id` → `files.id`

---

### page_views

Per-page analytics for documents. One record per page per session.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `uuid_generate_v4()` | Primary key |
| `file_id` | uuid | YES | | FK to files |
| `viewer_email` | text | YES | | Viewer email |
| `page_number` | integer | YES | | Page number (1-indexed) |
| `duration_seconds` | integer | YES | `0` | Time on page |
| `viewed_at` | timestamptz | YES | `now()` | View timestamp |
| `access_log_id` | uuid | YES | | FK to access_logs |
| `is_return_to_page` | boolean | YES | `false` | Returned to this page |
| `scroll_depth_percentage` | integer | YES | | Scroll depth (0-100) |
| `zoom_level` | numeric | YES | | Zoom percentage |
| `revisit_count` | integer | YES | `0` | Times revisited |
| `time_to_scroll` | integer | YES | | Seconds before scrolling |
| `interaction_count` | integer | YES | `0` | Total interactions |
| `is_entry_page` | boolean | YES | `false` | First page viewed |
| `is_exit_page` | boolean | YES | `false` | Last page viewed |

**Constraints**:
- Primary Key: `id`
- Foreign Key: `file_id` → `files.id`
- Foreign Key: `access_log_id` → `access_logs.id`

---

### video_analytics

Video engagement tracking for embedded videos.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `uuid_generate_v4()` | Primary key |
| `access_log_id` | uuid | YES | | FK to access_logs |
| `file_id` | uuid | YES | | FK to files |
| `video_url` | text | YES | | Video source URL |
| `video_platform` | text | YES | | 'youtube', 'vimeo', 'native' |
| `video_duration_seconds` | integer | YES | | Total video length |
| `watch_time_seconds` | integer | YES | `0` | Time watched |
| `completion_percentage` | numeric | YES | `0` | Completion rate (0-100) |
| `play_count` | integer | YES | `0` | Number of plays |
| `pause_count` | integer | YES | `0` | Number of pauses |
| `seek_count` | integer | YES | `0` | Number of seeks |
| `max_position_seconds` | integer | YES | `0` | Furthest position reached |
| `finished` | boolean | YES | `false` | Video completed |
| `created_at` | timestamptz | YES | `now()` | Record creation |
| `updated_at` | timestamptz | YES | `now()` | Last update |

**Constraints**:
- Primary Key: `id`
- Foreign Key: `access_log_id` → `access_logs.id`
- Foreign Key: `file_id` → `files.id`

---

## User Management

### authorized_users

User accounts and subscription management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `uuid_generate_v4()` | Primary key |
| `email` | text | NO | | User email (unique) |
| `name` | text | YES | | Display name |
| `added_at` | timestamptz | YES | `now()` | Account creation |
| `added_by` | text | YES | | Invited by email |
| `is_active` | boolean | YES | `true` | Account active |
| `notes` | text | YES | | Admin notes |
| `tier` | text | YES | `'free'` | 'free', 'starter', 'pro' |
| `stripe_customer_id` | text | YES | | Stripe customer ID |
| `subscription_status` | text | YES | | 'active', 'canceled', etc. |
| `subscription_ends_at` | timestamptz | YES | | Subscription end date |
| `links_count` | integer | YES | `0` | Number of active links |
| `storage_used_bytes` | bigint | YES | `0` | Storage consumption |
| `logo_url` | text | YES | | Custom logo URL |
| `password_hash` | text | YES | | For email/password auth |
| `auth_provider` | text | YES | `'google'` | 'google', 'email' |
| `email_verified` | boolean | YES | `false` | Email verified flag |
| `verification_token` | text | YES | | Email verification token |
| `verification_token_expires` | timestamptz | YES | | Token expiration |
| `custom_logo_url` | text | YES | | Alternate logo field |
| `brand_color` | text | YES | | Hex brand color |

**Constraints**:
- Primary Key: `id`
- Unique: `email`

---

## Organization

### contacts

Contact management for viewers (CRM-like features).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `uuid_generate_v4()` | Primary key |
| `email` | text | NO | | Contact email |
| `name` | text | YES | | Contact name |
| `company` | text | YES | | Company name |
| `job_title` | text | YES | | Job title |
| `phone` | text | YES | | Phone number |
| `notes` | text | YES | | User notes |
| `user_email` | text | YES | | Owner's email |
| `created_at` | timestamptz | YES | `now()` | Created timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last updated |
| `last_activity_at` | timestamptz | YES | | Last view activity |
| `total_views` | integer | YES | `0` | Total file views |
| `avg_engagement` | numeric | YES | | Average engagement score |
| `tags` | text[] | YES | | Array of tag names |

**Constraints**:
- Primary Key: `id`
- Unique: `(email, user_email)` - One contact per user

---

### tags

Tag definitions for organizing files.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `uuid_generate_v4()` | Primary key |
| `name` | text | NO | | Tag name |
| `color` | text | YES | `'#3B82F6'` | Hex color |
| `user_email` | text | YES | | Owner's email |
| `created_at` | timestamptz | YES | `now()` | Created timestamp |

**Constraints**:
- Primary Key: `id`
- Unique: `(name, user_email)` - Unique tag names per user

---

### file_tags

Junction table for file-tag relationships.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `file_id` | uuid | NO | | FK to files |
| `tag_id` | uuid | NO | | FK to tags |
| `created_at` | timestamptz | YES | `now()` | Association timestamp |

**Constraints**:
- Primary Key: `(file_id, tag_id)`
- Foreign Key: `file_id` → `files.id`
- Foreign Key: `tag_id` → `tags.id`

---

## Custom Domains

### custom_domains

Custom domain configuration for branded links.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `uuid_generate_v4()` | Primary key |
| `domain` | text | NO | | Domain name |
| `user_email` | text | NO | | Owner's email |
| `is_verified` | boolean | YES | `false` | DNS verified |
| `verification_token` | text | YES | | DNS TXT record value |
| `created_at` | timestamptz | YES | `now()` | Created timestamp |
| `verified_at` | timestamptz | YES | | Verification timestamp |
| `ssl_status` | text | YES | | SSL certificate status |

**Constraints**:
- Primary Key: `id`
- Unique: `domain`

---

## Relationships

```
authorized_users
      │
      │ 1:N (user_email)
      ▼
    files ◄────────────────────┐
      │                        │
      │ 1:N (file_id)          │ 1:N (file_id)
      ▼                        │
  access_logs ─────────────────┤
      │                        │
      │ 1:N (access_log_id)    │
      ▼                        │
  page_views                   │
                               │
  video_analytics ─────────────┘

files ◄─────► custom_domains (N:1)
files ◄─────► file_tags ◄─────► tags (M:N)
authorized_users ◄────► contacts (1:N via user_email)
```

---

## Indexes

### Recommended Indexes

```sql
-- files table
CREATE INDEX idx_files_user_email ON files(user_email);
CREATE INDEX idx_files_slug ON files(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NULL;

-- access_logs table
CREATE INDEX idx_access_logs_file_id ON access_logs(file_id);
CREATE INDEX idx_access_logs_accessed_at ON access_logs(accessed_at DESC);
CREATE INDEX idx_access_logs_viewer_email ON access_logs(viewer_email);
CREATE INDEX idx_access_logs_session_id ON access_logs(session_id);
CREATE INDEX idx_access_logs_engagement ON access_logs(engagement_score DESC);

-- page_views table
CREATE INDEX idx_page_views_file_id ON page_views(file_id);
CREATE INDEX idx_page_views_access_log_id ON page_views(access_log_id);

-- video_analytics table
CREATE INDEX idx_video_analytics_access_log_id ON video_analytics(access_log_id);
CREATE INDEX idx_video_analytics_file_id ON video_analytics(file_id);
```

---

## RLS Policies

### files

```sql
-- Users can only see their own files
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (user_email = auth.jwt()->>'email');

-- Users can insert files with their email
CREATE POLICY "Users can insert own files" ON files
  FOR INSERT WITH CHECK (user_email = auth.jwt()->>'email');

-- Users can update their own files
CREATE POLICY "Users can update own files" ON files
  FOR UPDATE USING (user_email = auth.jwt()->>'email');

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON files
  FOR DELETE USING (user_email = auth.jwt()->>'email');
```

### access_logs

```sql
-- Users can view logs for their files
CREATE POLICY "Users can view own file logs" ON access_logs
  FOR SELECT USING (
    file_id IN (SELECT id FROM files WHERE user_email = auth.jwt()->>'email')
  );

-- Anyone can insert access logs (for tracking)
CREATE POLICY "Anyone can insert access logs" ON access_logs
  FOR INSERT WITH CHECK (true);
```

### authorized_users

```sql
-- Users can view their own record
CREATE POLICY "Users can view own record" ON authorized_users
  FOR SELECT USING (email = auth.jwt()->>'email');

-- Users can update their own record
CREATE POLICY "Users can update own record" ON authorized_users
  FOR UPDATE USING (email = auth.jwt()->>'email');
```

---

## Calculation Formulas

### Engagement Score (0-100)

```javascript
function calculateEngagementScore({
  totalDuration,     // seconds
  pagesViewed,
  totalPages,
  scrollDepth,       // 0-100
  downloads,
  prints,
  isReturnVisit
}) {
  // Time factor (max 30 points)
  const timeScore = Math.min((totalDuration / 60) * 5, 30);

  // Completion factor (max 30 points)
  const completionRate = totalPages > 0 ? (pagesViewed / totalPages) : 0;
  const completionScore = completionRate * 30;

  // Scroll depth (max 15 points)
  const scrollScore = (scrollDepth / 100) * 15;

  // Actions (max 15 points)
  const actionScore = Math.min((downloads * 5) + (prints * 5), 15);

  // Return visit bonus (max 10 points)
  const returnBonus = isReturnVisit ? 10 : 0;

  return Math.min(Math.round(
    timeScore + completionScore + scrollScore + actionScore + returnBonus
  ), 100);
}
```

### Intent Signal

```javascript
function calculateIntentSignal(engagementScore, isReturnVisit, isDownloaded) {
  if (engagementScore >= 70 || (engagementScore >= 50 && isReturnVisit)) {
    return 'hot';
  }
  if (engagementScore >= 40 || isDownloaded) {
    return 'warm';
  }
  return 'cold';
}
```

---

## Storage Buckets

### Supabase Storage

| Bucket | Purpose | Access |
|--------|---------|--------|
| `files` | Original uploaded files | Private |
| `pdfs` | Converted PDF versions | Private |
| `logos` | User custom logos | Public |

---

## Notes

1. **Schema Caching**: Supabase may cache schemas. After adding columns, use `supabase db reset` or wait for cache refresh.

2. **Soft Deletes**: The `deleted_at` column in `files` enables soft deletion. Filter with `WHERE deleted_at IS NULL`.

3. **Cached Columns**: Columns prefixed with `cached_` are denormalized for performance. Update via scheduled jobs or triggers.

4. **Email as FK**: We use `user_email` as a foreign key rather than user ID for simpler queries and RLS policies.

5. **JSONB Usage**: The `viewer_metadata` column in `access_logs` stores additional tracking data as JSON for flexibility.

---

*Generated from production database schema - December 2025*
