# LinkLens Master Specification

> **Version:** 2.0 (FINAL)
> **Last Updated:** December 6, 2025
> **Authors:** DongHyun Kim (CEO), Claude (Co-Pilot CEO)
> **Status:** ✅ DEFINITIVE - All decisions final

---

## Table of Contents

1. [Overview](#1-overview)
2. [Information Hierarchy](#2-information-hierarchy)
3. [Sidebar Navigation](#3-sidebar-navigation)
4. [Data Collection](#4-data-collection)
5. [Calculation Formulas](#5-calculation-formulas)
6. [Insights Engine](#6-insights-engine)
7. [Actions Engine](#7-actions-engine)
8. [Page Specifications](#8-page-specifications)
9. [UI Components](#9-ui-components)
10. [Tier Restrictions](#10-tier-restrictions)
11. [Database Schema](#11-database-schema)

---

## 1. Overview

### Product Philosophy

LinkLens transforms raw analytics into actionable intelligence:

```
📊 DATA → 💡 INSIGHTS → ✅ ACTIONS
(What happened)  (What it means)  (What to DO)
```

### Core Principle

**Most valuable information first.** Every page follows this order:
1. Quick Stats (5 seconds)
2. 💡 Insights (10 seconds) - "What does this mean?"
3. ✅ Actions (15 seconds) - "What should I do?"
4. 📊 Details (2+ minutes) - Deep dive for those who want it

### Target Users

| User | Need | Time Budget |
|------|------|-------------|
| Founder/CEO | "Who should I contact?" | 30 seconds |
| Sales Rep | "Which leads are hot?" | 1 minute |
| Marketer | "What content is working?" | 2-5 minutes |

---

## 2. Information Hierarchy

### Page Structure (All Pages)

```
┌─────────────────────────────────────────┐
│  HEADER                                 │  File/Contact name, quick stats
├─────────────────────────────────────────┤
│  💡 INSIGHTS                            │  What the data MEANS
├─────────────────────────────────────────┤
│  ✅ RECOMMENDED ACTIONS                 │  What to DO (based on insights)
├─────────────────────────────────────────┤
│  📊 DETAILED ANALYTICS                  │  Full data (tabs/sections)
└─────────────────────────────────────────┘
```

### Why This Order?

1. **Insights first** - User understands the "why"
2. **Actions second** - User knows what to do (justified by insights above)
3. **Details last** - Available for those who want to dig deeper

---

## 3. Sidebar Navigation

### Structure

```
SIDEBAR MENU
├── 📊 Dashboard (Overview)           ← Account-level view
│
├── CREATE LINKS
│   ├── 📤 Upload File                ← Upload PDF, video, image, etc.
│   └── 🔗 Track Site                 ← Track external URL
│
├── VIEW LINKS
│   ├── 📁 My Links                   ← All files & URLs list
│   └── ⭐ Favorites                  ← Starred items only
│
├── MANAGE
│   ├── 👥 Contacts                   ← People who viewed (CRM)
│   │   ├── [Individual View]         ← Default: list of people
│   │   └── [Company View]            ← Grouped by organization
│   ├── 📈 Analytics                  ← Global analytics
│   ├── 🌐 Domains                    ← Custom domain settings
│   ├── 🏷️ Tags                       ← Tag management
│   └── ⚙️ Settings                   ← Account settings, logo
│
└── USAGE CARD (Bottom)
    ├── Links: X/Y
    ├── Views: X/Y
    ├── Storage: X/Y
    └── [Upgrade Button]
```

### Click Destinations

| Menu Item | Destination | Key Content |
|-----------|-------------|-------------|
| Dashboard | `/dashboard` | Account overview, action items, insights |
| Upload File | `/dashboard/upload` | File upload form |
| Track Site | `/dashboard/track` | URL input form |
| My Links | `/dashboard/links` | Files & URLs table |
| Favorites | `/dashboard/favorites` | Starred items only |
| Contacts | `/dashboard/contacts` | Contact list (people) |
| Analytics | `/dashboard/analytics` | Global analytics charts |
| Domains | `/dashboard/domains` | Domain management |
| Tags | `/dashboard/tags` | Tag CRUD |
| Settings | `/dashboard/settings` | Profile, logo, preferences |

### Drill-Down Pages (Not in Sidebar)

| Page | URL | Access |
|------|-----|--------|
| File Detail | `/dashboard/files/[id]` | Click file in My Links |
| Link Detail | `/dashboard/links/[id]` | Click URL in My Links |
| Contact Detail | `/dashboard/contacts/[id]` | Click person in Contacts |
| Company Detail | `/dashboard/companies/[id]` | Click company in Company View |

---

## 4. Data Collection

### 4.1 Access Logs (Per View Session)

| Field | Type | Description | Example | Collected At |
|-------|------|-------------|---------|--------------|
| **IDENTITY** |
| `id` | UUID | Primary key | auto | Start |
| `file_id` | UUID | Which file/link | FK | Start |
| `session_id` | String | Unique session | uuid | Start |
| **VIEWER INFO** |
| `viewer_name` | String | Name (if required) | "Sarah Chen" | Start |
| `viewer_email` | String | Email (if required) | "sarah@seq.com" | Start |
| `ip_address` | String | For geolocation | "203.0.113.42" | Start |
| **GEOLOCATION** |
| `country` | String | Country name | "United States" | Start |
| `city` | String | City name | "San Francisco" | Start |
| `region` | String | State/Province | "California" | Start |
| **DEVICE & BROWSER** |
| `device_type` | String | Device category | "desktop" / "mobile" / "tablet" | Start |
| `browser` | String | Browser name | "Chrome" / "Safari" / "Firefox" | Start |
| `os` | String | Operating system | "Windows" / "Mac" / "iOS" | Start |
| `language` | String | Browser language | "en-US" / "ko-KR" | Start |
| **TRAFFIC SOURCE** |
| `referrer` | String | Full referrer URL | "https://linkedin.com/feed" | Start |
| `referrer_source` | String | Parsed source | "direct" / "google" / "linkedin" / "email" | Start |
| `utm_source` | String | UTM source | "facebook" | Start |
| `utm_medium` | String | UTM medium | "paid_social" | Start |
| `utm_campaign` | String | UTM campaign | "q4_launch" | Start |
| `utm_term` | String | UTM term | "analytics" | Start |
| `utm_content` | String | UTM content | "banner_a" | Start |
| `access_method` | String | How accessed | "direct_click" / "qr_scan" | Start |
| **SESSION TIMING** |
| `accessed_at` | Timestamp | Session start | "2025-12-06T14:30:00Z" | Start |
| `session_end_at` | Timestamp | Session end | "2025-12-06T14:35:42Z" | End |
| `total_duration_seconds` | Integer | Time spent | 342 | End |
| `is_return_visit` | Boolean | Visited before? | true | Start |
| `return_visit_count` | Integer | Previous visits | 3 | Start |
| **DOCUMENT ENGAGEMENT** |
| `total_pages` | Integer | Document page count | 12 | Start |
| `pages_viewed_count` | Integer | Pages seen | 8 | End |
| `max_page_reached` | Integer | Furthest page | 10 | End |
| `entry_page` | Integer | First page viewed | 1 | End |
| `exit_page` | Integer | Last page viewed | 6 | End |
| `completion_percentage` | Float | % document viewed | 83.3 | End |
| `pages_time_data` | JSONB | Time per page | `{"1":45,"2":30,"6":120}` | End |
| **VIDEO ENGAGEMENT** |
| `video_duration_seconds` | Integer | Video length | 180 | Start |
| `watch_time_seconds` | Integer | Time watched | 145 | End |
| `video_completion_percent` | Float | % watched | 80.5 | End |
| `video_finished` | Boolean | Watched to end? | true | End |
| **ACTIONS** |
| `downloaded` | Boolean | Did download? | true | End |
| `download_count` | Integer | How many times | 1 | End |
| **CALCULATED SCORES** |
| `engagement_score` | Integer | 0-100 score | 78 | End |
| `intent_signal` | String | Lead quality | "hot" / "warm" / "cold" | End |

### 4.2 Files Table

| Field | Type | Description | Update |
|-------|------|-------------|--------|
| `id` | UUID | Primary key | Create |
| `user_email` | String | Owner | Create |
| `name` | String | File name (editable) | Create |
| `mime_type` | String | MIME type | Create |
| `size` | Integer | Bytes | Create |
| `path` | String | Supabase storage path | Create |
| `slug` | String | URL slug | Create |
| `type` | String | "file" or "url" | Create |
| `external_url` | String | For tracked URLs | Create |
| `total_pages` | Integer | Page count | Create |
| `video_duration_seconds` | Integer | Video length | Create |
| `is_favorite` | Boolean | Starred? | User action |
| `notes` | Text | User notes | User action |
| `require_name` | Boolean | Gate setting | User action |
| `require_email` | Boolean | Gate setting | User action |
| `allow_download` | Boolean | Download setting | User action |
| `allow_print` | Boolean | Print setting | User action |
| `password_hash` | String | Password hash | User action |
| `expires_at` | Timestamp | Expiration | User action |
| `cached_total_views` | Integer | View count cache | Periodic |
| `cached_unique_viewers` | Integer | Unique count cache | Periodic |
| `cached_avg_engagement` | Float | Avg engagement cache | Periodic |
| `cached_hot_leads` | Integer | Hot lead count cache | Periodic |
| `cached_qr_scans` | Integer | QR scan count cache | Periodic |
| `cached_views_today` | Integer | Today's views cache | Periodic |
| `cached_last_viewed_at` | Timestamp | Last view time | Periodic |
| `created_at` | Timestamp | Created | Create |
| `updated_at` | Timestamp | Last modified | Auto |

### 4.3 Contacts Table

| Field | Type | Description | Update |
|-------|------|-------------|--------|
| `id` | UUID | Primary key | Auto |
| `user_id` | UUID | Owner (FK) | Create |
| `email` | String | Viewer email | Create |
| `name` | String | Latest name | Update |
| `company` | String | From email domain | Create |
| `first_seen_at` | Timestamp | First view | Create |
| `last_seen_at` | Timestamp | Most recent | Update |
| `total_views` | Integer | Total view count | Update |
| `files_viewed` | UUID[] | Files viewed | Update |
| `avg_engagement` | Float | Avg engagement | Update |
| `total_time_seconds` | Integer | Total time | Update |
| `is_hot_lead` | Boolean | Hot status | Update |

### 4.4 Tags Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_email` | String | Owner |
| `name` | String | Tag name |
| `color` | String | Hex color |
| `created_at` | Timestamp | Created |

### 4.5 File Tags (Junction)

| Field | Type | Description |
|-------|------|-------------|
| `file_id` | UUID | FK to files |
| `tag_id` | UUID | FK to tags |

### 4.6 Contact Notes Table (NEW)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `contact_id` | UUID | FK to contacts |
| `user_id` | UUID | Owner |
| `content` | Text | Note text |
| `created_at` | Timestamp | Created |

### 4.7 Contact Tags Table (NEW)

| Field | Type | Description |
|-------|------|-------------|
| `contact_id` | UUID | FK to contacts |
| `tag` | String | Tag like "VIP", "Priority" |

---

## 5. Calculation Formulas

### 5.1 Engagement Score (0-100)

```
Engagement Score = (Time Score × 0.4) + (Completion Score × 0.35) + (Action Score × 0.25)
```

#### Time Score (40% weight)

```javascript
expectedTime = getExpectedTime(fileType, totalPages, videoDuration)
timeScore = Math.min(100, (actualTime / expectedTime) * 100)

// Expected time by type:
// - PDF/Documents: totalPages × 30 seconds
// - Videos: videoDuration
// - Images: 60 seconds
// - URLs: 60 seconds
```

#### Completion Score (35% weight)

```javascript
// PDF/Documents
completionScore = (maxPageReached / totalPages) * 100

// Videos
completionScore = videoCompletionPercent

// Images/URLs
completionScore = actualTime > 10 ? 100 : (actualTime / 10) * 100
```

#### Action Score (25% weight)

```javascript
actionScore = 0
if (downloaded) actionScore += 50
if (isReturnVisit) actionScore += 30
if (pagesViewed / totalPages > 0.8) actionScore += 20
actionScore = Math.min(100, actionScore)
```

### 5.2 Intent Signal

```javascript
if (engagementScore >= 70) return 'hot'    // 🔥
if (engagementScore >= 40) return 'warm'   // 🟡
return 'cold'                               // ⚪
```

### 5.3 Hot Lead Detection

```javascript
isHotLead = (
  engagementScore >= 80 ||
  (engagementScore >= 70 && downloaded) ||
  (engagementScore >= 60 && returnVisitCount >= 2)
)
```

### 5.4 Content Health Score (File-level)

```
Content Health = (Avg Engagement × 0.4) + (Completion Rate × 0.3) + (Return Rate × 0.2) + (Action Rate × 0.1)
```

Where:
- Avg Engagement = AVG(engagement_score) across all viewers
- Completion Rate = (Viewers who reached last page / Total viewers) × 100
- Return Rate = (Return visitors / Total viewers) × 100
- Action Rate = (Downloaders / Total viewers) × 100

### 5.5 Drop-off Rate (Per Page)

```javascript
// For each page N:
dropOffRate[N] = ((viewersAtPage[N] - viewersAtPage[N+1]) / viewersAtPage[N]) * 100
```

### 5.6 Page Heatmap Score

```javascript
// For each page:
maxPageTime = Math.max(...Object.values(pagesTimeData))
heatmapScore[page] = (pagesTimeData[page] / maxPageTime) * 100
```

### 5.7 Best Time to Share

```javascript
// Group views by hour and day
hourCounts = groupBy(views, v => new Date(v.accessed_at).getHours())
dayCounts = groupBy(views, v => new Date(v.accessed_at).getDay())

// Find peak hours (top 2) and peak days (top 2)
peakHours = sortByValue(hourCounts).slice(0, 2)
peakDays = sortByValue(dayCounts).slice(0, 2)

// Format: "Tuesday & Thursday, 10AM-2PM"
```

### 5.8 Unique vs Non-Unique

```javascript
uniqueViewers = countDistinct(views, 'viewer_email OR ip_address')
nonUniqueViews = totalViews - uniqueViewers
uniquePercent = (uniqueViewers / totalViews) * 100
```

### 5.9 Company Aggregation

```javascript
// Parse company from email domain
company = email.split('@')[1].split('.')[0].capitalize()

// Aggregate by company
companyStats = groupBy(contacts, 'company').map(group => ({
  company: group.company,
  viewers: group.length,
  totalVisits: sum(group, 'total_views'),
  avgEngagement: avg(group, 'avg_engagement'),
  filesViewed: unique(flatten(group.map(c => c.files_viewed)))
}))
```

---

## 6. Insights Engine

### 6.1 File-Level Insights

```javascript
function generateFileInsights(file, analytics, viewers) {
  const insights = []

  // Most popular page
  const pagesTimes = analytics.pagesTimeData || {}
  const maxTime = Math.max(...Object.values(pagesTimes))
  const avgTime = sum(Object.values(pagesTimes)) / Object.keys(pagesTimes).length

  Object.entries(pagesTimes).forEach(([page, time]) => {
    if (time > avgTime * 2) {
      const label = analytics.pageLabels?.[page] || `Page ${page}`
      insights.push({
        icon: '💎',
        text: `${label} gets ${Math.round(time/avgTime)}x more attention`,
        implication: 'Strong interest in this content'
      })
    }
  })

  // Drop-off warning
  const dropOffs = analytics.dropOffRates || {}
  Object.entries(dropOffs).forEach(([page, rate]) => {
    if (rate > 30) {
      insights.push({
        icon: '⚠️',
        text: `${rate}% drop-off at page ${page}`,
        implication: 'Content may need revision'
      })
    }
  })

  // Best time insight
  if (analytics.bestTime) {
    insights.push({
      icon: '⏰',
      text: `Peak viewing: ${analytics.bestTime.days} at ${analytics.bestTime.hours}`,
      implication: 'Best time to share for higher engagement'
    })
  }

  // Company interest
  const companies = groupBy(viewers, 'company')
  Object.entries(companies).forEach(([company, viewers]) => {
    if (viewers.length >= 2) {
      insights.push({
        icon: '👥',
        text: `${viewers.length} people from ${company} viewing`,
        implication: 'Being shared internally'
      })
    }
  })

  // QR effectiveness
  const qrPercent = (analytics.qrScans / analytics.totalViews) * 100
  if (qrPercent > 20) {
    insights.push({
      icon: '📱',
      text: `${Math.round(qrPercent)}% from QR codes`,
      implication: 'Physical distribution is working'
    })
  }

  // Low engagement warning
  if (analytics.avgEngagement < 40) {
    insights.push({
      icon: '📉',
      text: 'Below average engagement',
      implication: 'Consider refreshing content'
    })
  }

  return insights
}
```

### 6.2 Contact-Level Insights

```javascript
function generateContactInsights(contact, viewHistory) {
  const insights = []

  // Pricing page focus
  const pricingTime = viewHistory
    .filter(v => v.pageLabel?.toLowerCase().includes('pricing'))
    .reduce((sum, v) => sum + v.timeSpent, 0)
  const totalTime = viewHistory.reduce((sum, v) => sum + v.timeSpent, 0)

  if (pricingTime / totalTime > 0.3) {
    insights.push({
      icon: '💰',
      text: 'Spent 3x longer on pricing page',
      implication: 'Evaluating cost - may be price sensitive'
    })
  }

  // Comparison shopping
  const returnCount = viewHistory.filter(v => v.isReturnVisit).length
  const hasDownloaded = viewHistory.some(v => v.downloaded)

  if (returnCount >= 3 && hasDownloaded) {
    insights.push({
      icon: '🔄',
      text: `Downloaded after ${returnCount} visits`,
      implication: 'Was comparing options before deciding'
    })
  }

  // Optimal contact time
  const hours = viewHistory.map(v => new Date(v.accessedAt).getHours())
  const peakHour = mode(hours)
  const days = viewHistory.map(v => getDayName(new Date(v.accessedAt).getDay()))
  const peakDays = mode(days)

  insights.push({
    icon: '⏰',
    text: `Most active ${peakDays} around ${peakHour}:00`,
    implication: 'Optimal time to reach out'
  })

  // Internal sharing
  if (contact.sameCompanyViewers >= 2) {
    insights.push({
      icon: '👥',
      text: `${contact.sameCompanyViewers} colleagues also viewed`,
      implication: `Being shared internally at ${contact.company}`
    })
  }

  // High intent signals
  if (contact.avgEngagement >= 80 && returnCount >= 2 && hasDownloaded) {
    insights.push({
      icon: '🔥',
      text: 'Very high intent signals',
      implication: 'Priority follow-up recommended'
    })
  }

  return insights
}
```

### 6.3 Dashboard-Level Insights

```javascript
function generateDashboardInsights(stats, files, contacts, recentActivity) {
  const insights = []

  // Hot leads count
  const hotLeads = contacts.filter(c => c.is_hot_lead && c.lastSeenHours < 48)
  if (hotLeads.length > 0) {
    insights.push({
      icon: '🔥',
      text: `${hotLeads.length} hot leads ready for follow-up`,
      implication: 'High intent viewers - prioritize outreach'
    })
  }

  // Trending content
  files.forEach(file => {
    const weekChange = ((file.viewsThisWeek - file.viewsLastWeek) / file.viewsLastWeek) * 100
    if (weekChange > 30) {
      insights.push({
        icon: '📈',
        text: `"${file.name}" trending (+${Math.round(weekChange)}%)`,
        implication: 'Momentum building - consider amplifying'
      })
    }
  })

  // Company interest
  const companyGroups = groupBy(contacts.filter(c => c.lastSeenDays < 7), 'company')
  Object.entries(companyGroups).forEach(([company, viewers]) => {
    if (viewers.length >= 2 && company !== 'Unknown') {
      const avgEng = avg(viewers, 'avg_engagement')
      insights.push({
        icon: '🏢',
        text: `${company} team (${viewers.length} people) actively reviewing`,
        implication: avgEng >= 70 ? 'Strong interest - potential deal' : 'Monitoring your content'
      })
    }
  })

  // Best time
  insights.push({
    icon: '⏰',
    text: `Best engagement: ${stats.bestDays} at ${stats.bestHours}`,
    implication: 'Optimal sharing window'
  })

  // Mobile optimization
  if (stats.mobilePercent > 30) {
    insights.push({
      icon: '📱',
      text: `${stats.mobilePercent}% views from mobile`,
      implication: 'Consider mobile optimization'
    })
  }

  return insights
}
```

---

## 7. Actions Engine

### 7.1 File-Level Actions

```javascript
function generateFileActions(file, insights, analytics) {
  const actions = []

  // Hot leads action
  if (analytics.hotLeadsCount > 0) {
    actions.push({
      priority: 'high',
      icon: '🔥',
      title: `Contact ${analytics.hotLeadsCount} hot leads`,
      reason: 'High intent viewers ready for follow-up',
      buttons: [
        { label: 'View Leads', icon: '👥', action: 'viewHotLeads' },
        { label: 'Export', icon: '📤', action: 'exportHotLeads' }
      ]
    })
  }

  // Drop-off fix
  const highDropOff = insights.find(i => i.icon === '⚠️' && i.text.includes('drop-off'))
  if (highDropOff) {
    const page = highDropOff.text.match(/page (\d+)/)?.[1]
    actions.push({
      priority: 'high',
      icon: '⚠️',
      title: `Review page ${page}`,
      reason: highDropOff.text,
      buttons: [
        { label: 'Edit File', icon: '✏️', action: 'editFile' }
      ]
    })
  }

  // Optimal share time
  if (analytics.bestTime) {
    actions.push({
      priority: 'medium',
      icon: '⏰',
      title: `Share on ${analytics.bestTime.days} at ${analytics.bestTime.hours}`,
      reason: '3x higher engagement at this time',
      buttons: [
        { label: 'Copy Link', icon: '📋', action: 'copyLink' },
        { label: 'Download QR', icon: '📱', action: 'downloadQR' }
      ]
    })
  }

  // Low engagement
  if (analytics.avgEngagement < 40) {
    actions.push({
      priority: 'medium',
      icon: '📉',
      title: 'Refresh content',
      reason: 'Engagement below average - may need updates',
      buttons: [
        { label: 'Edit', icon: '✏️', action: 'editFile' },
        { label: 'Replace', icon: '🔄', action: 'replaceFile' }
      ]
    })
  }

  return actions
}
```

### 7.2 Contact-Level Actions

```javascript
function generateContactActions(contact, insights) {
  const actions = []

  // Hot lead - contact immediately
  if (contact.engagement >= 70 && contact.lastSeenHours < 48) {
    actions.push({
      priority: 'high',
      icon: '🔥',
      title: `Contact ${contact.name} now`,
      reason: `${contact.engagement}% engagement, viewed ${contact.lastSeenHours}h ago`,
      buttons: [
        { label: 'Email', icon: '📧', action: 'email', data: contact.email },
        { label: 'LinkedIn', icon: '💼', action: 'linkedin' }
      ]
    })
  }

  // Pricing focus - send pricing
  const pricingInsight = insights.find(i => i.icon === '💰')
  if (pricingInsight) {
    actions.push({
      priority: 'high',
      icon: '💰',
      title: 'Send pricing details',
      reason: 'High focus on pricing - ready to discuss cost',
      buttons: [
        { label: 'Draft Email', icon: '📧', action: 'draftPricingEmail' }
      ]
    })
  }

  // Optimal contact time
  const timeInsight = insights.find(i => i.icon === '⏰')
  if (timeInsight) {
    actions.push({
      priority: 'medium',
      icon: '⏰',
      title: `Schedule for ${contact.peakDays} ${contact.peakHours}`,
      reason: 'Their most active time - higher response rate',
      buttons: [
        { label: 'Schedule', icon: '📅', action: 'schedule' }
      ]
    })
  }

  // Team demo
  const teamInsight = insights.find(i => i.icon === '👥')
  if (teamInsight) {
    actions.push({
      priority: 'medium',
      icon: '👥',
      title: 'Propose team demo',
      reason: `Multiple people from ${contact.company} viewing`,
      buttons: [
        { label: 'Draft Email', icon: '📧', action: 'draftDemoEmail' }
      ]
    })
  }

  return actions
}
```

### 7.3 Dashboard-Level Actions

```javascript
function generateDashboardActions(insights, hotLeads, files) {
  const actions = []

  // Hot leads to contact
  hotLeads.slice(0, 3).forEach(lead => {
    actions.push({
      priority: 'high',
      icon: '🔥',
      title: `Contact ${lead.name} (${lead.company})`,
      reason: `${lead.engagement}% engagement on ${lead.lastFile}`,
      buttons: [
        { label: 'Email', icon: '📧', action: 'email', data: lead.email },
        { label: 'LinkedIn', icon: '💼', action: 'linkedin' }
      ]
    })
  })

  // Files needing attention
  files.filter(f => f.hasDropOffIssue).slice(0, 2).forEach(file => {
    actions.push({
      priority: 'high',
      icon: '⚠️',
      title: `Fix "${file.name}"`,
      reason: `${file.dropOffRate}% drop-off at page ${file.dropOffPage}`,
      buttons: [
        { label: 'View', icon: '📊', action: 'viewFile', data: file.id },
        { label: 'Edit', icon: '✏️', action: 'editFile', data: file.id }
      ]
    })
  })

  // Trending content to amplify
  files.filter(f => f.isTrending).slice(0, 1).forEach(file => {
    actions.push({
      priority: 'medium',
      icon: '📈',
      title: `Amplify "${file.name}"`,
      reason: `Trending +${file.weekChange}% - momentum building`,
      buttons: [
        { label: 'Share', icon: '📤', action: 'share', data: file.id },
        { label: 'View', icon: '📊', action: 'viewFile', data: file.id }
      ]
    })
  })

  return actions
}
```

---

## 8. Page Specifications

### 8.1 Dashboard (Account Overview)

**URL:** `/dashboard`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 👋 Welcome back, {userName}                  [7d] [14d] [30d] [All Time]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ QUICK STATS ROW                                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                     │
│ │👁️ Views│ │📱 QR   │ │👤 Unique│ │📊 Engage│ │🔥 Hot  │                     │
│ │ 1,234  │ │ 156    │ │ 456    │ │ 68     │ │ 12     │                     │
│ │↑15%    │ │↑8%     │ │↑12%    │ │↑5%     │ │+3      │                     │
│ │45 today│ │8 today │ │        │ │        │ │        │                     │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 💡 THIS WEEK'S INSIGHTS                                                     │
│ • 🔥 8 hot leads ready for follow-up (up from 3 last week)                 │
│ • 🏢 Sequoia Capital team (3 people) actively reviewing                    │
│ • ⏰ Best engagement: Tuesday-Thursday 10AM-2PM                             │
│ • 📱 32% views from mobile - consider mobile optimization                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🎯 ACTION ITEMS                                                 [4 pending] │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔥 Contact Sarah Chen (Sequoia)              [📧 Email] [💼 LinkedIn]   │ │
│ │    91% engagement, pricing focus - ready to buy                         │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ ⚠️ Fix "ESG Report" page 3                   [📊 View] [✏️ Edit]        │ │
│ │    34% drop-off - losing viewers here                                   │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 📈 Amplify "Investor Deck"                   [📤 Share] [📊 View]       │ │
│ │    Trending +45% this week                                              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ [LEFT COLUMN]                              [RIGHT COLUMN]                   │
│ ┌────────────────────────────────┐         ┌────────────────────────────┐  │
│ │ 🔥 HOT LEADS                   │         │ 📈 VIEWS TREND             │  │
│ │ [Table: Name, Company, Eng,    │         │ [Hours][Days][Months]      │  │
│ │  File, Last Seen]              │         │ [Line Chart]               │  │
│ └────────────────────────────────┘         │ Last view: 2 min ago       │  │
│                                            └────────────────────────────┘  │
│ ┌────────────────────────────────┐         ┌────────────────────────────┐  │
│ │ 📋 RECENT ACTIVITY             │         │ 🏆 TOP CONTENT             │  │
│ │ [Table with headers:]          │         │ [Headers: File, Views, Eng]│  │
│ │ VISITOR | FILE | 📍 | 💻 |     │         │ 📕 Investor..  22    45    │  │
│ │ INTENT | SCORE | TIME          │         │ 🎬 4K Video    20     0    │  │
│ └────────────────────────────────┘         │ 📊 DKSoft      3    45     │  │
│                                            └────────────────────────────┘  │
│                                            ┌────────────────────────────┐  │
│                                            │ 🏢 ACTIVE COMPANIES        │  │
│                                            │ [Company, Viewers, Eng]    │  │
│                                            └────────────────────────────┘  │
│                                            ┌────────────────────────────┐  │
│                                            │ 🗺️ TOP COUNTRIES           │  │
│                                            │ [Flag, Country, %]         │  │
│                                            └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data Required:**
- Quick stats: totalViews, qrScans, uniqueViewers, avgEngagement, hotLeadsCount, viewsToday, qrToday, changePercents
- Insights: generated from insights engine
- Actions: generated from actions engine
- Hot leads: contacts where is_hot_lead=true, ordered by last_seen_at DESC
- Recent activity: access_logs joined with files and contacts, latest 10
- Top content: files ordered by cached_total_views DESC
- Active companies: contacts grouped by company
- Top countries: access_logs grouped by country

---

### 8.2 My Links (Files List)

**URL:** `/dashboard/links`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📁 MY LINKS                                              [+ Create Link]    │
│ 9 total links (6 files, 3 URLs)                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍  Search by name...              [All] [📄 Files] [🔗 URLs] [Newest▼] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ TABLE HEADERS (with icons):                                                 │
│ ⭐ │ 📁 TYPE & NAME │ 👁️ VIEWS │ 📊 ENGAGE │ 🔥 HOT │ ⏰ LAST VIEWED │ 🔧  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ★  │ 📕 Investor Deck Q4        │ 22 (3 uniq) │ ▓▓▓ 45 │ 🔥 2 │ 17m ago │ ⋯ │
│    │    /investor-deck-q4       │             │        │      │         │   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☆  │ 🎬 4K Video Creator        │ 20 (0 uniq) │ ░░░  0 │  —   │ 55m ago │ ⋯ │
│    │    /4k-video-creator       │             │        │      │         │   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☆  │ 🔗 Company Website         │ 156 (89)    │  — —   │  —   │ 2m ago  │ ⋯ │
│    │    /website                │             │        │      │         │   │
└─────────────────────────────────────────────────────────────────────────────┘

ACTION MENU (⋯):
- 📋 Copy Link
- 📷 Copy QR Image
- 📱 Show QR
- ⚙️ Edit Settings
- 🗑️ Delete
```

**File Type Icons:**
| MIME Type / Extension | Icon |
|----------------------|:----:|
| application/pdf | 📕 |
| application/vnd.ms-powerpoint, .pptx | 📊 |
| application/msword, .docx | 📘 |
| application/vnd.ms-excel, .xlsx | 📗 |
| image/* | 🖼️ |
| video/* | 🎬 |
| audio/* | 🎵 |
| type="url" | 🔗 |
| application/zip | 📦 |
| default | 📄 |

---

### 8.3 File Detail

**URL:** `/dashboard/files/[id]`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to My Links                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📕 Investor Deck Q4 2025.pdf                     ⭐ [📋 Copy] [📱 QR] [🗑️] │
│ Created Dec 6 • PDF • 12 pages • Last view: 17 min ago                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔗 SHARE URL (Visible box with blue border)                                 │
│ ┌───────────────────────────────────────────────────────────────────┐ [📋] │
│ │ https://linklens.tech/investor-deck-q4                            │       │
│ └───────────────────────────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────────────────────────┤
│ QUICK STATS ROW                                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ │👁️ Views│ │📱 QR   │ │👤 Unique│ │📊 Engage│ │🔥 Hot  │ │✅ Compl│ │⏱️ Time │
│ │ 22     │ │ 5      │ │ 3      │ │ 45     │ │ 2      │ │ 67%    │ │ 2:34  │
│ │+8 today│ │+2 today│ │        │ │        │ │        │ │        │ │       │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
│ ┌────────┐ ┌────────┐ ┌────────┐                                           │
│ │🔄 Return│ │⬇️ Down │ │📊 Uniq%│                                           │
│ │ 15%    │ │ 5      │ │ 73%    │                                           │
│ └────────┘ └────────┘ └────────┘                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 💡 KEY INSIGHTS                                                             │
│ • 💎 Pricing page (pg 8) gets 3x more attention → Strong purchase intent   │
│ • ⚠️ 34% drop-off at page 3 → Content may need revision                    │
│ • ⏰ Peak viewing: Tue-Thu 10AM-2PM → Best time to share                    │
│ • 👥 2 viewers from Sequoia Capital → Being shared internally               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ RECOMMENDED ACTIONS                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔥 Contact 2 hot leads now                              [View Leads →]  │ │
│ │    Sarah Chen (91%), Mike J. (85%) - High intent                        │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ ⚠️ Fix page 3 drop-off                                  [Review Page →] │ │
│ │    34% of viewers leave here - content needs revision                   │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 📤 Share Tuesday 10AM-2PM                               [Schedule →]    │ │
│ │    Optimal time for 3x higher engagement                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📊 Analytics] [👥 Viewers] [⚙️ Settings]                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ══════════════════════ 📊 ANALYTICS TAB ══════════════════════             │
│                                                                             │
│ CHARTS (2x2 grid, then full width):                                        │
│ ┌────────────────────────┐  ┌────────────────────────┐                     │
│ │ 📈 Views Over Time     │  │ 🎯 Engagement Breakdown│                     │
│ │ [Hours][Days][Months]  │  │ 🔥 Hot: 2 (33%)        │                     │
│ │ [Line Chart]           │  │ 🟡 Warm: 1 (17%)       │                     │
│ │                        │  │ ⚪ Cold: 3 (50%)       │                     │
│ └────────────────────────┘  └────────────────────────┘                     │
│                                                                             │
│ ┌────────────────────────┐  ┌────────────────────────┐                     │
│ │ 📅 Top Days            │  │ ⏰ Most Popular Hours  │                     │
│ │ Mon   ░░░░░░░░  5%     │  │ [Bar Chart 0-23h]     │                     │
│ │ Tue   ▓▓▓▓▓▓▓░ 28% ★  │  │ Peak: 10AM-2PM        │                     │
│ │ Wed   ▓▓▓▓▓▓░░ 25%     │  │                       │                     │
│ │ Thu   ▓▓▓▓▓▓▓░ 30% ★  │  │                       │                     │
│ │ Fri   ▓▓░░░░░░ 10%     │  │                       │                     │
│ └────────────────────────┘  └────────────────────────┘                     │
│                                                                             │
│ ┌────────────────────────┐  ┌────────────────────────┐                     │
│ │ 🌐 Traffic Sources     │  │ 📱 Access Method       │                     │
│ │ 🔗 Direct   55%        │  │ 🔗 Direct Click 77%    │                     │
│ │ 📧 Email    25%        │  │ 📱 QR Scan     23%    │                     │
│ │ 💼 LinkedIn 12%        │  │                       │                     │
│ │ 📱 QR       8%         │  │ Unique: 73%           │                     │
│ └────────────────────────┘  │ Non-Unique: 27%       │                     │
│                             └────────────────────────┘                     │
│                                                                             │
│ ┌────────────────────────┐  ┌────────────────────────┐                     │
│ │ 💻 Devices             │  │ 🌐 Browsers            │                     │
│ │ 💻 Desktop  62%        │  │ Chrome    55%          │                     │
│ │ 📱 Mobile   31%        │  │ Safari    28%          │                     │
│ │ 📱 Tablet    7%        │  │ Firefox   10%          │                     │
│ └────────────────────────┘  │ Edge       7%          │                     │
│                             └────────────────────────┘                     │
│                                                                             │
│ ┌────────────────────────┐  ┌────────────────────────┐                     │
│ │ 🗺️ Top Countries       │  │ 🏙️ Top Cities          │                     │
│ │ 🇺🇸 USA       45%      │  │ San Francisco  23%     │                     │
│ │ 🇰🇷 Korea     25%      │  │ Seoul          18%     │                     │
│ │ 🇬🇧 UK        15%      │  │ London         14%     │                     │
│ └────────────────────────┘  └────────────────────────┘                     │
│                                                                             │
│ ┌────────────────────────┐  ┌────────────────────────┐                     │
│ │ 🌍 Top Regions         │  │ 🌐 Top Languages       │                     │
│ │ California, US  35%    │  │ English (US)  60%      │                     │
│ │ Seoul, KR       25%    │  │ Korean        25%      │                     │
│ │ London, UK      15%    │  │ English (UK)  10%      │                     │
│ └────────────────────────┘  └────────────────────────┘                     │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📑 PAGE-BY-PAGE ANALYSIS (Document files only)                          │ │
│ │ PAGE  TIME   LABEL           ATTENTION     STATUS                       │ │
│ │ Pg1   45s    📄 Cover        ▓▓▓▓▓▓░░░░                                │ │
│ │ Pg2   38s    📋 Problem      ▓▓▓▓▓░░░░░                                │ │
│ │ Pg3   22s    -               ▓▓▓░░░░░░░    ⚠️ 34% DROP-OFF             │ │
│ │ Pg8   2m15s  💎 Pricing      ▓▓▓▓▓▓▓▓▓▓    🏆 MOST POPULAR            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌────────────────────────┐  ┌────────────────────────┐                     │
│ │ 📋 Actions Taken       │  │ 🕐 Best Time to Share  │                     │
│ │ ⬇️ Downloaded:  5 (23%)│  │ 📅 Tue - Thu           │                     │
│ │ 🔄 Return:      3 (14%)│  │ ⏰ 10:00 AM - 2:00 PM  │                     │
│ └────────────────────────┘  │ 💡 3x higher engagement│                     │
│                             └────────────────────────┘                     │
│                                                                             │
│ 🎬 VIDEO ANALYTICS (Video files only)                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Avg Watch Time | Avg Completion | Finished | Video Length              │ │
│ │ 2:45          | 78%            | 12       | 3:30                       │ │
│ │                                                                         │ │
│ │ Completion Distribution:                                                │ │
│ │ 100%:    ▓▓▓▓▓▓░░ 35%                                                  │ │
│ │ 75-99%:  ▓▓▓▓░░░░ 25%                                                  │ │
│ │ 50-74%:  ▓▓▓░░░░░ 20%                                                  │ │
│ │ 25-49%:  ▓▓░░░░░░ 12%                                                  │ │
│ │ <25%:    ▓░░░░░░░  8%                                                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ══════════════════════ 👥 VIEWERS TAB ══════════════════════               │
│                                                                             │
│ TABLE HEADERS:                                                              │
│ VIEWER | INTENT | ENGAGE | COMPLETE | TIME | 📍 LOCATION | 💻 DEVICE       │
│                                                                             │
│ 👤 Sarah Chen    🔥 Hot   91%   100%    5:23   🇰🇷 Seoul    💻 Chrome      │
│    @sequoia      [📥][🔄x3]    12/12pg         Return #3                   │
│                                                                             │
│ 👤 Mike J.       🔥 Hot   85%   100%    4:15   🇺🇸 SF       📱 Safari      │
│    @acme         [📥]          12/12pg                                     │
│                                                                             │
│ ══════════════════════ ⚙️ SETTINGS TAB ══════════════════════              │
│                                                                             │
│ ACCESS SETTINGS:                                                            │
│ [✓] Require Name    [✓] Require Email    [✓] Allow Download                │
│ [ ] Password Protection    [ ] Expiration Date                              │
│                                                                             │
│ TAGS: [pitch] [investor] [+ Add Tag]                                       │
│                                                                             │
│ NOTES:                                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Notes about this file...                                    [Auto-save] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.4 Link Detail (URL Tracking)

**URL:** `/dashboard/links/[id]` (where type="url")

**Same as File Detail EXCEPT:**
- No Page-by-Page Analysis
- No Page Heatmap
- No Completion % (or use time-based)
- No Video Analytics

---

### 8.5 Contacts List

**URL:** `/dashboard/contacts`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 👥 CONTACTS                                              [📤 Export CSV]    │
│ 127 total contacts                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILTERS:                                                                    │
│ [All] [🔥 Hot] [🟡 Warm] [⚪ Cold]        [👤 Individual] [🏢 By Company]   │
│                                                                             │
│ 🔍  Search contacts...                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 💡 CONTACTS INSIGHTS                                                        │
│ • 🔥 8 hot leads ready for immediate follow-up                             │
│ • 🏢 Sequoia Capital team (3 people) showing strong interest               │
│ • 73% of contacts are first-time viewers                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔥 CONTACT NOW (8 people)                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ NAME         COMPANY     ENGAGE  VISITS  FILES  LAST    TAGS    ACTIONS │ │
│ │ 👤 Sarah Chen Sequoia    🔥91     7x      3    2h ago  [VIP]    📥🔄    │ │
│ │ 👤 Mike J.    Acme Corp  🔥85     4x      2    5h ago           📥      │ │
│ │ 👤 Amy Wong   Sequoia    🔥82     3x      2    1d ago           🔄      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 ALL CONTACTS                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ NAME          COMPANY      ENGAGE  VISITS  LAST     ACTIONS             │ │
│ │ 👤 Sarah Chen  Sequoia Cap 🔥91     7x     2h ago   📥🔄📁             │ │
│ │ 👤 Cameron M.  Hanford Inc 🟡58     3x     1d ago   📥                  │ │
│ │ ❓ Anonymous   -           ⚪34     1x     3d ago                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Action Icons in Table:**
| Icon | Meaning |
|:----:|---------|
| 📥 | Downloaded at least once |
| 🔄 | Return visitor |
| 📁 | Viewed multiple files |

---

### 8.6 Contact Detail

**URL:** `/dashboard/contacts/[id]`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Contacts                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 👤 Sarah Chen                                           [🏷️ Add Tag]       │
│ 📧 sarah@sequoiacap.com • 🏢 Sequoia Capital                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ QUICK STATS:                                                                │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│ │ 📊 Engage │ │ 👁️ Visits │ │ 📁 Files  │ │ ⏱️ Time   │ │ 📅 First  │      │
│ │ 🔥 91     │ │ 7x        │ │ 3         │ │ 45min     │ │ 7 days    │      │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 💡 BEHAVIORAL INSIGHTS                                                      │
│ • 💰 Spent 3x longer on pricing page → Evaluating cost                     │
│ • 🔄 Downloaded after 3 revisits → Was comparing options                    │
│ • ⏰ Most active Tue-Thu 2-4PM → Optimal contact window                     │
│ • 👥 2 colleagues from Sequoia also viewed → Shared internally              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ RECOMMENDED ACTIONS                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📧 Send pricing details now                             [Draft Email →] │ │
│ │    High focus on pricing - ready to discuss cost                        │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 📅 Schedule call for Tuesday 2-4PM                      [Schedule →]    │ │
│ │    Their most active hours                                              │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 👥 Propose team demo                                    [Draft Email →] │ │
│ │    2 colleagues also viewing                                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🏷️ BEHAVIOR TAGS                                                            │
│ [📥 Downloaded] [🔄 Returned x3] [✅ Completed] [🎯 Pricing Focus] [VIP]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📝 NOTES                                                    [+ Add Note]    │
│ Dec 03 - "VC partner, discussing Q1 investment round"                      │
│ Nov 28 - "Shared deck after first meeting"                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 ACTIVITY HISTORY                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ DATE       FILE            ENGAGE  TIME    COMPLETE   ACTION            │ │
│ │ Today 2PM  📕 Q4 Pitch     🔥94    12:32   100%      📥 Downloaded      │ │
│ │ Yesterday  📕 Q4 Pitch     🔥88     8:15   100%      🔄 Revisit         │ │
│ │ 2 days     📊 Product Demo 🔥85     5:20    90%                         │ │
│ │ 5 days     📕 Q4 Pitch     🔥72     4:10    75%      🔄 First Visit     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📍 LOCATION & DEVICE                                                        │
│ 🇰🇷 Seoul, South Korea • 💻 Desktop • Chrome • Korean                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.7 Company View

**URL:** `/dashboard/contacts?view=company`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏢 CONTACTS BY COMPANY                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🏢 Sequoia Capital                              [View Details →]        │ │
│ │ 3 viewers • 12 total visits • Avg Engagement: 🔥79                     │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 👤 Sarah Chen  🔥91  7x  Pitch, Demo, Pricing                          │ │
│ │ 👤 Amy Wong    🔥82  3x  Pitch, Demo                                    │ │
│ │ 👤 John Smith  🟡65  2x  Pitch                                          │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 💡 Active internal sharing, pricing focus → Evaluating investment?     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🏢 Hanford Inc.                                 [View Details →]        │ │
│ │ 3 viewers • 3 total visits • Avg Engagement: 🟡45                      │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 👤 Cameron M.  🟡58  1x  Pitch                                          │ │
│ │ 👤 Tina Byers  ⚪34  1x  Pitch                                          │ │
│ │ 👤 Summer P.   🟡42  1x  Pitch                                          │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 💡 Quick review only, low interest - may need different approach       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.8 Global Analytics

**URL:** `/dashboard/analytics`

**Similar to File Detail Analytics tab, but aggregated across ALL files:**
- Views Over Time (all files)
- Engagement Breakdown (all viewers)
- Traffic Sources (all)
- Devices (all)
- Countries/Cities (all)
- Top Days / Popular Hours
- Top/Under Performing Files

---

## 9. UI Components

### 9.1 Quick Stat Card

```tsx
interface QuickStatCardProps {
  icon: string        // "👁️" | "📱" | "👤" | etc
  label: string       // "Views" | "QR Scans" | etc
  value: number | string
  subValue?: string   // "+8 today" | "3 unique"
  change?: number     // +15 (percent change)
  changeLabel?: string // "vs last week"
}
```

### 9.2 Insight Item

```tsx
interface InsightItemProps {
  icon: string        // "💎" | "⚠️" | "⏰" | etc
  text: string        // Main insight text
  implication: string // What it means
}
```

### 9.3 Action Item

```tsx
interface ActionItemProps {
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  reason: string
  buttons: Array<{
    label: string
    icon: string
    action: string
    data?: any
  }>
}
```

### 9.4 File Type Icon

```tsx
function getFileIcon(fileType: string, type: string): string {
  if (type === 'url') return '🔗'
  const ft = fileType?.toLowerCase() || ''
  if (ft.includes('pdf')) return '📕'
  if (ft.includes('ppt') || ft.includes('presentation')) return '📊'
  if (ft.includes('doc') || ft.includes('word')) return '📘'
  if (ft.includes('xls') || ft.includes('sheet')) return '📗'
  if (ft.includes('image') || ft.includes('png') || ft.includes('jpg')) return '🖼️'
  if (ft.includes('video') || ft.includes('mp4')) return '🎬'
  if (ft.includes('audio') || ft.includes('mp3')) return '🎵'
  if (ft.includes('zip')) return '📦'
  return '📄'
}
```

### 9.5 Intent Badge

```tsx
function getIntentBadge(score: number, signal?: string) {
  if (signal === 'hot' || score >= 70) {
    return { icon: '🔥', label: 'Hot', bg: 'bg-red-100', text: 'text-red-700' }
  }
  if (signal === 'warm' || score >= 40) {
    return { icon: '🟡', label: 'Warm', bg: 'bg-yellow-100', text: 'text-yellow-700' }
  }
  return { icon: '⚪', label: 'Cold', bg: 'bg-slate-100', text: 'text-slate-600' }
}
```

### 9.6 Country Flag

```tsx
const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'South Korea': '🇰🇷',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Japan': '🇯🇵',
  'Thailand': '🇹🇭',
  'Singapore': '🇸🇬',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'default': '🌍'
}
```

---

## 10. Tier Restrictions

### Free Tier

| Feature | Access |
|---------|--------|
| Links | 10 |
| Views/month | 5,000 |
| Storage | 100 MB |
| Basic stats (views, unique) | ✅ |
| Engagement scores | ❌ Blurred |
| Insights & Actions | ❌ Blurred |
| Hot lead detection | ❌ Blurred |
| Page analytics | ❌ Blurred |
| Country/City | ❌ Blurred |
| Contacts CRM | ❌ Blurred |
| Custom logo | ❌ |
| CSV Export | ❌ |
| "Powered by LinkLens" | Shown |

### Starter Tier ($9/month)

| Feature | Access |
|---------|--------|
| Links | 500 |
| Views/month | 50,000 |
| Storage | 1 GB |
| Basic stats | ✅ |
| Engagement scores | ✅ |
| Insights & Actions | ✅ |
| Hot lead detection | ❌ Blurred |
| Page analytics | ✅ |
| Country (no city) | ✅ |
| Contacts CRM | ✅ |
| Custom logo | ✅ |
| CSV Export (basic) | ✅ |
| "Powered by LinkLens" | Hidden |

### Pro Tier ($19/month)

| Feature | Access |
|---------|--------|
| Links | 5,000 |
| Views/month | 100,000 |
| Storage | 10 GB |
| ALL features | ✅ |
| Hot lead detection | ✅ |
| City-level location | ✅ |
| Company view | ✅ |
| AI Insights | ✅ |
| Full CSV Export | ✅ |
| PDF Reports | ✅ |
| World Map | ✅ |
| Priority support | ✅ |

---

## 11. Database Schema

### Tables

```sql
-- See Section 4 for full field definitions

-- Core tables
CREATE TABLE files (...);
CREATE TABLE access_logs (...);
CREATE TABLE contacts (...);
CREATE TABLE tags (...);
CREATE TABLE file_tags (...);

-- New tables needed
CREATE TABLE contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_tags (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag)
);

-- Indexes
CREATE INDEX idx_access_logs_file_id ON access_logs(file_id);
CREATE INDEX idx_access_logs_accessed_at ON access_logs(accessed_at);
CREATE INDEX idx_access_logs_viewer_email ON access_logs(viewer_email);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_is_hot_lead ON contacts(is_hot_lead);
CREATE INDEX idx_contact_notes_contact ON contact_notes(contact_id);
```

---

## Appendix: Implementation Checklist

### Phase 1: Fix Broken Pages
- [ ] File Detail - Analytics tab (currently empty)
- [ ] File Detail - Viewers tab (currently empty)
- [ ] Dashboard - Recent Activity headers
- [ ] Dashboard - Top Content file names
- [ ] My Links - Search box overlap
- [ ] My Links - Column headers with icons

### Phase 2: Add Insights Engine
- [ ] File-level insights generator
- [ ] Contact-level insights generator
- [ ] Dashboard-level insights generator
- [ ] Display insights on all pages

### Phase 3: Add Actions Engine
- [ ] File-level actions generator
- [ ] Contact-level actions generator
- [ ] Dashboard-level actions generator
- [ ] Action buttons with handlers

### Phase 4: New Features
- [ ] Contact Notes
- [ ] Contact Tags
- [ ] Company View
- [ ] QR Scans separate metric
- [ ] Top Days / Popular Hours charts
- [ ] Copy QR Image button

### Phase 5: Polish
- [ ] File type icons everywhere
- [ ] No horizontal scroll
- [ ] Share URL visibility
- [ ] Delete modal file name
- [ ] Tier restrictions (blurred features)

---

*End of Master Specification*

**This document is the single source of truth for LinkLens analytics and dashboard implementation.**
