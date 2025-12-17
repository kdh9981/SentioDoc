# SUPABASE DATABASE AUDIT REPORT

> Generated: December 14, 2025
> Codebase: LinkLens Analytics Platform

---

## EXECUTIVE SUMMARY

| Category | Count |
|----------|-------|
| **USED TABLES** | 10 |
| **UNUSED TABLES (Safe to Delete)** | 2 |
| **STORAGE BUCKETS** | 3 |
| **SCHEMA ISSUES** | 1 |

---

## UNUSED TABLES (Safe to Delete)

### 1. `file_tags` (Junction Table - Never Implemented)
- **Status**: NOT USED - Tags stored directly as `text[]` array on `files.tags`
- **Files referencing**: 0
- **Recommendation**: Safe to delete. The M:N junction pattern was never adopted
- **Note**: Tags are managed via `files.tags` array column and `tags` table for definitions

### 2. `contact_tags` (Never Implemented)
- **Status**: NOT USED
- **Files referencing**: 0
- **Recommendation**: Safe to delete

---

## USED TABLES

### Core Tables (High Usage)

| Table | Files Using | Purpose | Notes |
|-------|-------------|---------|-------|
| `files` | 44+ | Core file/link storage | Central table, heavily used |
| `access_logs` | 28+ | Viewer tracking & analytics | Primary analytics data |
| `authorized_users` | 27 | User accounts & subscriptions | Auth + billing + branding |

### Supporting Tables (Medium Usage)

| Table | Files Using | Purpose | Notes |
|-------|-------------|---------|-------|
| `custom_domains` | 6 | Custom domain configuration | DNS verification, SSL |
| `contacts` | 4 | CRM contact storage | Created when viewers submit email. Used by `/api/track/unified`, `/api/viewer/session`, `/api/analytics/export` |
| `tags` | 4 | Tag definitions | Colors, user-specific tags |
| `page_views` | 3 | Per-page document analytics | Detailed page tracking |
| `contact_notes` | 3 | CRM notes for contacts | User notes on viewers |

### Low Usage Tables (Still Active)

| Table | Files Using | Purpose | Notes |
|-------|-------------|---------|-------|
| `page_labels` | 1 | Custom page names | `/dashboard/files/[id]/page.tsx` |
| `utm_templates` | 1 | Saved UTM presets | `/api/utm-templates/route.ts` |
| `video_analytics` | 1 | Video engagement tracking | `/api/track/video/route.ts` |

### Storage Buckets (via Supabase Storage)

| Bucket | Usage | Status |
|--------|-------|--------|
| `files` | Original uploaded files | USED |
| `avatars` | User profile images | USED (SettingsPage.tsx) |
| `pdfs` | Converted PDF versions | Not verified in code |
| `logos` | Custom branding logos | Referenced in docs |

---

## UNUSED COLUMNS (Per Table)

### `files` Table - Potentially Unused Columns

| Column | Status | Notes |
|--------|--------|-------|
| `folder_id` | UNUSED | Folders feature never implemented |
| `cached_views` | REDUNDANT | Duplicate of `cached_total_views` |
| `cached_recent_views` | UNUSED | Not referenced in code |
| `stats_updated_at` | REDUNDANT | Duplicate of `cache_updated_at` |

**DO NOT DELETE:**
- `views` - Still used in `/api/files/route.ts` line 81, 98
- `unique_viewers`, `avg_engagement`, `hot_leads` - Used as direct values (non-cached)
- `cached_last_viewed` - Used as alias

### `access_logs` Table - Potentially Unused Columns

| Column | Status | Notes |
|--------|--------|-------|
| `job_title` | UNUSED | Never populated |
| `linkedin_url` | UNUSED | Never populated |
| `notes` | UNUSED | Not used (contact_notes used instead) |
| `is_flagged` | UNUSED | Not implemented in UI |
| `custom_branding_shown` | UNUSED | Never tracked |
| `time_to_first_interaction` | UNUSED | Never calculated |
| `bounce` | UNUSED | Never calculated |
| `print_count` | UNUSED | Only `is_printed` boolean used |
| `zoom_interactions` | UNUSED | Not tracked in viewer |

### `authorized_users` Table - Potentially Unused Columns

| Column | Status | Notes |
|--------|--------|-------|
| `added_by` | UNUSED | Invite system not implemented |
| `notes` | UNUSED | Admin notes never used |
| `custom_logo_url` | REDUNDANT | Duplicate of `logo_url` |

### `contacts` Table - USED (Do Not Delete!)
- Created when viewers submit email via email gate
- Used by: `/api/track/unified`, `/api/viewer/session`, `/api/analytics/export`, `/api/actions`

---

## TABLES TO FIX (Schema Issues)

### 1. Missing `owner_email` on `access_logs`
**Problem**: `access_logs` requires JOINs to `files` to filter by owner
**Current workaround**: Some code already expects `owner_email` column
**Recommendation**: Add `owner_email TEXT` column to `access_logs` for direct queries
```sql
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS owner_email TEXT;
CREATE INDEX IF NOT EXISTS idx_access_logs_owner_email ON access_logs(owner_email);
```

---

## RECOMMENDED CLEANUP SQL

**⚠️ WARNING: Always backup your database before running cleanup!**

```sql
-- ============================================
-- PHASE 1: Delete Unused Tables (SAFE)
-- ============================================

-- These junction tables were never implemented
DROP TABLE IF EXISTS file_tags CASCADE;
DROP TABLE IF EXISTS contact_tags CASCADE;

-- ============================================
-- PHASE 2: Remove Unused Columns from files (LOW RISK)
-- ============================================

-- Only truly unused columns
ALTER TABLE files DROP COLUMN IF EXISTS folder_id;
ALTER TABLE files DROP COLUMN IF EXISTS cached_views;        -- Duplicate of cached_total_views
ALTER TABLE files DROP COLUMN IF EXISTS cached_recent_views; -- Never used
ALTER TABLE files DROP COLUMN IF EXISTS stats_updated_at;    -- Duplicate of cache_updated_at

-- ============================================
-- PHASE 3: Remove Unused Columns from access_logs (LOW RISK)
-- ============================================

ALTER TABLE access_logs DROP COLUMN IF EXISTS job_title;
ALTER TABLE access_logs DROP COLUMN IF EXISTS linkedin_url;
ALTER TABLE access_logs DROP COLUMN IF EXISTS notes;
ALTER TABLE access_logs DROP COLUMN IF EXISTS is_flagged;
ALTER TABLE access_logs DROP COLUMN IF EXISTS custom_branding_shown;
ALTER TABLE access_logs DROP COLUMN IF EXISTS time_to_first_interaction;
ALTER TABLE access_logs DROP COLUMN IF EXISTS bounce;
ALTER TABLE access_logs DROP COLUMN IF EXISTS print_count;
ALTER TABLE access_logs DROP COLUMN IF EXISTS zoom_interactions;

-- ============================================
-- PHASE 4: Remove Unused Columns from authorized_users (LOW RISK)
-- ============================================

ALTER TABLE authorized_users DROP COLUMN IF EXISTS added_by;
ALTER TABLE authorized_users DROP COLUMN IF EXISTS notes;
ALTER TABLE authorized_users DROP COLUMN IF EXISTS custom_logo_url;

-- ============================================
-- PHASE 5: Add Missing owner_email to access_logs (RECOMMENDED)
-- ============================================

ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS owner_email TEXT;
CREATE INDEX IF NOT EXISTS idx_access_logs_owner_email ON access_logs(owner_email);

-- Backfill existing records
UPDATE access_logs al
SET owner_email = f.user_email
FROM files f
WHERE al.file_id = f.id
AND al.owner_email IS NULL;
```

---

## DO NOT DELETE (Critical!)

| Table/Column | Reason |
|--------------|--------|
| `contacts` table | Used by tracking system to store viewer contacts |
| `files.views` | Used in `/api/files/route.ts` |
| `files.unique_viewers` | Used as non-cached value |
| `files.avg_engagement` | Used as non-cached value |
| `files.hot_leads` | Used as non-cached value |

---

## STORAGE ESTIMATION

Removing unused tables and columns will save:
- **file_tags table**: ~20KB per 1000 associations
- **contact_tags table**: ~20KB per 1000 associations
- **Redundant columns**: ~100 bytes per row

For a database with 10,000 files and 100,000 access_logs:
- Estimated savings: **~5-10 MB**

---

## NOTES

1. **Backup First**: Always export data before dropping tables/columns
2. **Test in Staging**: Run cleanup in a test environment first
3. **Update Code**: No code changes needed since these are already unused
4. **RLS Policies**: May need to update if they reference dropped tables
5. **Contacts Table**: The `contacts` table IS used - it stores viewers who submitted their email through the email gate. The contact detail page (`/api/contacts/[id]`) computes aggregated data from `access_logs`, but the `contacts` table is still written to during tracking.

---

*Report generated by database audit of LinkLens codebase - December 14, 2025*
