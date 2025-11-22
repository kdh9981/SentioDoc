# DocSend Clone

A secure document sharing application with access control and detailed analytics.

## Features
- **Secure Upload**: Upload PDF, images, and text files.
- **Viewer Gate**: Require viewers to enter their Name and Email before accessing the document.
- **Detailed Analytics**: Track who viewed your document, when, and from which country.
- **Modern UI**: Dark mode interface with a premium feel.

## Getting Started

### Prerequisites
- Node.js installed.

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### 1. Upload a Document
- Go to the **Dashboard** at [http://localhost:3000](http://localhost:3000).
- Drag and drop a file into the upload zone or click to select one.
- Once uploaded, the file will appear in your "Your Files" list.

### 2. Share a Link
- In the "Your Files" list, click the **Copy Link** button next to the file you want to share.
- Send this link to your intended viewer.

### 3. View a Document (Viewer Experience)
- When a viewer opens the link, they will see a **Viewer Gate**.
- They must enter their **Name** and **Email** to proceed.
- After submitting, they will be granted access to view or download the document.

### 4. View Analytics
- Back in your **Dashboard**, find the file you shared.
- Click the **Analytics** button.
- You will see a list of all viewers, including their email, location (Country), and the time they accessed the file.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite (via `better-sqlite3`)
- **Styling**: Vanilla CSS (CSS Variables)
- **Geolocation**: `geoip-lite`
