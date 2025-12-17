# LinkLens Analytics Specification

> **Version:** 1.1
> **Last Updated:** December 11, 2025
> **Authors:** DongHyun Kim (CEO), Claude (Co-Pilot CEO)

---

## Table of Contents

1. [Overview](#overview)
2. [Data Architecture](#data-architecture)
3. [Data Collection Fields](#data-collection-fields)
4. [Formulas & Calculations](#formulas--calculations)
5. [Tier Distribution](#tier-distribution)
6. [Feature Specifications](#feature-specifications)
7. [Export Formats](#export-formats)
8. [UI Tooltips & Definitions](#ui-tooltips--definitions)
9. [Database Schema](#database-schema)

---

## Overview

### Philosophy

LinkLens uses an **aggregate-first approach** to data collection:
- Store 1 row per view session (not per page)
- Use JSONB for granular page data within single row
- Calculate metrics on-the-fly or cache periodically
- 10x more cost-effective than row-per-page approach

### Data Hierarchy

```
ACCOUNT LEVEL (All files, all domains)
└── DOMAIN LEVEL (Files under one custom domain)
    └── FILE/LINK LEVEL (Single file or link)
        └── VIEWER/SESSION LEVEL (Individual view session)
```

---

## Data Architecture

### Storage Cost Comparison

| Approach | Rows per 1,000 views (10-page PDF) | Monthly (50 files × 1,000 views) |
|----------|-----------------------------------|----------------------------------|
| Granular (separate page table) | 10,000 rows | 500,000 rows |
| Aggregate (JSONB in access_logs) | 1,000 rows | 50,000 rows |
| **Savings** | **90% less** | **90% less** |

### What We DON'T Track (Intentionally Excluded)

| Excluded Feature | Reason |
|------------------|--------|
| `tab_switches_count` | Too granular, requires constant JS heartbeat |
| `idle_time_seconds` | Complex tracking, limited value |
| `scroll_depth` per page | Store only aggregate |
| Separate `page_analytics` table | Use JSONB instead |
| `copy_attempted` | Hard to track reliably |
| `print_attempted` | Print functionality removed |
| `zoom_used`, `fullscreen_used` | Nice-to-have, adds complexity |
| PDF text extraction | Risk of errors, not OCR |
| Keyword/AI page categorization | Deferred to future |

---

## Data Collection Fields

### A. Access Logs Table (1 Row Per View Session)

#### Viewer Information

| Field | Type | Description | Example | Required |
|-------|------|-------------|---------|----------|
| `id` | UUID | Primary key | `550e8400-e29b-41d4-a716-446655440000` | Yes |
| `file_id` | UUID | Which file was viewed | FK to files table | Yes |
| `viewer_name` | String | Viewer's name | "Sarah Chen" | If required by settings |
| `viewer_email` | String | Viewer's email | "sarah@company.com" | If required by settings |
| `ip_address` | String | IP for geolocation | "203.0.113.42" | Yes |
| `country` | String | Country from IP | "United States" | Yes |
| `city` | String | City from IP (Pro only) | "San Francisco" | Pro tier |

#### Device & Browser

| Field | Type | Description | Possible Values |
|-------|------|-------------|-----------------|
| `device_type` | String | Device category | `desktop`, `mobile`, `tablet` |
| `browser` | String | Browser name | `Chrome`, `Safari`, `Firefox`, `Edge`, `Other` |
| `os` | String | Operating system | `Windows`, `Mac`, `iOS`, `Android`, `Linux` |
| `language` | String | Browser language | `en-US`, `ko-KR`, `ja-JP` |

#### Traffic Source

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `referrer` | String | Full referrer URL | "https://linkedin.com/feed" |
| `referrer_source` | String | Parsed source category | See Referrer Source Values below |
| `utm_source` | String | Campaign source | "facebook", "newsletter" |
| `utm_medium` | String | Campaign medium | "paid_social", "email" |
| `utm_campaign` | String | Campaign name | "summer_2025_launch" |
| `utm_term` | String | Campaign term (optional) | "analytics software" |
| `utm_content` | String | Campaign content (optional) | "banner_a" |
| `access_method` | String | How they accessed | `qr_scan`, `direct_click` |

##### Referrer Source Values

| Value | Detection Logic |
|-------|-----------------|
| `direct` | No referrer |
| `google` | Referrer contains google.com |
| `facebook` | Referrer contains facebook.com or fb.com |
| `linkedin` | Referrer contains linkedin.com |
| `twitter` | Referrer contains twitter.com or x.com |
| `instagram` | Referrer contains instagram.com |
| `email` | Referrer contains mail. or utm_medium=email |
| `other` | Any other referrer |

#### Session Timing

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `accessed_at` | Timestamp | When session started | "2025-12-06T14:30:00Z" |
| `session_end_at` | Timestamp | When session ended | "2025-12-06T14:35:42Z" |
| `total_duration_seconds` | Integer | Total time spent | 342 |
| `is_return_visit` | Boolean | Has viewed before? | true/false |
| `return_visit_count` | Integer | Number of previous visits | 3 |

#### Document Engagement (PDF, PPTX, DOCX)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `total_pages` | Integer | Document page count | 12 |
| `pages_viewed_count` | Integer | How many pages seen | 8 |
| `max_page_reached` | Integer | Furthest page number | 10 |
| `entry_page` | Integer | First page viewed | 1 |
| `exit_page` | Integer | Last page before leaving | 6 |
| `completion_percentage` | Float | % of document viewed | 83.3 |
| `pages_time_data` | JSONB | Time per page | `{"1": 45, "2": 30, "3": 15, "6": 120}` |

##### pages_time_data Format

```json
{
  "1": 45,    // Page 1: 45 seconds
  "2": 30,    // Page 2: 30 seconds
  "3": 15,    // Page 3: 15 seconds
  "6": 120    // Page 6: 120 seconds (most time spent)
}
```

#### Video Engagement

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `video_duration_seconds` | Integer | Total video length | 180 |
| `watch_time_seconds` | Integer | Actual time watched | 145 |
| `video_completion_percent` | Float | % of video watched | 80.5 |
| `video_finished` | Boolean | Watched to the end? | true |

#### Actions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `downloaded` | Boolean | Did they download? | true |
| `download_count` | Integer | How many times | 1 |

#### Calculated Scores (Stored)

| Field | Type | Description | Range |
|-------|------|-------------|-------|
| `engagement_score` | Integer | Overall engagement | 0-100 |
| `intent_signal` | String | Lead quality | `hot`, `warm`, `cold` |

---

### B. Files Table (Additional Cached Metrics)

| Field | Type | Description | Update Frequency |
|-------|------|-------------|------------------|
| `cached_health_score` | Integer | Content Health Score | Every hour or on view |
| `cached_total_views` | Integer | Total view count | Real-time |
| `cached_unique_viewers` | Integer | Unique viewer count | Real-time |
| `cached_avg_engagement` | Float | Average engagement | Every hour |
| `cached_hot_leads` | Integer | Hot lead count | Every hour |
| `cache_updated_at` | Timestamp | Last cache refresh | Auto |
| `is_favorite` | Boolean | Starred by user | User action |
| `notes` | Text | User's notes | User action |
| `folder_id` | UUID | Folder organization | User action |
| `tags` | Array[String] | Tag labels | User action |

---

### C. Contacts Table (Aggregated Viewer Data)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Primary key | Auto |
| `user_id` | UUID | Link owner | FK to users |
| `email` | String | Viewer's email (unique per user) | "sarah@company.com" |
| `name` | String | Latest name used | "Sarah Chen" |
| `company` | String | Parsed from email domain | "Company Inc" |
| `first_seen_at` | Timestamp | First view date | "2025-11-01T10:00:00Z" |
| `last_seen_at` | Timestamp | Most recent view | "2025-12-06T14:30:00Z" |
| `total_views` | Integer | Total view count | 15 |
| `files_viewed` | Array[UUID] | Which files viewed | ["uuid1", "uuid2"] |
| `avg_engagement` | Float | Average engagement score | 78.5 |
| `total_time_seconds` | Integer | Total time across all views | 1842 |
| `is_hot_lead` | Boolean | Hot lead status | true |

---

### D. Folders Table

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Primary key | Auto |
| `user_id` | UUID | Owner | FK to users |
| `name` | String | Folder name | "Q4 Investor Decks" |
| `color` | String | Display color | "#3b82f6" |
| `parent_id` | UUID | For nesting (optional) | null |
| `created_at` | Timestamp | Created date | Auto |

---

### E. UTM Presets Table

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Primary key | Auto |
| `user_id` | UUID | Owner | FK to users |
| `name` | String | Preset name | "LinkedIn Campaign" |
| `utm_source` | String | Source value | "linkedin" |
| `utm_medium` | String | Medium value | "social" |
| `utm_campaign` | String | Campaign value | "q4_outreach" |
| `utm_term` | String | Term value (optional) | null |
| `utm_content` | String | Content value (optional) | null |
| `created_at` | Timestamp | Created date | Auto |

---

## Formulas & Calculations

### Formula 1: File Engagement Score

> **Updated December 11, 2025:** Expanded from 3 variables to 5 variables for more accurate measurement. Added "Depth Score" to distinguish skimmers from readers.

**Purpose:** Single metric (0-100) indicating how engaged a viewer was with uploaded file content (PDF, PPTX, Video, etc.).

**Range:** 0-100

**Note:** This formula applies only to **Uploaded Files**. Track Sites (URL redirects) use a separate formula - see Formula 1B below.

```
File Engagement Score = (Time × 0.25) + (Completion × 0.25) + (Download × 0.20) + (Return × 0.15) + (Depth × 0.15)
```

#### Components:

| Variable | Weight | Formula | What It Measures |
|----------|--------|---------|------------------|
| **Time Score** | 25% | `min(100, (actual_time / expected_time) × 100)` | Total attention given |
| **Completion Score** | 25% | `(max_page_reached / total_pages) × 100` | How far they went |
| **Download Score** | 20% | `downloaded ? 100 : 0` | High-intent action |
| **Return Score** | 15% | `min(100, return_visit_count × 50)` | Came back again |
| **Depth Score** | 15% | `(pages_with_10s+ / total_pages) × 100` | Actually read pages |

#### Expected Time by File Type:

| File Type | Expected Time Formula |
|-----------|----------------------|
| PDF/Documents | `total_pages × 30 seconds` |
| Videos | `video_duration_seconds` |
| Images | `60 seconds` |
| Audio | `audio_duration_seconds` |
| Other | `60 seconds` |

#### Depth Score Calculation:

The Depth Score distinguishes "skimmers" from "readers" by measuring how many pages had meaningful time spent (>10 seconds).

```javascript
// From pages_time_data JSONB: {"1": 45, "2": 30, "3": 5, "4": 2}
const meaningfulPages = Object.values(pagesTimeData).filter(time => time >= 10).length;
const depthScore = Math.min(100, (meaningfulPages / totalPages) * 100);
```

**Why Depth Score Matters:**

| Scenario | Completion | Depth | Insight |
|----------|------------|-------|---------|
| Read every page carefully | 100% | 100% | Fully engaged ✅ |
| Scrolled to end quickly | 100% | 20% | Skimmed only ⚠️ |
| Read first half deeply | 50% | 100% | Partial but engaged ✅ |

#### Example Calculation:

```
Viewer: Sarah Chen
File: 10-page PDF
Actual time: 420 seconds
Expected time: 10 × 30 = 300 seconds
Max page reached: 10 (100% completion)
Downloaded: Yes
Return visit count: 1
Pages with 10+ seconds: 8 out of 10

Time Score: min(100, (420/300) × 100) = 100
Completion Score: (10/10) × 100 = 100
Download Score: 100 (downloaded)
Return Score: min(100, 1 × 50) = 50
Depth Score: (8/10) × 100 = 80

File Engagement Score = (100 × 0.25) + (100 × 0.25) + (100 × 0.20) + (50 × 0.15) + (80 × 0.15)
                      = 25 + 25 + 20 + 7.5 + 12
                      = 89.5 → 90
```

#### Simulation Scenarios:

| Scenario | Time | Completion | Download | Return | Depth | **Score** |
|----------|------|------------|----------|--------|-------|-----------|
| Perfect viewer | 100 | 100 | 100 | 100 | 100 | **100** |
| Downloaded but skimmed | 40 | 80 | 100 | 0 | 30 | **55** |
| Read fully, no action | 100 | 100 | 0 | 0 | 100 | **65** |
| Quick look, came back 2x | 50 | 60 | 0 | 100 | 40 | **56** |
| Scrolled to end fast | 30 | 100 | 0 | 0 | 20 | **42** |
| Read first half deeply | 80 | 50 | 0 | 0 | 100 | **55** |
| Bounced immediately | 10 | 5 | 0 | 0 | 5 | **5** |

#### UI Display:

| Score | Label | Color | Icon |
|-------|-------|-------|------|
| 80-100 | Excellent | Green (#22c55e) | 🔥 |
| 60-79 | Good | Blue (#3b82f6) | ⭐ |
| 40-59 | Average | Yellow (#eab308) | 📊 |
| 0-39 | Low | Gray (#6b7280) | ⚪ |

---

### Formula 1B: Track Site Score (NEW)

> **Added December 11, 2025:** Separate scoring system for Track Sites (URL redirects) which cannot use content engagement metrics.

**Purpose:** Single metric (0-100) measuring the performance of Track Site links (external URL redirects).

**Range:** 0-100

**Why Separate Formula:** Track Sites are redirects to external URLs - they don't have content to measure engagement with. Therefore, they use different metrics: clicks, reach, returns, and momentum.

```
Track Site Score = (Volume × 0.30) + (Reach × 0.20) + (Return × 0.25) + (Recency × 0.15) + (Velocity × 0.10)
```

#### Components:

| Variable | Weight | Formula | What It Measures |
|----------|--------|---------|------------------|
| **Volume Score** | 30% | `min(100, 33 × log₁₀(clicks + 1))` | Total traction |
| **Reach Score** | 20% | `(unique_clickers / total_clicks) × 100` | Audience diversity |
| **Return Score** | 25% | `(return_clickers / unique_clickers) × 100` | Repeat interest |
| **Recency Score** | 15% | Based on days since last click | Link freshness |
| **Velocity Score** | 10% | Week-over-week trend | Momentum |

#### Volume Score (Logarithmic Scale):

Using log scale handles both small and large audiences fairly:

| Clicks | Volume Score |
|--------|-------------|
| 1 | 10 |
| 5 | 23 |
| 10 | 33 |
| 50 | 56 |
| 100 | 66 |
| 500 | 89 |
| 1,000 | 99 |
| 10,000+ | 100 |

#### Recency Score:

| Days Since Last Click | Recency Score |
|----------------------|---------------|
| 0-3 days | 100 |
| 4-7 days | 80 |
| 8-14 days | 60 |
| 15-30 days | 40 |
| 31-60 days | 20 |
| 60+ days | 5 |

#### Velocity Score:

```javascript
if (clicksThisWeek > clicksLastWeek × 1.5) return 100;  // Growing fast
if (clicksThisWeek > clicksLastWeek) return 75;         // Growing
if (clicksThisWeek === clicksLastWeek) return 50;       // Stable
if (clicksThisWeek > clicksLastWeek × 0.5) return 25;   // Declining
return 10;                                               // Dying
```

#### Example Calculation:

```
Track Site: instagram-bio
Total clicks: 156
Unique clickers: 120
Return clickers: 36
Last click: 2 days ago
Clicks this week: 45
Clicks last week: 30

Volume Score: min(100, 33 × log₁₀(157)) = min(100, 33 × 2.2) = 73
Reach Score: (120/156) × 100 = 77
Return Score: (36/120) × 100 = 30
Recency Score: 100 (clicked 2 days ago)
Velocity Score: 100 (45 > 30 × 1.5)

Track Site Score = (73 × 0.30) + (77 × 0.20) + (30 × 0.25) + (100 × 0.15) + (100 × 0.10)
                 = 21.9 + 15.4 + 7.5 + 15 + 10
                 = 69.8 → 70
```

#### Simulation Scenarios:

| Scenario | Volume | Reach | Return | Recency | Velocity | **Score** |
|----------|--------|-------|--------|---------|----------|-----------|
| Viral campaign (1000 clicks) | 99 | 80 | 30 | 100 | 100 | **78** |
| Steady performer (100 clicks) | 66 | 70 | 40 | 80 | 50 | **60** |
| New but promising (10 clicks) | 33 | 90 | 20 | 100 | 100 | **51** |
| Old but sticky (50 clicks) | 56 | 60 | 60 | 40 | 25 | **51** |
| Dead link (5 clicks, 60 days) | 23 | 80 | 10 | 5 | 10 | **26** |

---

### Files vs Track Sites: Why Separate Scoring

| Aspect | Uploaded Files | Track Sites |
|--------|---------------|-------------|
| **Purpose** | Share & track content | Track link clicks |
| **User Experience** | Viewer stays, reads, watches | Viewer clicks and leaves |
| **Measurable Data** | Time, pages, completion, download | Clicks, returns |
| **Primary Metric** | Engagement depth | Click volume |
| **Comparable?** | Compare files to files only | Compare track sites to track sites only |

**Never compare a File's engagement score to a Track Site's score** - they measure fundamentally different things.

---

### Formula 2: Intent Signal

**Purpose:** Quick indicator of lead quality for sales follow-up.

```
IF Engagement Score >= 70 → HOT 🔥
IF Engagement Score >= 40 AND < 70 → WARM 🟡
IF Engagement Score < 40 → COLD ⚪
```

#### Enhanced Hot Lead Detection:

A viewer is marked as **Hot Lead** if:

```
(Engagement Score >= 80)
OR (Engagement Score >= 70 AND downloaded = true)
OR (Engagement Score >= 60 AND return_visit_count >= 2)
```

---

### Formula 3: Content Health Score

**Purpose:** Overall effectiveness metric for a file.

**Range:** 0-100

```
Content Health = (Avg Engagement × 0.4) + (Completion Rate × 0.3) + (Return Rate × 0.2) + (Action Rate × 0.1)
```

#### Components:

- Avg Engagement = AVG(engagement_score) across all viewers
- Completion Rate = (Viewers who saw last page / Total viewers) × 100
- Return Rate = (Viewers with return_visit = true / Total viewers) × 100
- Action Rate = (Viewers who downloaded / Total viewers) × 100

#### Example Calculation:

```
File: Investor Pitch Deck
Total Viewers: 50
Avg Engagement: 72
Completed (saw last page): 35 viewers → 70%
Returned: 8 viewers → 16%
Downloaded: 20 viewers → 40%

Content Health = (72 × 0.4) + (70 × 0.3) + (16 × 0.2) + (40 × 0.1)
               = 28.8 + 21 + 3.2 + 4
               = 57
```

#### UI Display:

| Score | Label | Color |
|-------|-------|-------|
| 80-100 | Excellent | Green |
| 60-79 | Good | Blue |
| 40-59 | Needs Improvement | Yellow |
| 0-39 | Poor | Red |

---

### Formula 4: Domain Health Score

**Purpose:** Overall performance of all files under one domain.

```
Domain Health = (Avg Content Health × 0.5) + (Activity Score × 0.3) + (Growth Score × 0.2)
```

#### Components:

- Avg Content Health = AVG(content_health_score) across all files in domain
- Activity Score = min(100, (views_last_7_days / total_links) × 10)
- Growth Score = max(0, min(100, ((views_this_week - views_last_week) / views_last_week) × 100))

---

### Formula 5: Account Health Score

**Purpose:** Overall account performance.

```
Account Health = AVG(domain_health_score) across all domains
```

If user has no custom domains, use file-level average instead.

---

### Formula 6: Page Drop-off Rate

**Purpose:** Identify where viewers lose interest.

```
For each page N:
Drop-off Rate = ((Viewers at Page N - Viewers at Page N+1) / Viewers at Page N) × 100
```

#### Example:

| Page | Viewers | Drop-off Rate | Interpretation |
|------|---------|---------------|----------------|
| 1 | 100 | 15% | Normal |
| 2 | 85 | 29% | ⚠️ High drop-off |
| 3 | 60 | 8% | Good |
| 4 | 55 | 5% | Good |
| 5 | 52 | - | Last page |

**Insight:** "29% of viewers drop off at Page 2 - consider revising this page."

---

### Formula 7: Page Heatmap Score

**Purpose:** Visual representation of which pages get most attention.

```
For each page:
Heatmap Score = (Total time on this page / Total time on most-viewed page) × 100
```

#### Color Mapping:

| Score | Color | Label |
|-------|-------|-------|
| 80-100% | 🟢 Green | Hot |
| 50-79% | 🟡 Yellow | Medium |
| 20-49% | 🟠 Orange | Cool |
| 0-19% | 🔴 Red | Cold |

---

### Formula 8: Best Time to Share

**Purpose:** Recommend optimal sharing time based on engagement patterns.

1. Group all access_logs by:
   - Hour of day (0-23) in viewer's timezone
   - Day of week (Monday-Sunday)

2. Calculate:
   - Top 3 hours with highest average engagement score
   - Top 2 days with highest average engagement score

3. Output format:
   ```
   "Best time to share: {Day1} & {Day2}, {Hour1}-{Hour2}"
   ```

#### Example Output:

```
"Best time to share: Tuesday & Thursday, 10am-12pm"
```

---

### Formula 9: Contact Engagement Ranking

**Purpose:** Rank contacts by overall engagement quality.

```
Contact Score = (Total Views × 0.2) + (Avg Engagement × 0.4) + (Recency Score × 0.2) + (Files Viewed × 0.2)
```

Where:
- Recency Score:
  - Viewed in last 7 days: 100
  - Viewed in last 30 days: 70
  - Viewed in last 90 days: 40
  - Older: 10
- Files Viewed = min(100, files_viewed_count × 20)

---

### Formula 10: Virality Score

**Purpose:** Measure internal sharing within companies.

```
Virality Score = AVG viewers per company domain
```

Example:
- company-a.com: 5 viewers
- company-b.com: 2 viewers
- startup.io: 8 viewers

Virality Score = (5 + 2 + 8) / 3 = 5.0

Interpretation:
- > 3.0: High virality (being shared internally)
- 1.5 - 3.0: Medium virality
- < 1.5: Low virality (not being shared)

---

### Formula 11: QR Scan vs Direct Click Detection

```
access_method =
  IF utm_medium = "qr" THEN "qr_scan"
  ELSE IF referrer IS NULL AND utm_source IS NULL THEN
    IF user_agent suggests camera/scanner app THEN "qr_scan"
    ELSE "direct_click"
  ELSE "direct_click"
```

---

## Tier Distribution

### Feature Access by Tier

| Feature | FREE | STARTER ($9) | PRO ($19) |
|---------|:----:|:------------:|:---------:|
| **VIEWER LEVEL** | | | |
| Basic (name, email, time) | ✅ | ✅ | ✅ |
| Engagement Score | ❌ Blurred | ✅ | ✅ |
| Intent Signal (Hot/Warm/Cold) | ❌ Blurred | ✅ | ✅ |
| Action Tags (downloaded, etc.) | ❌ Blurred | ✅ | ✅ |
| Hot Lead Detection | ❌ Blurred | ❌ Blurred | ✅ |
| Behavioral Analysis | ❌ Blurred | ❌ Blurred | ✅ |
| **FILE LEVEL** | | | |
| Views / Unique Viewers | ✅ | ✅ | ✅ |
| Content Health Score | ❌ Blurred | ✅ | ✅ |
| Avg Engagement/Time | ❌ Blurred | ✅ | ✅ |
| Page Heatmap | ❌ Blurred | ✅ | ✅ |
| Drop-off Analysis | ❌ Blurred | ❌ Blurred | ✅ |
| Recommendations | ❌ Blurred | ❌ Blurred | ✅ |
| **DOMAIN LEVEL** | | | |
| Total Views | ✅ | ✅ | ✅ |
| Domain Health Score | ❌ Blurred | ✅ | ✅ |
| Top/Under Performers | ❌ Blurred | ❌ Blurred | ✅ |
| Market Opportunity | ❌ Blurred | ❌ Blurred | ✅ |
| **ACCOUNT LEVEL** | | | |
| Basic Stats | ✅ | ✅ | ✅ |
| Account Health | ❌ Blurred | ✅ | ✅ |
| Action Dashboard | ❌ Blurred | ❌ Blurred | ✅ |
| Trends & Insights | ❌ Blurred | ❌ Blurred | ✅ |
| **BRANDING** | | | |
| "Powered by LinkLens" | Shown | Hidden | Hidden |
| Custom Logo | ❌ | ✅ | ✅ |
| **EXPORTS** | | | |
| CSV (Basic) | ❌ | ✅ | ✅ |
| CSV (Full Granular) | ❌ | ❌ | ✅ |
| PDF Reports | ❌ | ❌ | ✅ |
| **OTHER** | | | |
| World Map | ❌ Blurred | ❌ Blurred | ✅ |
| City-level Location | ❌ | ❌ | ✅ |
| Contacts CRM | ❌ Blurred | ✅ | ✅ |
| Tags/Folders | ❌ | ✅ | ✅ |
| UTM Builder | ❌ | ✅ | ✅ |
| Time Filters (7/14/30 days) | ✅ | ✅ | ✅ |

### Upgrade CTA Text

| From Tier | Feature Tier | CTA Text |
|-----------|--------------|----------|
| Free | Starter | "Upgrade to Starter →" |
| Free | Pro | "Upgrade to Pro →" |
| Starter | Pro | "Upgrade to Pro →" |

---

## Feature Specifications

### Contacts CRM

**Description:** Aggregated view of all viewers across all files.

**Data Source:** Aggregated from `access_logs` by email.

**Fields Displayed:**
- Name, Email, Company (parsed from domain)
- First seen / Last seen dates
- Total views across all files
- Files viewed (list)
- Average engagement score
- Hot lead badge

**Tier:** Starter+

---

### Star/Favorite Links

**Description:** Mark important links for quick access.

**Implementation:** `is_favorite` boolean in files table.

**Tier:** Free

---

### Notes on Files

**Description:** Add personal notes to any file for context.

**Implementation:** `notes` text field in files table.

**Tier:** Free

---

### Tags System

**Description:** Organize files with custom tags.

**Implementation:** `tags` array field in files table.

**Tier:** Starter+

---

### Folders System

**Description:** Organize files into folders.

**Implementation:** Separate `folders` table with `folder_id` in files.

**Tier:** Starter+

---

### UTM Builder

**Description:** Create tracked links with UTM parameters.

**Implementation:** UI to add UTM params, stored in link URL.

**Tier:** Starter+

---

### UTM Presets

**Description:** Save and reuse UTM configurations.

**Implementation:** Separate `utm_presets` table.

**Tier:** Starter+

---

### Custom Logo Upload

**Description:** Replace LinkLens branding with user's logo.

**Implementation:** `custom_logo_url` in user settings.

**Tier:** Starter+

---

### Time Filters

**Description:** Filter analytics by time period.

**Options:** Last 7 days, Last 14 days, Last 30 days, All time

**Tier:** Free

---

## Export Formats

### CSV Export (Basic) - Starter Tier

**Filename:** `{filename}_viewers_{YYYY-MM-DD}.csv`

**Columns:**

| Column | Description |
|--------|-------------|
| Name | Viewer name |
| Email | Viewer email |
| Viewed At | Timestamp (YYYY-MM-DD HH:MM) |
| Time Spent | Duration in MM:SS format |
| Pages Viewed | Count |
| Completed | Yes/No |
| Downloaded | Yes/No |
| Device | Desktop/Mobile/Tablet |
| Country | Country name |

---

### CSV Export (Full Granular) - Pro Tier

**Filename:** `{filename}_full_analytics_{YYYY-MM-DD}.csv`

**Columns:**

| Column | Description |
|--------|-------------|
| Name | Viewer name |
| Email | Viewer email |
| Company | Parsed from email domain |
| Viewed At | Full timestamp |
| Session End | End timestamp |
| Time Spent (seconds) | Raw seconds |
| Engagement Score | 0-100 |
| Intent | Hot/Warm/Cold |
| Pages Viewed | Comma-separated list |
| Max Page Reached | Number |
| Entry Page | First page |
| Exit Page | Last page |
| Completion % | Percentage |
| Downloaded | Yes/No |
| Download Count | Number |
| Return Visit | Yes/No |
| Return Count | Number |
| Device | Type |
| Browser | Name |
| OS | Name |
| Language | Code |
| Country | Name |
| City | Name (Pro only) |
| Referrer | Full URL |
| Traffic Source | Category |
| UTM Source | Value |
| UTM Medium | Value |
| UTM Campaign | Value |
| Access Method | QR Scan/Direct Click |

---

### PDF Report - Pro Tier

**Filename:** `{filename}_report_{YYYY-MM-DD}.pdf`

**Structure:**

```
PAGE 1: EXECUTIVE SUMMARY
├── File name, date range
├── Key metrics (views, unique, engagement, health score, hot leads)
├── Engagement breakdown pie chart (Hot/Warm/Cold)
└── Quick insights (3 bullet points)

PAGE 2: ENGAGEMENT DETAILS
├── Views over time line chart
├── Page heatmap visualization
├── Drop-off analysis bar chart
└── Top 5 engaged viewers list

PAGE 3: AUDIENCE INSIGHTS
├── Traffic sources pie chart
├── Device breakdown
├── Geographic distribution
├── Best time to share

PAGE 4: RECOMMENDATIONS
├── Content improvement suggestions
├── Hot leads to follow up
├── Optimization opportunities
```

---

## UI Tooltips & Definitions

### Metrics Tooltips

Use these exact texts for tooltips throughout the application.

#### Viewer Level

| Metric | Tooltip Text |
|--------|--------------|
| **Engagement Score** | "A score from 0-100 measuring how engaged this viewer was, based on time spent, completion, and actions taken." |
| **Intent Signal** | "Indicates lead quality: 🔥 Hot (70+), 🟡 Warm (40-69), ⚪ Cold (<40) based on engagement score." |
| **Time Spent** | "Total time the viewer spent viewing your content." |
| **Completion** | "Percentage of the document the viewer saw." |
| **Hot Lead** | "High-intent viewer who engaged deeply, downloaded, or returned multiple times. Priority for follow-up." |
| **Return Visit** | "This viewer has viewed your content before. Return visitors often indicate strong interest." |
| **Downloaded** | "The viewer downloaded a copy of your file." |

#### File Level

| Metric | Tooltip Text |
|--------|--------------|
| **Total Views** | "Total number of times your link was viewed, including repeat views." |
| **Unique Viewers** | "Number of individual people who viewed your link, counted by email or IP." |
| **Content Health Score** | "Overall effectiveness score (0-100) based on average engagement, completion rate, return rate, and actions." |
| **Avg Engagement** | "Average engagement score across all viewers." |
| **Avg Time Spent** | "Average time viewers spend on your content." |
| **Completion Rate** | "Percentage of viewers who saw the last page of your document." |
| **Hot Leads** | "Number of highly engaged viewers who are likely ready for follow-up." |

#### Page Analytics

| Metric | Tooltip Text |
|--------|--------------|
| **Page Heatmap** | "Visual representation of which pages get the most attention. Darker = more time spent." |
| **Drop-off Rate** | "Percentage of viewers who left at each page. High drop-off indicates content that may need revision." |
| **Entry Page** | "The first page viewers see when opening your document." |
| **Exit Page** | "The last page viewers see before leaving. Common exit pages may indicate where interest drops." |

#### Traffic & Sources

| Metric | Tooltip Text |
|--------|--------------|
| **Traffic Source** | "Where your viewers came from: direct link, social media, email, or search." |
| **Referrer** | "The website that sent visitors to your link." |
| **UTM Source** | "The source parameter from your tracking URL, used to identify marketing campaigns." |
| **QR Scan** | "Viewer accessed your link by scanning a QR code." |
| **Direct Click** | "Viewer clicked a direct link (email, message, or typed URL)." |

#### Domain & Account

| Metric | Tooltip Text |
|--------|--------------|
| **Domain Health** | "Overall performance score for all files under this domain." |
| **Account Health** | "Overall performance score across your entire LinkLens account." |
| **Top Performer** | "Your best-performing content based on Content Health Score." |
| **Under Performer** | "Content that may need attention due to low engagement." |

#### Contact

| Metric | Tooltip Text |
|--------|--------------|
| **Contact Score** | "Overall engagement ranking based on views, engagement, recency, and files viewed." |
| **Company** | "Company name, automatically detected from email domain." |
| **Files Viewed** | "List of all files this contact has accessed." |
| **Total Time** | "Total time this contact has spent viewing your content across all files." |

---

### Empty State Messages

| Context | Message |
|---------|---------|
| No views yet | "No views yet. Share your link to start tracking!" |
| No hot leads | "No hot leads yet. As viewers engage with your content, hot leads will appear here." |
| No contacts | "Your contacts will appear here as people view your links." |
| No analytics data | "Analytics will appear once people start viewing your content." |
| Chart no data | "Not enough data to display this chart yet." |

---

### Upgrade Prompts

| Tier Needed | Prompt Text |
|-------------|-------------|
| Starter | "Unlock engagement insights, page analytics, and more with Starter." |
| Pro | "Get advanced analytics, PDF reports, and AI-powered recommendations with Pro." |

---

## Database Schema

### SQL Schema

```sql
-- Access Logs (Main analytics table)
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,

  -- Viewer Info
  viewer_name TEXT,
  viewer_email TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,

  -- Device & Source
  device_type TEXT,
  browser TEXT,
  os TEXT,
  language TEXT,
  referrer TEXT,
  referrer_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  access_method TEXT,

  -- Session
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  session_end_at TIMESTAMPTZ,
  total_duration_seconds INTEGER DEFAULT 0,
  is_return_visit BOOLEAN DEFAULT FALSE,
  return_visit_count INTEGER DEFAULT 0,

  -- Document Engagement
  total_pages INTEGER,
  pages_viewed_count INTEGER DEFAULT 0,
  max_page_reached INTEGER DEFAULT 0,
  entry_page INTEGER,
  exit_page INTEGER,
  completion_percentage FLOAT DEFAULT 0,
  pages_time_data JSONB DEFAULT '{}',

  -- Video Engagement
  video_duration_seconds INTEGER,
  watch_time_seconds INTEGER,
  video_completion_percent FLOAT,
  video_finished BOOLEAN DEFAULT FALSE,

  -- Actions
  downloaded BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,

  -- Calculated Scores
  engagement_score INTEGER DEFAULT 0,
  intent_signal TEXT DEFAULT 'cold',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_access_logs_file_id ON access_logs(file_id);
CREATE INDEX idx_access_logs_viewer_email ON access_logs(viewer_email);
CREATE INDEX idx_access_logs_accessed_at ON access_logs(accessed_at);
CREATE INDEX idx_access_logs_intent ON access_logs(intent_signal);

-- Contacts (Aggregated viewer data)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_views INTEGER DEFAULT 0,
  files_viewed UUID[] DEFAULT '{}',
  avg_engagement FLOAT DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  is_hot_lead BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_is_hot_lead ON contacts(is_hot_lead);

-- Folders
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  parent_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_folders_user_id ON folders(user_id);

-- UTM Presets
CREATE TABLE utm_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_utm_presets_user_id ON utm_presets(user_id);

-- Add columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE files ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE files ADD COLUMN IF NOT EXISTS cached_health_score INTEGER;
ALTER TABLE files ADD COLUMN IF NOT EXISTS cached_total_views INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS cached_unique_viewers INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS cached_avg_engagement FLOAT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS cached_hot_leads INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS cache_updated_at TIMESTAMPTZ;

-- Add custom logo to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
```

---

## Appendix: Implementation Checklist

### Data Collection (Backend)

- [ ] UTM parameter capture from URL
- [ ] Language detection from headers
- [ ] Referrer source parsing
- [ ] QR scan vs direct click detection
- [ ] Return visit detection
- [ ] Entry/Exit page tracking
- [ ] Session end timestamp capture
- [ ] Pages time data as JSONB

### Calculations (Backend)

- [ ] Engagement Score calculation
- [ ] Intent Signal calculation
- [ ] Content Health Score
- [ ] Domain Health Score
- [ ] Page Drop-off Rate
- [ ] Page Heatmap Scores
- [ ] Best Time to Share
- [ ] Contact Ranking
- [ ] Top/Under Performers
- [ ] Virality Score

### Features

- [ ] Contacts CRM
- [ ] Star/Favorite links
- [ ] Notes on files
- [ ] Tags system
- [ ] Folders system
- [ ] Time Filters (7/14/30 days)
- [ ] Custom Logo upload
- [ ] Remove watermark logic
- [ ] UTM Builder
- [ ] UTM Presets
- [ ] CSV Export (Basic)
- [ ] CSV Export (Full)
- [ ] PDF Report generation
- [ ] World Map visualization
- [ ] TierGate component
- [ ] Action Dashboard

---

*End of Document*
