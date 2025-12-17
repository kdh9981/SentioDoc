# LinkLens Score Formulas Reference

**Last Updated:** December 16, 2025
**Source of Truth:** `/lib/analytics/calculations.ts`

---

## Overview

LinkLens uses two distinct scoring systems:

| Score Type | Level | Purpose | Where Used |
|------------|-------|---------|------------|
| **Performance** | Link-level | How well is this link performing? | My Links, Favorites, File Detail, Dashboard |
| **Engagement** | Viewer-level | How engaged is this person? | ViewersTab, ContactsPage, Hot Leads |

---

## 1. Performance Score (Link-Level)

> "How well is this link performing?"

Performance scores measure the overall success of a link based on **volume + quality**. The formula is volume-gated, meaning low traffic = low score regardless of engagement quality.

### 1.1 File Links (`calculateFileLinkScoreFromLogs`)

**Used in:** My Links table, Favorites table, File Detail stats

**Formula:**

```
Volume Score = min(100, 20 × log₁₀(views + 1))
Volume Multiplier = min(1, views / 500)

Quality Score = (timeScore × 0.35) + (completionScore × 0.35) + (downloadScore × 0.30)

Final Score = (volumeScore × 0.25) + (qualityScore × volumeMultiplier × 0.75)
```

**Component Breakdown:**

| Component | Weight | Calculation | Max Score |
|-----------|--------|-------------|-----------|
| Volume Score | 25% | `20 × log₁₀(views + 1)` | 100 |
| Time Score | 35% of quality | `avgTime / 120 × 100` (2 min = 100) | 100 |
| Completion Score | 35% of quality | Average completion % | 100 |
| Download Score | 30% of quality | `downloadRate × 2` (50% rate = 100) | 100 |

**Volume Multiplier Effect:**
- 10 views = 0.02x quality bonus
- 100 views = 0.20x quality bonus
- 500+ views = 1.0x quality bonus (full)

**Example Scores:**
| Views | Avg Time | Avg Completion | Download Rate | Score |
|-------|----------|----------------|---------------|-------|
| 1 | 60s | 50% | 0% | ~6 |
| 10 | 60s | 50% | 10% | ~8 |
| 100 | 120s | 80% | 20% | ~22 |
| 500 | 120s | 80% | 20% | ~69 |

---

### 1.2 Track Sites (`calculateTrackSiteLinkScoreFromLogs`)

**Used in:** My Links table, Favorites table, Track Site Detail stats

**Formula:**

```
Volume Score = min(100, 20 × log₁₀(clicks + 1))
Volume Multiplier = min(1, clicks / 500)

Reach Bonus = (uniqueClickers / totalClicks × 100) × 0.20 × volumeMultiplier
Return Bonus = (returnClickers / uniqueClickers × 100) × 0.20 × volumeMultiplier
Recency Bonus = recencyScore × 0.10 × volumeMultiplier
Velocity Bonus = velocityScore × 0.10 × volumeMultiplier

Final Score = volumeScore + reachBonus + returnBonus + recencyBonus + velocityBonus
```

**Bonus Components (all gated by Volume Multiplier):**

| Bonus | Max Weight | Description |
|-------|------------|-------------|
| Reach | 20% | Higher unique clicker ratio = better |
| Return | 20% | More return visitors = better |
| Recency | 10% | Recent activity = better |
| Velocity | 10% | Week-over-week growth = better |

**Recency Score Table:**
| Days Since Last Click | Score |
|-----------------------|-------|
| 0-1 | 100 |
| 2-3 | 90 |
| 4-7 | 70 |
| 8-14 | 50 |
| 15-30 | 30 |
| 31-60 | 15 |
| 60+ | 5 |

**Velocity Score Table:**
| Week-over-Week Ratio | Score |
|----------------------|-------|
| ≥ 2.0x growth | 100 |
| ≥ 1.5x growth | 80 |
| ≥ 1.0x (stable) | 50 |
| ≥ 0.5x decline | 20 |
| < 0.5x decline | 5 |

---

### 1.3 Avg Performance (Dashboard-Level)

**Used in:** Dashboard MetricsRow

**Formula:**

```
For each file in portfolio:
  fileScore = calculateFileLinkScoreFromLogs(logs) OR calculateTrackSiteLinkScoreFromLogs(logs)
  weight = number of views for that file

Avg Performance = Σ(fileScore × weight) / Σ(weight)
```

This is a **view-weighted average** of all link Performance scores. Files with more views have more influence on the portfolio average.

---

## 2. Engagement Score (Viewer-Level)

> "How engaged is this person?"

Engagement scores measure individual viewer behavior across all their sessions with a specific file/link.

### 2.1 File Viewers (`calculateAggregatedViewerScore`)

**Used in:** ViewersTab, ContactsPage, Hot Leads calculation

**Formula:**

```
Engagement Score = (timeScore × 0.25) + (completionScore × 0.25) + (downloadScore × 0.20) + (returnScore × 0.15) + (depthScore × 0.15)
```

**Component Breakdown:**

| Component | Weight | Calculation |
|-----------|--------|-------------|
| Time | 25% | Tiered based on total duration |
| Completion | 25% | Max completion % reached |
| Download | 20% | 100 if downloaded, else 0 |
| Return | 15% | 100 if 2+ visits, else 0 |
| Depth | 15% | Pages reached / total pages |

**Time Score Tiers:**

| Duration | Score Range |
|----------|-------------|
| 0s | 0 |
| 1-30s | 0-25 (linear) |
| 30-60s | 25-40 (linear) |
| 60-120s | 40-60 (linear) |
| 120-300s | 60-80 (linear) |
| 300-600s | 80-100 (linear) |
| 600s+ | 100 |

**Depth Score Calculation:**
- For multi-page documents: `maxPageReached / totalPages × 100`
- For videos/images/single-page: Uses completion % as proxy

---

### 2.2 Track Site Viewers

**Used in:** ViewersTab for Track Sites, ContactsPage

**Formula:**

```
Engagement Score = (returnScore × 0.60) + (frequencyScore × 0.40)
```

| Component | Weight | Calculation |
|-----------|--------|-------------|
| Return | 60% | 100 if 2+ visits, else 0 |
| Frequency | 40% | `min(100, visits × 33)` |

**Frequency Score Examples:**
| Visits | Frequency Score |
|--------|-----------------|
| 1 | 33 |
| 2 | 66 |
| 3+ | 100 |

---

## 3. Lead Classification

**Based on Engagement Score (Viewer-Level):**

| Classification | Score Range | Meaning |
|----------------|-------------|---------|
| Hot Lead | ≥ 70 | Highly engaged, ready to convert |
| Warm Lead | 40-69 | Moderately engaged, nurture needed |
| Cold Lead | < 40 | Low engagement, may need re-engagement |

---

## 4. Where Each Formula Is Used

### API Endpoints

| Endpoint | Function Used | Purpose |
|----------|---------------|---------|
| `/api/files` | `calculateFileLinkScoreFromLogs`, `calculateTrackSiteLinkScoreFromLogs`, `calculateAggregatedViewerScore` | My Links, Favorites |
| `/api/analytics/metrics` | `calculateFileLinkScoreFromLogs`, `calculateTrackSiteLinkScoreFromLogs` | Dashboard metrics |
| `/api/files/[id]/analytics` | `calculateAnalyticsSummary` (uses both) | File Detail |

### UI Components

| Component | Score Type | Label |
|-----------|------------|-------|
| FilesPage.tsx | Link Performance | "Performance" |
| FavoritesPage.tsx | Link Performance | "Performance" |
| FileDetailStats.tsx | Link Performance | "Performance" |
| MetricsRow.tsx | Avg Performance | "Avg Performance" |
| ViewersTab.tsx | Viewer Engagement | "Engagement Score" |
| ContactsPage.tsx | Viewer Engagement | "Engagement Score" |

---

## 5. Design Principles

1. **Volume-Gating**: Performance scores require real traffic. A link with perfect engagement but only 5 views will score low.

2. **Quality Matters at Scale**: Once you have volume (500+ views), quality metrics fully unlock. This rewards both traffic AND engagement.

3. **Viewer vs Link Distinction**:
   - **Engagement Score** = How interested is this specific person?
   - **Performance Score** = How well is this link working overall?

4. **Single Source of Truth**: All calculations live in `/lib/analytics/calculations.ts`. APIs import from there.

---

## 6. Changelog

| Date | Change |
|------|--------|
| Dec 16, 2025 | Unified Performance score formulas across all API routes |
| Dec 16, 2025 | Renamed "Engage" to "Performance" (link-level) and "Engagement Score" (viewer-level) |
| Dec 16, 2025 | Fixed `calculateFileLinkScoreFromLogs` to calculate from raw data instead of non-existent `engagement_score` field |
| Dec 11, 2025 | Implemented volume-gated formula for Track Sites |
| Dec 11, 2025 | Implemented volume-gated formula for Files |
