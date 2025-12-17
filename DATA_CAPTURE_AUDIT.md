# DATA CAPTURE PIPELINE AUDIT REPORT

**Date**: December 8, 2025
**Status**: COMPREHENSIVE AUDIT - DO NOT FIX YET

---

## Executive Summary

**Critical Issues Found: 6**
**Working Correctly: 7**
**Partial: 3**

The main issue is **fragmented tracking architecture** - there are multiple tracking systems that don't work together:
1. `analyticsTracker.ts` singleton (NOT USED by main viewer)
2. Custom tracking in `FileViewer.tsx` (USED for PDFs)
3. Separate tracking in each viewer component

---

## 1. DATABASE SCHEMA STATUS

### files table
| Column | Exists | Used |
|--------|--------|------|
| `id` | ✅ | Primary key |
| `type` | ✅ | 'file' or 'url' |
| `mime_type` | ✅ | File MIME type |
| `views` | ✅ | Counter (via RPC) |
| `total_pages` | ✅ | PDF page count |
| `link_type` | ❌ | **MISSING - no file vs track_site distinction** |
| `file_extension` | ❌ | **MISSING** |

### access_logs table
| Column | Exists | Being Set | Working |
|--------|--------|-----------|---------|
| `file_id` | ✅ | ✅ | ✅ |
| `viewer_name` | ✅ | ✅ | ✅ |
| `viewer_email` | ✅ | ✅ | ✅ |
| `referrer_url` | ✅ | ✅ | ⚠️ Shows internal URL, not external |
| `referrer_source` | ✅ | ✅ | ⚠️ Often shows "other" |
| `traffic_source` | ✅ | ❌ | ❌ **NEVER SET** |
| `country` | ✅ | ✅ | ✅ |
| `city` | ✅ | ✅ | ✅ |
| `region` | ✅ | ✅ | ✅ (just fixed) |
| `device_type` | ✅ | ✅ | ✅ |
| `os` | ✅ | ✅ | ✅ |
| `browser` | ✅ | ✅ | ✅ |
| `language` | ✅ | ✅ | ✅ |
| `utm_source` | ✅ | ✅ | ✅ |
| `utm_medium` | ✅ | ✅ | ✅ |
| `utm_campaign` | ✅ | ✅ | ✅ |
| `utm_term` | ✅ | ✅ | ✅ |
| `utm_content` | ✅ | ✅ | ✅ |
| `access_method` | ✅ | ✅ | ✅ |
| `is_return_visit` | ✅ | ✅ | ✅ |
| `return_visit_count` | ✅ | ✅ | ✅ |
| `pages_viewed_count` | ✅ | ⚠️ | ❌ **ALWAYS 0** |
| `max_page_reached` | ✅ | ⚠️ | ❌ **ALWAYS 0** |
| `total_pages` | ✅ | ✅ | ⚠️ Set to 0 initially |
| `completion_percentage` | ✅ | ⚠️ | ❌ **ALWAYS 0** |
| `total_duration_seconds` | ✅ | ⚠️ | ❌ **ALWAYS 0** |
| `pages_time_data` | ❌ | ❌ | ❌ **COLUMN DOESN'T EXIST IN SCHEMA** |
| `entry_page` | ✅ | ✅ | ✅ Set to 1 |
| `exit_page` | ✅ | ⚠️ | ❌ Set to 0 initially, not updated |
| `downloaded` | ✅ | ⚠️ | ⚠️ Sent but wrong field name |
| `is_downloaded` | ✅ | ✅ | ✅ (just fixed) |
| `download_count` | ✅ | ⚠️ | ⚠️ Sent but may not update |
| `print_attempted` | ✅ | ⚠️ | ⚠️ Only via analyticsTracker |
| `copy_attempted` | ✅ | ⚠️ | ⚠️ Only via analyticsTracker |
| `engagement_score` | ✅ | ⚠️ | ⚠️ Set to 0 initially, may not update |
| `intent_signal` | ✅ | ✅ | ⚠️ Set to 'cold' initially, may not update |
| `link_type` | ✅ | ❌ | ❌ **NEVER SET** |
| `file_type` | ❌ | ❌ | ❌ **COLUMN DOESN'T EXIST** |

### page_views table
| Column | Exists | Being Set | Working |
|--------|--------|-----------|---------|
| All columns | ✅ | ❌ | ❌ **TABLE NOT POPULATED** |

**Evidence**: The page_views API exists at `/api/track/page-enhanced` but NO viewer calls it.

---

## 2. TRACKING ARCHITECTURE PROBLEM

### Current Fragmented Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRACKING ARCHITECTURE (BROKEN)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  analyticsTracker.ts (SINGLETON)                                    │
│  ├── Tracks: pages, duration, downloads, prints, copies            │
│  ├── Sends to: /api/track/session, /api/track/page-enhanced        │
│  └── USED BY: FileViewer 2.tsx (BACKUP FILE, NOT MAIN!)            │
│                                                                     │
│  FileViewer.tsx (MAIN PDF VIEWER)                                  │
│  ├── Has CUSTOM tracking (doesn't use analyticsTracker)            │
│  ├── Tracks: pagesTimeData, maxPageReached, downloads              │
│  ├── Sends to: /api/viewer/session                                 │
│  └── DOES NOT CALL: /api/track/page-enhanced (page_views empty!)   │
│                                                                     │
│  ImageViewer.tsx                                                   │
│  ├── Has CUSTOM tracking                                           │
│  └── Sends to: /api/viewer/session                                 │
│                                                                     │
│  VideoViewer.tsx                                                   │
│  ├── Has CUSTOM tracking                                           │
│  └── Sends to: /api/track/video                                    │
│                                                                     │
│  TextViewer.tsx                                                    │
│  ├── Has CUSTOM tracking                                           │
│  └── Sends to: /api/track/session                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Session End API Fragmentation

| Viewer | API Endpoint | Updates access_logs |
|--------|--------------|---------------------|
| FileViewer.tsx | `/api/viewer/session` | ✅ Yes |
| ImageViewer.tsx | `/api/viewer/session` | ✅ Yes |
| VideoViewer.tsx | `/api/track/video` | ✅ Yes |
| TextViewer.tsx | `/api/track/session` | ✅ Yes |
| analyticsTracker | `/api/track/session` | ✅ Yes |

---

## 3. ROOT CAUSES OF BROKEN TRACKING

### 3.1 Why `pages_viewed_count` = 0
**Root Cause**: The main `FileViewer.tsx` calculates `pagesViewed.current.size` locally but the session API (`/api/viewer/session`) writes it to `pages_viewed_count` field which may not exist or use different field name.

**Evidence**: FileViewer sends `pagesViewedCount` but API may expect `pages_viewed_count` or `pages_viewed`.

### 3.2 Why `pages_time_data` = {} or null
**Root Cause**:
1. The `pages_time_data` column may not exist in the actual database (not in schema doc)
2. FileViewer sends `pagesTimeData` to `/api/viewer/session` but the API may not save it

**Evidence**: Check `/api/viewer/session` to see if it handles `pagesTimeData`.

### 3.3 Why `downloaded` = false after download
**Root Cause**:
1. FileViewer sets `hasDownloaded = true` and sends `downloaded: true`
2. But queries look for `is_downloaded` field
3. Field name mismatch between what's sent and what's stored

**Status**: ✅ FIXED in this session by adding `is_downloaded` to session APIs.

### 3.4 Why `total_duration_seconds` = 0
**Root Cause**:
1. Initial access creates record with `total_duration_seconds: 0`
2. Session end sends `totalDurationSeconds`
3. API needs to UPDATE the record with this value
4. May be field name mismatch or API not saving it

### 3.5 Why `referrer_url` = internal URL
**Root Cause**:
1. The `referer` header in server-side requests often contains the internal redirect URL
2. When user clicks link on Twitter → goes to `/abc123` → redirects to `/view/uuid`
3. By the time `/api/viewer/access` runs, referer is the internal page

**Fix Needed**: Capture referrer BEFORE redirect, pass via query param or body.

### 3.6 Why `referrer_source` = "other"
**Root Cause**:
1. If referrer is internal (`localhost:3000/abc123`), it won't match any social patterns
2. `parseReferrerSource()` returns 'other' for non-matching URLs

### 3.7 Why `traffic_source` = empty
**Root Cause**: `traffic_source` column exists but is NEVER SET anywhere in the code.

**Evidence**: Search for `traffic_source` in `/api/viewer/access/route.ts` - it's not in the insert statement.

### 3.8 Why `page_views` table not populated
**Root Cause**:
1. `/api/track/page-enhanced` exists and works
2. BUT main `FileViewer.tsx` NEVER calls it
3. Only `analyticsTracker.ts` calls it (line 160)
4. Main FileViewer doesn't use analyticsTracker!

---

## 4. FIELD NAME MISMATCHES

| Sent From Viewer | Received by API | Database Column | Issue |
|------------------|-----------------|-----------------|-------|
| `downloaded` | `downloaded` | `is_downloaded` | ✅ Fixed |
| `pagesViewedCount` | `pagesViewedCount` | `pages_viewed_count` | ❓ Check API |
| `totalDurationSeconds` | `totalDurationSeconds` | `total_duration_seconds` | ❓ Check API |
| `maxPageReached` | `maxPageReached` | `max_page_reached` | ❓ Check API |
| `pagesTimeData` | `pagesTimeData` | `pages_time_data` | ❓ Column may not exist |

---

## 5. RECOMMENDATIONS (Priority Order)

### P0 - Critical (Must Fix Immediately)

1. **Unify tracking architecture**: Make `FileViewer.tsx` use `analyticsTracker.ts` OR ensure its custom tracking calls all necessary APIs.

2. **Populate page_views table**: Either:
   - Make FileViewer call `/api/track/page-enhanced` on page change
   - OR enhance `/api/viewer/session` to create page_views from `pagesTimeData`

3. **Fix field name mismatches**: Ensure API field names match database column names exactly.

4. **Add `traffic_source` to initial access**: Set it based on `referrer_source` or UTM params.

### P1 - High Priority

5. **Capture external referrer before redirect**: Pass original referrer through slug resolution.

6. **Add `file_type` column**: Store pdf/pptx/mp4/png for analytics breakdown.

7. **Ensure session end updates work**: Verify `/api/viewer/session` actually UPDATEs records with duration, pages, etc.

### P2 - Medium Priority

8. **Add `pages_time_data` column if missing**: JSONB column for per-page time tracking.

9. **Consolidate session APIs**: Merge `/api/track/session` and `/api/viewer/session` into one.

10. **Standardize field names across codebase**: Use snake_case everywhere matching database.

### P3 - Nice to Have

11. **Add `link_type` to access_logs**: Differentiate file vs track_site views.

12. **Remove `FileViewer 2.tsx`**: Unused backup file causing confusion.

---

## 6. FILES TO MODIFY

| File | Changes Needed | Priority |
|------|----------------|----------|
| `/components/FileViewer.tsx` | Either use analyticsTracker OR call page tracking API | P0 |
| `/app/api/viewer/access/route.ts` | Add traffic_source to insert | P0 |
| `/app/api/viewer/session/route.ts` | Verify field names match DB columns | P0 |
| `/app/[slug]/page.tsx` | Capture and pass external referrer | P1 |
| Database | Add file_type, pages_time_data columns if missing | P1 |
| `/lib/analyticsTracker.ts` | No changes needed, but maybe not used | - |
| `/components/FileViewer 2.tsx` | DELETE (unused backup) | P3 |

---

## 7. VERIFICATION CHECKLIST AFTER FIXES

- [ ] Upload a PDF, view 3 pages, check access_logs has correct `pages_viewed_count`
- [ ] Check `page_views` table has 3 records for the session
- [ ] Check `total_duration_seconds` is > 0
- [ ] Check `max_page_reached` matches actual max page
- [ ] Download file, check `is_downloaded` = true
- [ ] Click link from Twitter, check `referrer_source` = 'twitter'
- [ ] Check `traffic_source` is set
- [ ] Scan QR code, check `access_method` = 'qr_scan'

---

*Report generated by Claude Code audit - December 8, 2025*
