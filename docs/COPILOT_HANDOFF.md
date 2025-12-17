# LinkLens Co-Pilot CEO Handoff Document
> Last Updated: December 15, 2025
> Previous Session: Claude Opus 4.5

---

## 🎯 Project Overview

**LinkLens** is a link tracking and analytics platform combining:
- **Document sharing** (like DocSend) - Upload files, get tracking links
- **URL shortening & tracking** (like Bitly) - Track external links
- **Comprehensive analytics** - Engagement scores, geographic data, viewer insights

**Target Users:** Founders, marketers, sales professionals

**Business Model:** Bootstrap-to-profitability (no fundraising focus)
- Free: 10 links, 5K views
- Starter ($9/mo): 500 links, 50K views
- Pro ($19/mo): 5K links, 100K views

**Domain:** linklens.tech
**CEO:** DongHyun Kim (based in Bangkok, Thailand)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Maps | react-simple-maps |

**Key Directories:**
```
/Users/donghyunkim/Desktop/LinkLens/
├── app/                    # Next.js pages and API routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard pages
│   └── [slug]/            # Viewer routes
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── ui/               # Reusable UI components
│   └── landing/          # Landing page components
├── lib/                   # Utilities and configurations
│   └── analytics/        # Analytics calculation functions
└── docs/                 # Documentation
```

---

## ✅ Completed Tasks (This Session)

### 1. Analytics Page Removal
- **Removed:** `/app/dashboard/analytics` - redundant with Dashboard
- **Removed:** Analytics link from Sidebar
- Dashboard now serves as the single aggregate analytics view

### 2. Database Cleanup - Removed Unused Columns
- **Dropped from `access_logs`:**
  - `engagement_score` (int4)
  - `intent_signal` (varchar)
- **Reason:** These stored values were NEVER used - all engagement scores are recalculated at runtime from aggregated viewer data
- **Files updated:** Session tracking API, Contacts API, ViewersTab

### 3. Contacts API Fix
- Fixed SELECT query that referenced dropped `engagement_score` and `intent_signal` columns
- Contacts page now loads correctly

---

## 🔴 PENDING TASKS (Must Complete)

### CRITICAL: Engagement Score Consistency Fix

**Problem:** Same viewer shows different engagement scores:
- Contact Detail page: 35
- File Viewers Tab: 20

**Root Cause:** The depth calculation condition `totalPages > 0` vs `totalPages > 1`
- Videos store `total_pages = 1` in access_logs
- Files table has `total_pages = 0` for videos
- This causes different depth scores

**Fix Required:** Change `totalPages > 0` to `totalPages > 1` in 4 files:

1. `/app/api/contacts/route.ts`
2. `/app/api/contacts/[id]/route.ts`
3. `/components/dashboard/file-detail/ViewersTab.tsx`
4. `/lib/analytics/calculations.ts`

**The Fix (str_replace in each file):**

OLD:
```typescript
if (totalPages && totalPages > 0 && maxPageReached > 0) {
```

NEW:
```typescript
if (totalPages && totalPages > 1 && maxPageReached > 0) {
```

This ensures only multi-page documents use page-based depth; videos/images use completion as depth proxy.

---

## 📊 Engagement Score Formula

### File Individual Score (100 points max)
| Component | Weight | Calculation |
|-----------|--------|-------------|
| Time | 25% | 0s=0, 30s=25, 1m=40, 2m=60, 5m=80, 10m+=100 |
| Completion | 25% | Direct percentage (0-100) |
| Download | 20% | Binary: 0 or 100 |
| Return | 15% | Binary: 0 or 100 |
| Depth | 15% | pages_reached/total_pages OR completion fallback |

### Track Site Individual Score (100 points max)
| Component | Weight | Calculation |
|-----------|--------|-------------|
| Return | 60% | Binary: 0 or 100 |
| Frequency | 40% | min(100, clicks × 33) |

### Intent Signal (derived from score)
- **Hot:** ≥70
- **Warm:** 40-69
- **Cold:** <40

---

## 🏗 Architecture Decisions

### Why Recalculate Engagement Scores?
Engagement scores are calculated at RUNTIME from aggregated data, not stored:
- Shows cumulative engagement across ALL visits from same person
- Avoids formula drift between stored vs calculated values
- Single source of truth

### Data Flow
1. **Viewer visits link** → Creates `access_logs` entry
2. **Session ends** → Updates duration, completion, download flags
3. **Dashboard/Contacts loads** → Aggregates logs by viewer_email
4. **Engagement calculated** → Using aggregated totals

### Anonymous Viewers
- NOT consolidated by IP address (unreliable)
- Each anonymous session is separate
- Only email-identified viewers are grouped

---

## 🎨 Design Standards

### Colors
- Primary: `blue-500`
- Text: `slate-900` (headings), `slate-700` (body), `slate-600` (secondary)
- Backgrounds: White, `slate-50`

### Components
- Rounded corners: `rounded-xl`, `rounded-2xl`
- Containers: `max-w-7xl mx-auto`
- Cards: White bg, `border border-slate-200`, subtle shadow

### UI Rules
- No weak gray text for important content
- Consistent hover states
- Responsive design required
- Material Symbols for icons

---

## 📁 Key Files Reference

### APIs
| Endpoint | File | Purpose |
|----------|------|---------|
| `/api/contacts` | `app/api/contacts/route.ts` | List all contacts (aggregated viewers) |
| `/api/contacts/[id]` | `app/api/contacts/[id]/route.ts` | Individual contact detail |
| `/api/files/[id]` | `app/api/files/[id]/route.ts` | File detail with logs |
| `/api/track/session` | `app/api/track/session/route.ts` | Update viewer session |
| `/api/dashboard` | `app/api/dashboard/route.ts` | Dashboard aggregate data |

### Components
| Component | File | Purpose |
|-----------|------|---------|
| ViewersTab | `components/dashboard/file-detail/ViewersTab.tsx` | File viewers list |
| Dashboard | `components/dashboard/Dashboard.tsx` | Main dashboard |
| Sidebar | `components/dashboard/Sidebar.tsx` | Navigation |
| WorldMap | `components/dashboard/WorldMap.tsx` | Geographic visualization |

### Analytics
| File | Purpose |
|------|---------|
| `lib/analytics/calculations.ts` | Core calculation functions |
| `lib/analytics/unified-insights.ts` | Dashboard insights generation |
| `lib/analytics/unified-actions.ts` | Recommended actions |

---

## 🐛 Known Issues

1. **Engagement Score Mismatch** - PENDING FIX (see above)
   - Contact page vs Viewers tab show different scores
   - Root cause: totalPages > 0 vs > 1 condition

2. **Video total_pages** 
   - Videos set `total_pages = 1` in access_logs
   - Should be handled by the > 1 fix

---

## 💡 Key Learnings

1. **Always use `totalPages > 1`** for page-based calculations
   - Videos/images have 1 or 0 pages depending on source

2. **Engagement is always recalculated**
   - Never read stored engagement_score from access_logs
   - Always aggregate and recalculate

3. **Data sources differ:**
   - `access_logs.total_pages` = per-session snapshot
   - `files.total_pages` = file metadata
   - Use file metadata when available, fallback to access_logs

4. **Track Sites vs Files**
   - Different engagement formulas
   - Check `file.type === 'url'` or `link_type === 'url'`

---

## 🔧 Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORKFLOW CYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│  1. DongHyun: Shares problem/screenshot/request                 │
│         ↓                                                       │
│  2. Opus 4.5: Analyzes, designs solution, writes COMPLETE code  │
│         ↓                                                       │
│  3. Opus 4.5: Generates "PROMPT FOR CLAUDE CODE" block          │
│         ↓                                                       │
│  4. DongHyun: Copies prompt → Pastes to Claude Code             │
│         ↓                                                       │
│  5. Claude Code: Executes the code changes                      │
│         ↓                                                       │
│  6. DongHyun: Tests → Shares screenshot/feedback                │
│         ↓                                                       │
│  7. Repeat until feature is complete                            │
└─────────────────────────────────────────────────────────────────┘
```

**RULE:** No code before diagnosis. When debugging:
1. Inspect thoroughly
2. Discuss findings
3. Confirm approach
4. Then write code

---

## 📋 Prompt Format Template

```markdown
## PROMPT FOR CLAUDE CODE:

[Brief description of what this fixes/adds]

---

### [ACTION]: [File Path]

\`\`\`tsx
// Complete code here
\`\`\`

---

After this fix:
- ✅ [What will work]
- ✅ [What will work]
```

**Actions:** CREATE, UPDATE, REPLACE, DELETE

---

## 🚀 Next Steps for New Session

1. **FIRST:** Apply the engagement score fix (totalPages > 1)
2. **TEST:** Verify same viewer shows same score everywhere
3. **CONTINUE:** Any new features or issues DongHyun raises

---

*Document prepared by Claude Opus 4.5 for continuity with next co-pilot CEO session.*
