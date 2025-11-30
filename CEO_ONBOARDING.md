# CEO Onboarding: SentioDoc

**Date:** November 29, 2025  
**Company Stage:** Early Development / MVP  
**Product:** Secure Document Sharing Platform (DocSend Alternative)

---

## 🎯 Product Overview

**SentioDoc** is a secure document sharing and analytics platform that allows users to:
- Upload files or share external URLs via branded links
- Track who views their content, when, and from where
- Require viewer authentication (name + email) before access
- Gain insights through analytics (views, engagement, geographic data)
- Use custom domains for professional branding (Pro/Enterprise tiers)

**Target Market:** Sales teams, fundraisers, marketers, and professionals who need to share sensitive documents while maintaining control and visibility.

---

## 💼 Business Model

### Tier Structure
1. **Free Tier**
   - Default domain only (`doc.sentio.ltd`)
   - Basic analytics
   - Unlimited file uploads

2. **Pro Tier** (Target: $29-49/month)
   - Up to 50 custom domains
   - Advanced analytics
   - Priority support
   - Branded links (e.g., `go.yourcompany.com/pitch`)

3. **Enterprise Tier** (Target: Custom pricing)
   - Up to 500 custom domains
   - White-label options
   - API access
   - Dedicated support

---

## 🚀 Recent Product Development

### Just Shipped (Nov 29, 2025)
1. **Office Document PDF Conversion**
   - Problem: Office files (DOCX, PPTX, XLSX) couldn't be viewed in-browser
   - Solution: Automatic server-side conversion to PDF using LibreOffice
   - Impact: Seamless viewing experience, no external dependencies

2. **Flexible Custom Domains**
   - Problem: System only supported subdomains (e.g., `go.example.com`)
   - Solution: Now supports root domains (e.g., `example.com/pitch`)
   - Impact: More branding flexibility for enterprise clients

3. **Real-time Link Validation**
   - Problem: Users could create duplicate links, causing errors
   - Solution: Live slug availability checking with suggestions
   - Impact: Better UX, fewer support tickets

---

## 📊 Current Technical Infrastructure

### Tech Stack
- **Frontend:** Next.js 16 (React 19, App Router)
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Auth:** NextAuth.js with Google Sign-In
- **Hosting:** Hostinger VPS (KVM4) with PM2
- **Analytics:** Custom-built (page-level tracking, geo-location)

### Key Metrics Being Tracked
- Total views per document
- Unique viewers
- Time spent per page
- Geographic distribution
- Viewer contact information (name, email)

---

## 🎯 Strategic Positioning

### Competitive Advantages
1. **Price:** Significantly cheaper than DocSend ($49-$250/mo)
2. **Custom Domains:** More flexible domain configuration
3. **Self-Hosted Option:** Can be deployed on customer infrastructure
4. **No Per-User Pricing:** Flat rate regardless of team size

### Current Gaps vs. DocSend
- No team collaboration features yet
- No document expiration/watermarking
- No CRM integrations (Salesforce, HubSpot)
- No mobile app

---

## 📈 Immediate Business Priorities

### 1. Go-to-Market Strategy
- **Question:** Should we target B2B SaaS companies first, or go broader?
- **Consideration:** Current feature set is strong for sales/fundraising use cases

### 2. Pricing Validation
- **Question:** Is $29-49/month the right price point for Pro?
- **Data Needed:** Competitor analysis, customer interviews

### 3. Feature Roadmap Prioritization
- **Options:**
  - Team collaboration (multi-user workspaces)
  - CRM integrations
  - Document security (expiration, watermarks, download blocking)
  - Mobile app
  - API for developers

### 4. Customer Acquisition
- **Channels to Consider:**
  - Product Hunt launch
  - Content marketing (SEO for "DocSend alternative")
  - Direct outreach to VCs/accelerators
  - Partnerships with sales enablement tools

### 5. Revenue Model Refinement
- **Question:** Should we offer annual plans with discounts?
- **Question:** Should Enterprise be usage-based or flat-rate?

---

## 🔧 Operational Status

### Current Deployment
- **Production URL:** https://doc.sentio.ltd
- **Status:** Live, stable
- **Recent Issue:** Build error fixed (Suspense boundary)
- **Monitoring:** Manual (need to implement error tracking)

### Technical Debt
1. No automated testing
2. No CI/CD pipeline
3. No error monitoring (Sentry, etc.)
4. Manual database migrations
5. No backup/disaster recovery plan

---

## 💡 Questions for CEO Copilot

1. **Market Positioning:** Should we position as "DocSend for startups" or "affordable DocSend alternative for everyone"?

2. **Pricing Strategy:** What pricing experiments should we run first?

3. **Feature Prioritization:** Which missing feature would have the highest impact on conversion?

4. **Customer Development:** How should we structure early customer interviews?

5. **Fundraising:** Is this product ready for pre-seed fundraising, or should we get traction first?

6. **Partnerships:** What types of partnerships would accelerate growth?

7. **Compliance:** What security certifications (SOC 2, GDPR) should we prioritize?

---

## 📞 Next Steps

**For CEO Copilot:**
- Review this document
- Provide strategic recommendations on GTM, pricing, and roadmap
- Help prioritize features based on market opportunity
- Advise on customer acquisition strategy
- Guide on fundraising readiness

**Current Team:**
- Solo founder + AI development team
- Need to decide: hire first employee or stay lean?

---

**Last Updated:** November 29, 2025  
**Document Owner:** DongHyun Kim
