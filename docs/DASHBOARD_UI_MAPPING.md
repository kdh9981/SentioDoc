# LinkLens Dashboard UI/UX Mapping

> **Purpose:** Map all dashboard pages, their current UI, and identify missing data displays
> **Last Updated:** December 6, 2025

---

## 📍 Dashboard Navigation Structure

```
SIDEBAR MENU
├── 📊 Dashboard (Overview)
├── CREATE LINKS
│   ├── 📤 Upload File
│   └── 🔗 Track Site
├── VIEW LINKS
│   ├── 📁 My Links
│   └── ⭐ Favorites
├── MANAGE
│   ├── 👥 Contacts
│   ├── 📈 Analytics
│   ├── 🌐 Domains
│   ├── 🏷️ Tags
│   └── ⚙️ Settings
└── USAGE CARD (Bottom)
    ├── Links: X/Y
    ├── Views: X/Y
    ├── Storage: X/Y
    └── [Upgrade Button]
```

---

## 📊 PAGE 1: Dashboard (Overview)

### Current UI Elements

| Component | Data Displayed | Status |
|-----------|---------------|--------|
| Welcome message | User name | ✅ Working |
| Time filter (1W/1M/1Y/All) | Filter selector | ✅ Working |

### MetricsRow (Top Stats Cards)

| Card | Current Display | Data Source | Missing |
|------|----------------|-------------|---------|
| Total Views | Number + % change | stats.totalViews | ⚠️ Change % is hardcoded (12) |
| Unique Viewers | Number | stats.uniqueViewers | ⚠️ No change % |
| Avg Engagement | Number (0-100) | Calculated from activity | ⚠️ No change % |
| Hot Leads | Number | Count of 80+ engagement | ⚠️ No change % |
| Downloads | Number | - | ❌ Not tracked yet |
| Downloads Today | Number | - | ❌ Not tracked yet |

### HotLeadsCard

| Data Point | Currently Shown | Status |
|------------|-----------------|--------|
| Lead name | ✅ Yes | Working |
| Lead email | ✅ Yes | Working |
| Company (from email) | ✅ Yes | Working |
| Engagement score | ✅ Yes | Working |
| File name | ✅ Yes | Working |
| Last visit time | ✅ Yes | Working |

### RecentActivityCard

| Data Point | Currently Shown | Status |
|------------|-----------------|--------|
| Viewer name | ✅ Yes | Working |
| Viewer email | ✅ Yes | Working |
| File name | ✅ Yes | Working |
| Engagement score | ✅ Yes | Working |
| Duration | ✅ Yes | Working |
| Time ago | ✅ Yes | Working |
| Country | ❌ No | Missing |
| Device | ❌ No | Missing |
| Intent signal (Hot/Warm/Cold) | ❌ No | Missing |

### ViewsTrendCard

| Data Point | Currently Shown | Status |
|------------|-----------------|--------|
| Chart | ⚠️ Placeholder | Need to implement |
| Trend line | ❌ No | Missing |
| Comparison | ❌ No | Missing |

### TopContentCard

| Data Point | Currently Shown | Status |
|------------|-----------------|--------|
| File name | ✅ Yes | Working |
| View count | ✅ Yes | Working |
| File type icon | ✅ Yes | Working |
| Engagement score | ❌ No | Missing |
| Trend | ❌ No | Missing |

### ActiveCompaniesCard

| Data Point | Currently Shown | Status |
|------------|-----------------|--------|
| Company name | ✅ Yes | Working |
| Avg engagement | ✅ Yes | Working |
| Viewer count | ✅ Yes | Working |
| Company logo | ❌ No | Could add Clearbit |

---

## 📤 PAGE 2: Upload File

### Current UI

| Element | Status | Notes |
|---------|--------|-------|
| Drag & drop zone | ✅ Working | |
| File type icons | ✅ Working | |
| File name input | ✅ Working | |
| Password toggle + input | ✅ Working | With confirmation |
| Email gate toggle | ✅ Working | |
| Name required toggle | ✅ Working | |
| Expiration date toggle + picker | ✅ Working | |
| Allow download toggle | ✅ Working | |
| Create Link button | ✅ Working | |

### Missing Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Tags input | Medium | Add tags during creation |
| Folder selector | Medium | Organize on creation |
| UTM builder | Low | Add UTM params during creation |
| Custom slug input | Medium | Let users choose slug |

---

## 🔗 PAGE 3: Track Site (External URL)

### Current UI

| Element | Status | Notes |
|---------|--------|-------|
| URL input | ✅ Working | |
| Same options as Upload | ✅ Working | |

---

## 📁 PAGE 4: My Links (Files List)

### Current UI - List View

| Column | Currently Shown | Status |
|--------|-----------------|--------|
| File icon/thumbnail | ✅ Yes | Working |
| File name | ✅ Yes | Working |
| Type (file/url) | ✅ Yes | Working |
| Views count | ✅ Yes | Working |
| Created date | ✅ Yes | Working |
| Actions (Copy, QR, Delete) | ✅ Yes | Working |

### Missing from List View

| Data Point | Priority | Notes |
|------------|----------|-------|
| Unique viewers | High | Show alongside views |
| Avg engagement score | High | Quick engagement indicator |
| Hot leads count | Medium | "🔥 3 hot leads" |
| Last viewed time | High | "Last viewed 2h ago" |
| Star/favorite toggle | High | Quick favorite action |
| Tags | Medium | Show assigned tags |
| Folder | Medium | Show folder if assigned |
| Status indicator | Medium | Active/Expired/Password |

### Missing Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Search bar | High | Search by file name |
| Filter by type | Medium | All/PDF/Video/Image/etc |
| Filter by date | Medium | Created/Last viewed |
| Sort options | High | Views/Date/Engagement |
| Bulk actions | Low | Delete multiple |
| Grid view toggle | Low | Card layout option |

---

## 📄 PAGE 5: File Detail Page

### Header Section

| Element | Currently Shown | Status |
|---------|-----------------|--------|
| File name | ✅ Yes | |
| File icon | ✅ Yes | |
| Created date | ✅ Yes | |
| Favorite button | ✅ Yes | |
| Copy link button | ✅ Yes | With feedback |
| QR code button | ✅ Yes | With modal |
| Delete button | ✅ Yes | With confirmation |

### Share URL Bar

| Element | Status |
|---------|--------|
| URL display | ✅ Working |
| Copy button | ✅ Working |
| UTM Builder | ❌ Missing |

### Quick Stats (4 Cards)

| Card | Currently Shown | Status |
|------|-----------------|--------|
| Total Views | ✅ Yes | |
| Unique Viewers | ✅ Yes | |
| Avg Engagement | ✅ Yes | |
| Hot Leads | ✅ Yes | |

### Missing Quick Stats

| Stat | Priority | Notes |
|------|----------|-------|
| Downloads | High | If download enabled |
| Completion Rate | High | % who finished |
| Avg Time Spent | High | e.g., "3m 24s" |
| Return Visitors | Medium | % who came back |

---

### Tab: Analytics

#### Currently Shown

| Component | Data | Status |
|-----------|------|--------|
| Time filter | 7d/14d/30d/All | ✅ Working |
| Hot Leads Alert | List of 80+ engagement | ✅ Working |
| Views Over Time Chart | Line chart | ✅ Working |
| Engagement Breakdown | Hot/Warm/Cold counts | ✅ Working |
| Actions Taken | Downloaded/Printed/Returned | ⚠️ Partial |

#### Missing Analytics (We Collect But Don't Display)

| Data Point | Priority | In Database? | Notes |
|------------|----------|--------------|-------|
| **Traffic Sources** | High | ✅ referrer_source | Pie chart: Direct/Google/LinkedIn/etc |
| **Device Breakdown** | High | ✅ device_type | Desktop/Mobile/Tablet % |
| **Browser Breakdown** | Low | ✅ browser | Chrome/Safari/Firefox % |
| **OS Breakdown** | Low | ✅ os | Windows/Mac/iOS % |
| **Country/City** | High | ✅ country, city | Top countries list |
| **Page Heatmap** | High | ✅ pages_time_data | Which pages get most time |
| **Drop-off Analysis** | High | ✅ exit_page | Where viewers leave |
| **Best Time to Share** | Medium | ✅ accessed_at | Peak viewing hours |
| **UTM Performance** | Medium | ✅ utm_* fields | Which campaigns work |
| **Entry/Exit Pages** | Medium | ✅ entry_page, exit_page | First/last pages |
| **Video Completion** | High | ✅ video_completion_percent | For video files |
| **Watch Time** | High | ✅ watch_time_seconds | For video files |
| **Return Visit Rate** | Medium | ✅ is_return_visit | % who come back |

---

### Tab: Viewers

#### Currently Shown

| Column | Status | Notes |
|--------|--------|-------|
| Avatar (initials) | ✅ Yes | |
| Name | ✅ Yes | |
| Email | ✅ Yes | |
| Company | ✅ Yes | Parsed from email |
| Engagement score + badge | ✅ Yes | 🔥🟡⚪ |
| Time spent | ✅ Yes | |
| Visits count | ✅ Yes | |
| Last visit | ✅ Yes | |
| Downloaded icon | ✅ Yes | |
| Returned icon | ✅ Yes | |

#### Missing from Viewers Tab

| Data Point | Priority | In Database? | Notes |
|------------|----------|--------------|-------|
| Country flag | High | ✅ country | 🇺🇸 🇰🇷 |
| Device icon | Medium | ✅ device_type | 💻 📱 |
| Pages viewed | Medium | ✅ pages_viewed_count | "Viewed 8/12 pages" |
| Max page reached | Medium | ✅ max_page_reached | "Got to page 10" |
| Completion % | High | ✅ completion_percentage | "83% complete" |
| Entry page | Low | ✅ entry_page | "Started at page 1" |
| Exit page | Low | ✅ exit_page | "Left at page 6" |
| Referrer source | Medium | ✅ referrer_source | "From LinkedIn" |
| Intent signal | High | ✅ intent_signal | Hot/Warm/Cold badge |

---

### Tab: Settings

#### Currently Shown

| Setting | Status |
|---------|--------|
| Require Name toggle | ✅ Yes |
| Require Email toggle | ✅ Yes |
| Allow Download toggle | ✅ Yes |
| Password Protection toggle + inputs | ✅ Yes |
| Expiration Date toggle + picker | ✅ Yes |
| Notes textarea (auto-save) | ✅ Yes |
| Save Settings button | ✅ Yes |

#### Missing Settings

| Setting | Priority | Notes |
|---------|----------|-------|
| Custom slug editor | Medium | Change /abc123 to /my-doc |
| Tags editor | Medium | Add/remove tags |
| Folder selector | Medium | Move to folder |
| Enable/Disable link | Medium | Pause without deleting |
| Notification preferences | Low | Email on view |
| Custom branding | Medium | Custom logo for this link |

---

## ⭐ PAGE 6: Favorites

### Current State

| Feature | Status | Notes |
|---------|--------|-------|
| Favorites list | ⚠️ Empty | Need to fetch is_favorite files |
| Remove from favorites | ❌ Stub | Not implemented |

### Should Display

Same as My Links but filtered to `is_favorite = true`

---

## 👥 PAGE 7: Contacts

### Current UI (ContactsPage.tsx)

| Element | Status | Notes |
|---------|--------|-------|
| Search bar | ✅ Yes | |
| Hot leads filter | ✅ Yes | |
| Contacts table | ✅ Yes | |

### Contacts Table Columns

| Column | Currently Shown | Status |
|--------|-----------------|--------|
| Avatar | ✅ Yes | |
| Name | ✅ Yes | |
| Email | ✅ Yes | |
| Company | ✅ Yes | |
| Hot lead badge | ✅ Yes | 🔥 |
| Engagement bar | ✅ Yes | |
| Total views | ✅ Yes | |
| Time spent | ✅ Yes | |
| Last seen | ✅ Yes | |

### Missing from Contacts

| Data Point | Priority | Notes |
|------------|----------|-------|
| Files viewed count | Medium | "Viewed 5 files" |
| First seen date | Medium | When first appeared |
| Contact score | High | Overall ranking |
| Export button | Medium | Export contacts to CSV |
| Click to see files viewed | Medium | Expandable row |

---

## 📈 PAGE 8: Analytics (Global)

### Current UI (AnalyticsPage.tsx)

| Element | Status | Notes |
|---------|--------|-------|
| Total views card | ✅ Yes | |
| Unique viewers card | ✅ Yes | |
| Avg engagement card | ✅ Yes | |
| Top countries | ⚠️ Hardcoded | Need real data |
| Device breakdown | ⚠️ Hardcoded | Need real data |
| Views by day chart | ❌ Empty | Need to implement |

### Missing from Global Analytics

| Feature | Priority | Notes |
|---------|----------|-------|
| Real country data | High | From access_logs |
| Real device data | High | From access_logs |
| Real views by day | High | Chart from access_logs |
| Traffic sources | High | Direct/Google/LinkedIn |
| Best time to share | Medium | Hour/day analysis |
| Top performing files | High | By engagement |
| Underperforming files | Medium | Low engagement |
| Hot leads summary | High | Across all files |
| World map | Low | Pro tier |

---

## 🌐 PAGE 9: Domains

### Current UI (DomainSettings.tsx)

| Element | Status |
|---------|--------|
| Add domain form | ✅ Working |
| Domain list | ✅ Working |
| Verify button | ✅ Working |
| Delete button | ✅ Working |

---

## 🏷️ PAGE 10: Tags

### Current UI (TagsPage.tsx)

| Element | Status | Notes |
|---------|--------|-------|
| Tags list | ⚠️ Need check | |
| Create tag | ⚠️ Need check | |
| Delete tag | ⚠️ Need check | |
| Files per tag count | ⚠️ Need check | |

---

## ⚙️ PAGE 11: Settings

### Current UI (SettingsPage.tsx)

| Section | Elements | Status |
|---------|----------|--------|
| Profile | Name, Email, Company | ✅ |
| Current Plan | Tier display | ✅ |
| Upgrade button | ✅ | |
| Notifications | Toggles | ⚠️ Stub |
| Custom branding | Logo upload | ❌ Missing |
| Account actions | Sign out, Delete account | ⚠️ Partial |

---

## 🔴 CRITICAL MISSING FEATURES

### Data We Collect But Don't Display

| Data Field | Collected In | Should Display In | Priority |
|------------|--------------|-------------------|----------|
| `device_type` | access_logs | Analytics, Viewers tab | 🔴 High |
| `browser` | access_logs | Analytics | 🟡 Medium |
| `os` | access_logs | Analytics | 🟡 Medium |
| `country` | access_logs | Analytics, Viewers tab | 🔴 High |
| `city` | access_logs | Viewers tab (Pro) | 🟡 Medium |
| `referrer_source` | access_logs | Analytics, Viewers tab | 🔴 High |
| `utm_*` fields | access_logs | Analytics | 🟡 Medium |
| `pages_time_data` | access_logs | Page Heatmap | 🔴 High |
| `entry_page` | access_logs | Viewers tab | 🟡 Medium |
| `exit_page` | access_logs | Drop-off chart | 🔴 High |
| `completion_percentage` | access_logs | Viewers tab | 🔴 High |
| `is_return_visit` | access_logs | Viewers tab | 🟡 Medium |
| `intent_signal` | access_logs | Viewers tab, Hot leads | 🔴 High |
| `video_completion_percent` | access_logs | Video analytics | 🔴 High |
| `language` | access_logs | Analytics | 🟢 Low |

### Features Defined But Not Built

| Feature | Defined In | Status |
|---------|------------|--------|
| TierGate (blur locked features) | Phase 5 | ⚠️ Component exists, not applied |
| Page Heatmap | Phase 5 | ⚠️ Component exists, not integrated |
| Drop-off Chart | Phase 5 | ⚠️ Component exists, not integrated |
| World Map | Phase 5 | ⚠️ Component exists, not integrated |
| Action Dashboard | Phase 5 | ⚠️ Component exists, not shown |
| CSV Export | Phase 4 | ❌ API exists, no UI button |
| UTM Builder | Phase 4 | ⚠️ Component exists, not integrated |
| Custom Logo | Phase 4 | ⚠️ API exists, no settings UI |

---

## 📋 PRIORITY ACTION LIST

### Tier 1 (Must Fix First)

1. **File Detail Analytics Tab** - Add missing charts:
   - Traffic Sources pie chart
   - Device breakdown
   - Country list
   - Page Heatmap (for PDFs)
   - Drop-off analysis

2. **File Detail Viewers Tab** - Add columns:
   - Country flag
   - Completion %
   - Intent signal badge
   - Device icon

3. **My Links Page** - Add columns:
   - Avg engagement
   - Last viewed
   - Hot leads count
   - Quick actions (star)

4. **Dashboard Overview** - Fix:
   - Real % change calculations
   - Real data in ViewsTrendCard
   - Add traffic sources card

### Tier 2 (Should Do)

5. **Global Analytics Page** - Replace hardcoded data:
   - Real country breakdown
   - Real device breakdown
   - Real traffic sources
   - Views over time chart

6. **Contacts Page** - Add:
   - Files viewed count
   - Contact score
   - Export to CSV button

7. **Settings Page** - Add:
   - Custom logo upload
   - Branding preview

### Tier 3 (Nice to Have)

8. **Favorites Page** - Actually fetch favorites
9. **Tags Page** - Verify working
10. **UTM Builder** - Add to share URL section
11. **Bulk actions** - Select multiple files
12. **Search** - Search files by name

---

## 📐 RECOMMENDED UI UPDATES

### File Detail Page - Analytics Tab Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Time Filter: [7d] [14d] [30d] [All]                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ 📈 Views Over Time       │  │ 🎯 Engagement Breakdown  │        │
│  │ [Line Chart]             │  │ 🔥 Hot: 12               │        │
│  │                          │  │ 🟡 Warm: 25              │        │
│  │                          │  │ ⚪ Cold: 8               │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ 🌍 Traffic Sources       │  │ 💻 Devices               │        │
│  │ [Pie Chart]              │  │ [Pie Chart]              │        │
│  │ Direct: 45%              │  │ Desktop: 65%             │        │
│  │ LinkedIn: 25%            │  │ Mobile: 30%              │        │
│  │ Google: 15%              │  │ Tablet: 5%               │        │
│  │ Other: 15%               │  │                          │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ 🗺️ Top Countries         │  │ 📑 Page Heatmap          │        │
│  │ 🇺🇸 United States: 120   │  │ [Visual Page Grid]       │        │
│  │ 🇰🇷 South Korea: 45      │  │ Page 1: 🟢🟢🟢🟢 (Hot)   │        │
│  │ 🇬🇧 UK: 32               │  │ Page 2: 🟡🟡🟡 (Medium)  │        │
│  │ 🇩🇪 Germany: 18          │  │ Page 3: 🔴 (Cold)        │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ 🚨 Drop-off Analysis                                     │      │
│  │ [Bar Chart showing where viewers exit]                   │      │
│  │ ⚠️ 35% of viewers leave at Page 4                        │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### My Links Page - Enhanced Row

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⭐ │ 📄 │ Investor Deck Q4 2025.pdf  │ 1,234 views │ 89 unique │ 🔥 78 │ 2h ago │ 🔗 📱 🗑️ │
│    │    │ #pitch #investors           │ +12% ↑      │           │        │ viewed  │         │
└─────────────────────────────────────────────────────────────────────────────┘

Legend:
- ⭐ = Favorite toggle
- 📄 = File type icon
- 🔥 78 = Avg engagement score
- +12% ↑ = View change vs last period
- 🔗 = Copy link
- 📱 = QR code
- 🗑️ = Delete
```

---

*This document should be updated as UI changes are made.*
