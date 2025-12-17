# LinkLens Analytics Display Specification

> **Version:** 1.0
> **Last Updated:** December 7, 2025
> **Authors:** DongHyun Kim (CEO), Claude (Co-Pilot CEO)
> **Purpose:** Defines exactly what analytics are displayed, where, and how

---

## Table of Contents

1. [Universal Rules](#1-universal-rules)
2. [All Analytics Sections](#2-all-analytics-sections)
3. [Section 1: Dashboard Overview](#3-section-1-dashboard-overview)
4. [Section 2: File Detail - Document](#4-section-2-file-detail---document)
5. [Section 3: File Detail - Media](#5-section-3-file-detail---media)
6. [Section 4: File Detail - Image](#6-section-4-file-detail---image)
7. [Section 5: File Detail - Other](#7-section-5-file-detail---other)
8. [Section 6: Link Detail](#8-section-6-link-detail)
9. [Section 7: Contact Detail](#9-section-7-contact-detail)
10. [Section 8: Global Analytics](#10-section-8-global-analytics)
11. [World Map Specification](#11-world-map-specification)
12. [File Type Features Matrix](#12-file-type-features-matrix)

---

## 1. Universal Rules

These rules apply to **ALL** analytics sections.

| Rule | Value |
|------|-------|
| Key Insights | Up to 8 (show if sufficient data) |
| Recommended Actions | Up to 5 (based on key insights) |
| Charts per row | 3 |
| Quick Stats | 8-10 cards |

### Page Structure (All Analytics Pages)
```
+─────────────────────────────────────────+
│  QUICK STATS (8-10 metric cards)        │  <- 5 seconds to scan
├─────────────────────────────────────────┤
│  KEY INSIGHTS (up to 8)                 │  <- What the data MEANS
├─────────────────────────────────────────┤
│  RECOMMENDED ACTIONS (up to 5)          │  <- What to DO
├─────────────────────────────────────────┤
│  DETAILED ANALYTICS (3 per row)         │  <- Deep dive charts
│  WORLD MAP (full width)                 │  <- Geographic view
│  TABLES                                 │  <- Data tables
+─────────────────────────────────────────+
```

---

## 2. All Analytics Sections

| # | Section | URL | Scope |
|---|---------|-----|-------|
| 1 | **Dashboard Overview** | `/dashboard` | ALL data (aggregated files + links) |
| 2 | **File Detail: Document** | `/dashboard/files/[id]` | PDF, PPT, DOC, XLS |
| 3 | **File Detail: Media** | `/dashboard/files/[id]` | Video, Audio |
| 4 | **File Detail: Image** | `/dashboard/files/[id]` | PNG, JPG, GIF, etc. |
| 5 | **File Detail: Other** | `/dashboard/files/[id]` | ZIP, etc. |
| 6 | **Link Detail** | `/dashboard/files/[id]` | External URLs (type="url") |
| 7 | **Contact Detail** | `/dashboard/contacts/[id]` | Individual person |
| 8 | **Global Analytics** | `/dashboard/analytics` | Filterable scope |

### File Type Detection Logic
```javascript
function getFileTypeCategory(file) {
  if (file.type === 'url') return 'url'
  const mime = file.mime_type?.toLowerCase() || ''
  if (mime.includes('pdf')) return 'document'
  if (mime.includes('presentation') || mime.includes('ppt')) return 'document'
  if (mime.includes('word') || mime.includes('doc')) return 'document'
  if (mime.includes('sheet') || mime.includes('xls')) return 'document'
  if (mime.includes('video')) return 'media'
  if (mime.includes('audio')) return 'media'
  if (mime.includes('image')) return 'image'
  return 'other'
}
```

---

## 3. Section 1: Dashboard Overview

**URL:** `/dashboard`
**Scope:** Aggregated data from ALL files + links

### Quick Stats (10 cards)

| # | Icon | Label | Value | Sub-value |
|---|------|-------|-------|-----------|
| 1 | Views | Views | Total views (all files + links) | "X today" |
| 2 | QR | QR Scans | Total QR scans | "X today" |
| 3 | Users | Unique | Unique viewers | - |
| 4 | Chart | Engage | Avg engagement score | - |
| 5 | Fire | Hot Leads | Hot lead count | "+X new" |
| 6 | Check | Avg Complete | Avg completion % (docs + media) | - |
| 7 | Clock | Avg Time | Avg time spent | - |
| 8 | Refresh | Return % | Return visitor rate | - |
| 9 | Download | Downloads | Total downloads | - |
| 10 | Users | Unique % | Unique vs total % | - |

### Key Insights (up to 8)

| # | Condition | Icon | Text | Implication |
|---|-----------|------|------|-------------|
| 1 | hot_leads > 0 in 48h | Fire | "{N} hot leads ready for follow-up" | "High intent - prioritize outreach" |
| 2 | file trending > 30% | TrendUp | "{File} trending (+X%)" | "Momentum building - amplify" |
| 3 | company >=2 viewers in 7d | Building | "{Company} team ({N} people) reviewing" | "Potential deal" |
| 4 | best time calculated | Clock | "Best engagement: {Days} at {Hours}" | "Optimal sharing window" |
| 5 | mobile > 30% | Phone | "{X}% views from mobile" | "Consider mobile optimization" |
| 6 | qr_scans > 20% | QR | "{X}% from QR codes" | "Physical distribution working" |
| 7 | file engagement < 40 | TrendDown | "{File} has low engagement" | "Needs content refresh" |
| 8 | return_rate > 25% | Refresh | "{X}% are return visitors" | "Content resonating" |

### Recommended Actions (up to 5)

| # | Condition | Priority | Icon | Title | Reason | Buttons |
|---|-----------|----------|------|-------|--------|---------|
| 1 | hot_lead exists | HIGH | Fire | "Contact {Name} ({Company})" | "{X}% engagement on {File}" | [Email] [LinkedIn] |
| 2 | drop-off > 30% | HIGH | Warning | "Fix {File} page {N}" | "{X}% drop-off" | [View] [Edit] |
| 3 | file trending | MEDIUM | TrendUp | "Amplify {File}" | "Trending +{X}%" | [Share] [View] |
| 4 | best time known | MEDIUM | Clock | "Share on {Day} at {Hour}" | "3x higher engagement" | [Copy Link] |
| 5 | low engagement file | MEDIUM | TrendDown | "Refresh {File}" | "Below average engagement" | [Edit] [Replace] |

### Detailed Analytics (3 per row)

**Row 1: Time & Engagement**
| Chart 1 | Chart 2 | Chart 3 |
|---------|---------|---------|
| Views Over Time | Engagement Breakdown (Hot/Warm/Cold) | Hot Leads Trend |

**Row 2: When**
| Chart 1 | Chart 2 | Chart 3 |
|---------|---------|---------|
| Top Days | Popular Hours | Best Time to Share |

**Row 3: Traffic**
| Chart 1 | Chart 2 | Chart 3 |
|---------|---------|---------|
| Traffic Sources | Access Method (QR/Direct) | UTM Campaigns |

**Row 4: Devices**
| Chart 1 | Chart 2 | Chart 3 |
|---------|---------|---------|
| Devices | Browsers | OS |

**Row 5a: World Map (Full Width)**
| Full Width |
|------------|
| **World Map** - Interactive choropleth showing viewer distribution |

**Row 5b: Location Details**
| Chart 1 | Chart 2 | Chart 3 |
|---------|---------|---------|
| Countries | Cities | Regions |

**Row 6: Other**
| Chart 1 | Chart 2 | Chart 3 |
|---------|---------|---------|
| Languages | Actions (Downloaded/Returned) | Virality Score |

**Row 7: Content Performance**
| Chart 1 | Chart 2 | Chart 3 |
|---------|---------|---------|
| Top Performing Files | Needs Attention | Content Health Overview |

**Bottom Tables:**
| Table 1 | Table 2 |
|---------|---------|
| Hot Leads (Name, Company, Engagement, File, Last Seen) | Recent Activity (Visitor, File, Country, Device, Intent, Score, Time) |

---

## 4. Section 2: File Detail - Document

**Applies to:** PDF, PPT, DOC, XLS
**URL:** `/dashboard/files/[id]`

### Quick Stats (10 cards)

| # | Icon | Label | Source |
|---|------|-------|--------|
| 1 | Views | Views | cached_total_views |
| 2 | QR | QR Scans | cached_qr_scans |
| 3 | Users | Unique | cached_unique_viewers |
| 4 | Chart | Engage | cached_avg_engagement |
| 5 | Fire | Hot | cached_hot_leads |
| 6 | Check | Complete % | AVG(completion_percentage) |
| 7 | Clock | Avg Time | AVG(total_duration_seconds) |
| 8 | Refresh | Return % | (return_visits / total) x 100 |
| 9 | Download | Downloads | SUM(download_count) |
| 10 | Users | Unique % | (unique / total) x 100 |

### Key Insights (up to 8)

| # | Condition | Icon | Text | Implication |
|---|-----------|------|------|-------------|
| 1 | page_time > 2x avg | Gem | "Page {N} gets {X}x more attention" | "Strong interest in this content" |
| 2 | drop_off > 30% | Warning | "{X}% drop-off at page {N}" | "Content may need revision" |
| 3 | best time calculated | Clock | "Peak viewing: {Days} at {Hours}" | "Best time to share" |
| 4 | company >=2 viewers | Users | "{N} people from {Company} viewing" | "Being shared internally" |
| 5 | qr_scans > 20% | Phone | "{X}% from QR codes" | "Physical distribution working" |
| 6 | avg_engagement < 40 | TrendDown | "Below average engagement" | "Consider refreshing content" |
| 7 | return_rate > 25% | Refresh | "{X}% are return visitors" | "Content resonating" |
| 8 | downloads > 30% | Download | "{X}% downloaded the file" | "High interest - saving for later" |

### Recommended Actions (up to 5)

| # | Condition | Priority | Icon | Title | Reason | Buttons |
|---|-----------|----------|------|-------|--------|---------|
| 1 | hot_leads > 0 | HIGH | Fire | "Contact {N} hot leads" | "High intent viewers" | [View Leads] [Export] |
| 2 | drop_off > 30% | HIGH | Warning | "Review page {N}" | "{X}% drop-off" | [Edit File] |
| 3 | best_time known | MEDIUM | Clock | "Share on {Day} at {Hour}" | "3x higher engagement" | [Copy Link] [QR] |
| 4 | avg_engagement < 40 | MEDIUM | TrendDown | "Refresh content" | "Below average" | [Edit] [Replace] |
| 5 | company interest | MEDIUM | Building | "Follow up with {Company}" | "{N} team members viewing" | [View Leads] |

### Detailed Analytics (3 tabs)

#### Tab: Analytics (3 per row)

**Row 1: Time & Engagement**
| Views Over Time | Engagement Breakdown | Best Time to Share |

**Row 2: When**
| Top Days | Popular Hours | Return vs New |

**Row 3: Traffic**
| Traffic Sources | Access Method (QR/Direct) | UTM Campaigns |

**Row 4: Devices**
| Devices | Browsers | OS |

**Row 5a: World Map (Full Width)**
| World Map |

**Row 5b: Location**
| Countries | Cities | Regions |

**Row 6: Other**
| Languages | Actions (Downloaded/Returned) | Virality Score |

**Row 7: PAGE-BY-PAGE ANALYTICS (Documents Only)**
| Time Per Page | Drop-off Analysis | Page Heatmap |

#### Tab: Viewers

| Column | Icon | Data |
|--------|------|------|
| Name | User | viewer_name |
| Email | Mail | viewer_email |
| Company | Building | parsed from email |
| Intent | Fire/Yellow/Gray | intent_signal |
| Engage | Chart | engagement_score |
| Pages | Doc | "X/Y pages" |
| Complete | Check | completion_% |
| Time | Clock | duration |
| Visits | Refresh | return_count + 1 |
| Downloaded | Download | icon if true |
| Country | Globe | flag emoji |
| Device | Monitor | device icon |
| Source | Link | referrer_source |
| Last Visit | Clock | relative time |

#### Tab: Settings

| Setting | Type |
|---------|------|
| Require Name | Toggle |
| Require Email | Toggle |
| Allow Download | Toggle |
| Password Protection | Toggle + Input |
| Expiration Date | Toggle + Picker |
| Notes | Textarea |

---

## 5. Section 3: File Detail - Media

**Applies to:** Video (MP4, MOV, WebM), Audio (MP3, WAV, M4A)
**URL:** `/dashboard/files/[id]`

### Quick Stats (10 cards)

| # | Icon | Label | Source |
|---|------|-------|--------|
| 1 | Views | Views | cached_total_views |
| 2 | QR | QR Scans | cached_qr_scans |
| 3 | Users | Unique | cached_unique_viewers |
| 4 | Chart | Engage | cached_avg_engagement |
| 5 | Fire | Hot | cached_hot_leads |
| 6 | Play | Avg Play Time | AVG(play_time_seconds) |
| 7 | Check | Completion % | AVG(completion_percent) |
| 8 | Flag | Finished | COUNT(finished=true) |
| 9 | Refresh | Return % | (return_visits / total) x 100 |
| 10 | Download | Downloads | SUM(download_count) |

### Key Insights (up to 8)

| # | Condition | Icon | Text | Implication |
|---|-----------|------|------|-------------|
| 1 | avg_play > 70% | Play | "Avg play time {X} ({Y}%)" | "Strong retention" |
| 2 | finished > 50% | Flag | "{N} viewers finished entirely" | "Content holding attention" |
| 3 | early_drop > 30% | Warning | "{X}% drop in first 30s" | "Hook needs improvement" |
| 4 | best time | Clock | "Peak viewing: {Days} at {Hours}" | "Best time to share" |
| 5 | company >=2 | Users | "{N} from {Company} viewing" | "Being shared internally" |
| 6 | mobile > 40% | Phone | "{X}% from mobile" | "Good mobile experience" |
| 7 | downloads > 20% | Download | "{X}% downloaded" | "Saving for later" |
| 8 | return > 25% | Refresh | "{X}% return visitors" | "Worth revisiting" |

### Recommended Actions (up to 5)

| # | Condition | Priority | Icon | Title | Reason | Buttons |
|---|-----------|----------|------|-------|--------|---------|
| 1 | hot_leads > 0 | HIGH | Fire | "Contact {N} hot leads" | "Finished + engaged" | [View Leads] |
| 2 | early_drop > 30% | HIGH | Warning | "Improve first 30 seconds" | "{X}% early drop-off" | [Edit] |
| 3 | best_time known | MEDIUM | Clock | "Share on {Day} at {Hour}" | "Peak time" | [Copy Link] [QR] |
| 4 | company interest | MEDIUM | Building | "Follow up with {Company}" | "{N} team members" | [View Leads] |
| 5 | low completion | MEDIUM | TrendDown | "Shorten content" | "Low completion rate" | [Edit] |

### Detailed Analytics (3 tabs)

#### Tab: Analytics (3 per row)

**Rows 1-6: Same as Document**

**Row 7: MEDIA ANALYTICS (Media Only)**
| Play Time Distribution | Completion Distribution | Finished vs Dropped |

**NO Page-by-Page for Media**

#### Tab: Viewers

| Column | Icon | Data |
|--------|------|------|
| Name | User | viewer_name |
| Email | Mail | viewer_email |
| Company | Building | parsed |
| Intent | Fire/Yellow/Gray | intent_signal |
| Engage | Chart | engagement_score |
| Play Time | Play | "Xm Ys / Total" |
| Complete | Check | completion_% |
| Finished | Flag | icon if true |
| Visits | Refresh | return_count + 1 |
| Downloaded | Download | icon if true |
| Country | Globe | flag |
| Device | Monitor | device icon |
| Source | Link | referrer_source |
| Last Visit | Clock | relative time |

#### Tab: Settings

Same as Document.

---

## 6. Section 4: File Detail - Image

**Applies to:** PNG, JPG, JPEG, GIF, WebP, SVG
**URL:** `/dashboard/files/[id]`

### Quick Stats (8 cards)

| # | Icon | Label | Source |
|---|------|-------|--------|
| 1 | Views | Views | cached_total_views |
| 2 | QR | QR Scans | cached_qr_scans |
| 3 | Users | Unique | cached_unique_viewers |
| 4 | Chart | Engage | cached_avg_engagement |
| 5 | Fire | Hot | cached_hot_leads |
| 6 | Clock | Avg View Time | AVG(duration) |
| 7 | Refresh | Return % | (return / total) x 100 |
| 8 | Download | Downloads | SUM(download_count) |

**NO Completion % for Images**

### Key Insights (up to 8)

| # | Condition | Icon | Text | Implication |
|---|-----------|------|------|-------------|
| 1 | avg_time > 30s | Clock | "Avg view time {X}s" | "Holding attention" |
| 2 | downloads > 30% | Download | "{X}% downloaded" | "High interest" |
| 3 | best time | Clock | "Peak viewing: {Days} at {Hours}" | "Best time to share" |
| 4 | company >=2 | Users | "{N} from {Company}" | "Shared internally" |
| 5 | mobile > 40% | Phone | "{X}% from mobile" | "Mobile-friendly" |
| 6 | return > 25% | Refresh | "{X}% return visitors" | "Worth revisiting" |
| 7 | qr > 20% | QR | "{X}% from QR" | "Physical distribution working" |
| 8 | high engagement | Fire | "Above average engagement" | "Content resonating" |

### Recommended Actions (up to 5)

| # | Condition | Priority | Icon | Title | Reason | Buttons |
|---|-----------|----------|------|-------|--------|---------|
| 1 | hot_leads > 0 | HIGH | Fire | "Contact {N} hot leads" | "High engagement" | [View Leads] |
| 2 | best_time known | MEDIUM | Clock | "Share on {Day} at {Hour}" | "Peak time" | [Copy Link] [QR] |
| 3 | company interest | MEDIUM | Building | "Follow up with {Company}" | "{N} team members" | [View Leads] |
| 4 | high downloads | MEDIUM | Download | "Follow up with downloaders" | "They saved your image" | [View Leads] |
| 5 | low engagement | MEDIUM | TrendDown | "Try different image" | "Below average" | [Replace] |

### Detailed Analytics

**Rows 1-6: Same as Document**

**NO Page-by-Page**
**NO Media Analytics**

#### Tab: Viewers (simplified)

| Column | Data |
|--------|------|
| Name, Email, Company | Standard |
| Intent, Engage | Standard |
| View Time | duration |
| Visits, Downloaded | Standard |
| Country, Device, Source, Last Visit | Standard |

---

## 7. Section 5: File Detail - Other

**Applies to:** ZIP, RAR, and other file types
**URL:** `/dashboard/files/[id]`

### Quick Stats (6 cards)

| # | Icon | Label | Source |
|---|------|-------|--------|
| 1 | Views | Views | cached_total_views |
| 2 | QR | QR Scans | cached_qr_scans |
| 3 | Users | Unique | cached_unique_viewers |
| 4 | Fire | Hot | cached_hot_leads |
| 5 | Refresh | Return % | (return / total) x 100 |
| 6 | Download | Downloads | SUM(download_count) |

**NO Engagement Score (hard to measure)**
**NO Completion %**

### Key Insights (up to 8)

| # | Condition | Icon | Text | Implication |
|---|-----------|------|------|-------------|
| 1 | downloads > 50% | Download | "{X}% downloaded" | "Content being saved" |
| 2 | company >=2 | Users | "{N} from {Company}" | "Shared internally" |
| 3 | best time | Clock | "Peak: {Days} at {Hours}" | "Best time to share" |
| 4 | return > 25% | Refresh | "{X}% return visitors" | "Revisiting" |
| 5 | qr > 20% | QR | "{X}% from QR" | "Physical distribution" |

### Recommended Actions (up to 5)

| # | Condition | Priority | Icon | Title | Reason | Buttons |
|---|-----------|----------|------|-------|--------|---------|
| 1 | downloads high | MEDIUM | Download | "Follow up with downloaders" | "They saved your file" | [View Leads] |
| 2 | company interest | MEDIUM | Building | "Follow up with {Company}" | "{N} team members" | [View Leads] |
| 3 | best_time | MEDIUM | Clock | "Share on {Day}" | "Peak time" | [Copy Link] |

### Detailed Analytics

**Basic charts only (Rows 1-6)**
**NO Page-by-Page**
**NO Media Analytics**

---

## 8. Section 6: Link Detail

**Applies to:** External URLs (type="url")
**URL:** `/dashboard/files/[id]`

### Quick Stats (8 cards)

| # | Icon | Label | Source |
|---|------|-------|--------|
| 1 | Views | Clicks | cached_total_views |
| 2 | QR | QR Scans | cached_qr_scans |
| 3 | Users | Unique | cached_unique_viewers |
| 4 | Chart | Engage | cached_avg_engagement |
| 5 | Fire | Hot | cached_hot_leads |
| 6 | Clock | Avg Time | AVG(duration) on landing |
| 7 | Refresh | Return % | (return / total) x 100 |
| 8 | Users | Unique % | (unique / total) x 100 |

**NO Downloads (can't track external site)**

### Key Insights (up to 8)

| # | Condition | Icon | Text | Implication |
|---|-----------|------|------|-------------|
| 1 | note | Link | "Tracking clicks to external site" | "Landing engagement tracked" |
| 2 | company >=2 | Users | "{N} from {Company} clicked" | "Team interest" |
| 3 | best time | Clock | "Most clicks: {Days} at {Hours}" | "Best time to share" |
| 4 | mobile > 40% | Phone | "{X}% mobile clicks" | "Mobile audience" |
| 5 | qr > 20% | QR | "{X}% from QR" | "Physical distribution" |
| 6 | return > 20% | Refresh | "{X}% return visitors" | "Link worth revisiting" |
| 7 | high engagement | Fire | "Strong click engagement" | "Link is effective" |
| 8 | utm performing | Tag | "{Campaign} driving {X}% clicks" | "Campaign working" |

### Recommended Actions (up to 5)

| # | Condition | Priority | Icon | Title | Reason | Buttons |
|---|-----------|----------|------|-------|--------|---------|
| 1 | hot_leads > 0 | HIGH | Fire | "Contact {N} interested leads" | "Clicked + engaged" | [View Leads] |
| 2 | company interest | MEDIUM | Building | "Follow up with {Company}" | "{N} team clicked" | [View Leads] |
| 3 | best_time | MEDIUM | Clock | "Share on {Day} at {Hour}" | "Peak click time" | [Copy Link] [QR] |
| 4 | utm success | MEDIUM | Tag | "Amplify {Campaign}" | "High performance" | [Copy UTM Link] |
| 5 | low engagement | MEDIUM | TrendDown | "Update link destination" | "Below average" | [Edit URL] |

### Detailed Analytics (3 per row)

**Rows 1-6: Same structure as Document**
**NO Page-by-Page**
**NO Media Analytics**

---

## 9. Section 7: Contact Detail

**URL:** `/dashboard/contacts/[id]`
**Scope:** Individual person's activity across all files

### Quick Stats (10 cards)

| # | Icon | Label | Source |
|---|------|-------|--------|
| 1 | Chart | Engage | avg_engagement |
| 2 | Views | Visits | total_views |
| 3 | Folder | Files | files_viewed.length |
| 4 | Clock | Total Time | total_time_seconds |
| 5 | Calendar | First Seen | first_seen_at |
| 6 | Clock | Last Seen | last_seen_at |
| 7 | Refresh | Returns | SUM(return_visit_count) |
| 8 | Download | Downloads | SUM(download_count) |
| 9 | Check | Avg Complete | AVG(completion_%) |
| 10 | Fire | Intent | Hot/Warm/Cold badge |

### Key Insights (up to 8)

| # | Condition | Icon | Text | Implication |
|---|-----------|------|------|-------------|
| 1 | pricing_focus > 30% | Dollar | "Spent 3x longer on pricing" | "Evaluating cost" |
| 2 | return >=3 + download | Refresh | "Downloaded after {N} visits" | "Was comparing options" |
| 3 | peak time detected | Clock | "Most active {Day} at {Hour}" | "Optimal contact time" |
| 4 | colleagues viewing | Users | "{N} colleagues also viewed" | "Shared internally at {Company}" |
| 5 | high intent | Fire | "Very high intent signals" | "Priority follow-up" |
| 6 | multiple files | Folder | "Viewed {N} different files" | "Broad interest" |
| 7 | quick return | Zap | "Returned within 24 hours" | "Urgent interest" |
| 8 | specific focus | Target | "Focused mainly on {File}" | "Primary interest area" |

### Recommended Actions (up to 5)

| # | Condition | Priority | Icon | Title | Reason | Buttons |
|---|-----------|----------|------|-------|--------|---------|
| 1 | engagement >=70 + recent | HIGH | Fire | "Contact {Name} now" | "{X}% engagement, {Y}h ago" | [Email] [LinkedIn] |
| 2 | pricing focus | HIGH | Dollar | "Send pricing details" | "Focus on pricing" | [Draft Email] |
| 3 | peak time known | MEDIUM | Clock | "Schedule for {Day} {Hour}" | "Their active time" | [Schedule] |
| 4 | team viewing | MEDIUM | Users | "Propose team demo" | "{N} colleagues viewing" | [Draft Email] |
| 5 | downloaded + engaged | MEDIUM | Download | "Send follow-up materials" | "Ready for more" | [Draft Email] |

### Detailed Sections

#### Behavior Tags (auto-generated)

| Condition | Tag |
|-----------|-----|
| engagement >= 80 | "High Intent" |
| downloaded | "Downloaded" |
| return_visits >= 2 | "Returning" |
| pricing_focus | "Price Sensitive" |
| multiple_files | "Researching" |
| finished_media | "Completed Media" |
| recent_activity | "Recently Active" |

#### Notes Section

- Add/edit notes about this contact
- Timestamp for each note

#### Viewer Location Map

| Full Width |
|------------|
| World Map with single pin showing viewer's primary location |

| Chart 1 | Chart 2 |
|---------|---------|
| Location History (cities viewed from) | Device Summary |

#### Activity History Table

| Column | Data |
|--------|------|
| File | file name + icon |
| Engage | engagement_score |
| Time | duration |
| Pages/Play | pages viewed OR play time |
| Downloaded | is_downloaded |
| Return | is_return_visit |
| Device | device_type |
| Location | country, city |
| When | accessed_at |

---

## 10. Section 8: Global Analytics

**URL:** `/dashboard/analytics`
**Scope:** Filterable - all data or specific file/link

### Filters

| Filter | Options |
|--------|---------|
| Time Range | [7d] [14d] [30d] [All Time] |
| Scope | [All Files & Links] [Select specific] |

### Quick Stats (10 cards)

Same as Dashboard.

### Key Insights (up to 8)

Same logic as Dashboard, filtered by selected scope.

### Recommended Actions (up to 5)

Same logic as Dashboard, filtered by selected scope.

### Detailed Charts (3 per row)

**Rows 1-7: Same as Dashboard**

**Bottom Section:**
| Top Performing | Needs Attention | Health Overview |

---

## 11. World Map Specification

### Map Properties

| Attribute | Value |
|-----------|-------|
| Type | Interactive choropleth map |
| Data Source | `access_logs.country` aggregated |
| Colors | Heat gradient (more views = darker blue) |
| Interaction | Hover to see country name + view count |
| Click | Filter to show only that country's data |
| Tier | PRO (blurred for Free/Starter) |
| Position | Full width, above location charts |

### Map Data Structure
```typescript
interface WorldMapData {
  country_code: string;    // "US", "KR", "JP"
  country_name: string;    // "United States", "South Korea"
  views: number;           // 234
  unique_viewers: number;  // 156
  percentage: number;      // 45.2
}
```

### Usage by Section

| Section | Map Type |
|---------|----------|
| Dashboard | All viewers, heat map |
| File Detail | File viewers, heat map |
| Link Detail | Link clickers, heat map |
| Contact Detail | Single pin, viewer's locations |
| Global Analytics | Filtered by scope, heat map |

---

## 12. File Type Features Matrix

| Feature | Document | Media | Image | Other | URL |
|---------|:--------:|:-----:|:-----:|:-----:|:---:|
| **Quick Stats Count** | 10 | 10 | 8 | 6 | 8 |
| Views | Yes | Yes | Yes | Yes | Yes |
| QR Scans | Yes | Yes | Yes | Yes | Yes |
| Unique | Yes | Yes | Yes | Yes | Yes |
| Engagement | Yes | Yes | Yes | No | Yes |
| Hot Leads | Yes | Yes | Yes | Yes | Yes |
| Completion % | Yes | Yes | No | No | No |
| Avg Time/Play | Yes | Yes | Yes | No | Yes |
| Finished | No | Yes | No | No | No |
| Return % | Yes | Yes | Yes | Yes | Yes |
| Downloads | Yes | Yes | Yes | Yes | No |
| Unique % | Yes | No | No | No | Yes |
| **Special Analytics** |||||
| Page-by-Page | Yes | No | No | No | No |
| Media Analytics | No | Yes | No | No | No |
| **Standard Charts** | Yes | Yes | Yes | Yes | Yes |
| **World Map** | Yes | Yes | Yes | Yes | Yes |
| **Key Insights** | up to 8 | up to 8 | up to 8 | up to 8 | up to 8 |
| **Actions** | up to 5 | up to 5 | up to 5 | up to 5 | up to 5 |

---

## Appendix: Standard Chart Rows

All file types include these standard chart rows:

| Row | Chart 1 | Chart 2 | Chart 3 |
|-----|---------|---------|---------|
| 1 | Views Over Time | Engagement Breakdown | Best Time to Share |
| 2 | Top Days | Popular Hours | Return vs New |
| 3 | Traffic Sources | Access Method | UTM Campaigns |
| 4 | Devices | Browsers | OS |
| 5a | World Map (full width) | | |
| 5b | Countries | Cities | Regions |
| 6 | Languages | Actions | Virality Score |

---

*End of Analytics Display Specification*
