# Project Handoff: SentioDoc (DocSend Clone)

**Date:** November 29, 2025
**Status:** Stable / Deployment Troubleshooting

## 📋 Project Overview
This is a Next.js application (App Router) for secure document sharing, similar to DocSend.
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Auth:** NextAuth.js (Google) + Email Allowlist
- **Hosting:** VPS (Hostinger) with PM2

## 🚀 Recent Features Implemented
1.  **Office to PDF Conversion**
    - **Functionality:** Uploaded Office docs (DOCX, PPTX, XLSX) are automatically converted to PDF server-side using `libreoffice-convert`.
    - **Viewer:** The frontend `FileViewer` automatically displays the converted PDF for a better reading experience.
    - **Fallback:** If conversion fails, users can still download the original file.

2.  **Flexible Custom Domains**
    - **Functionality:** Pro users can use root domains (e.g., `example.com`) or subdomains (`go.example.com`).
    - **UI:** Updated Link Configuration modal to support both formats.
    - **Validation:** Added real-time slug validation that correctly checks against all files (including deleted ones).

## ⚠️ Critical Deployment Requirements
**These are NOT in the git repo and must be configured on any new server:**

1.  **System Dependencies (REQUIRED)**
    - `libreoffice`: Required for PDF conversion.
    - Command: `sudo apt-get install -y libreoffice`

2.  **Database Migrations (REQUIRED)**
    - Run these SQL scripts in the Supabase Dashboard > SQL Editor:
    
    **For PDF Conversion:**
    ```sql
    ALTER TABLE files ADD COLUMN IF NOT EXISTS pdf_path TEXT;
    CREATE INDEX IF NOT EXISTS idx_files_pdf_path ON files(pdf_path);
    ```

    **For Custom Domains:**
    (See `supabase-custom-domains.sql` in the repo for the full schema)

3.  **Environment Variables**
    - Ensure `.env.local` (or production env) has:
        - `NEXT_PUBLIC_SUPABASE_URL`
        - `SUPABASE_SERVICE_ROLE_KEY`
        - `NEXTAUTH_SECRET`
        - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

## 📝 Current Status & Next Steps
- **Git:** The `main` branch is up to date and clean.
- **Build:** Fixed a recent build error related to `Suspense` boundaries in `CustomDomainHandlerPage`.
- **Deployment:** The user is currently deploying to a Hostinger VPS.
    - **Action Item:** Verify the site loads correctly after the latest `git pull` and `pm2 restart`.

## 📂 Key Files
- `app/api/upload/route.ts`: Handles file upload + PDF conversion.
- `lib/pdf-converter.ts`: Utility for LibreOffice conversion.
- `components/FileViewer.tsx`: Logic for switching between PDF/Office viewer.
- `app/view/custom-domain-handler/page.tsx`: Handles custom domain routing.
