# Deployment Guide: Namecheap + Hostinger

Since your domain (`sentio.ltd`) is on **Namecheap** and you are hosting on **Hostinger**, follow these steps to connect them.

## Step 1: Get Hostinger IP Address
1. Log in to **Hostinger**.
2. Go to your **VPS** or **Hosting Dashboard**.
3. Find the **IP Address** (e.g., `123.45.67.89`). Copy it.

## Step 2: Configure DNS in Namecheap
1. Log in to **Namecheap**.
2. Go to **Domain List** -> Manage `sentio.ltd`.
3. Click **Advanced DNS**.
4. Click **Add New Record**.
   - **Type**: `A Record`
   - **Host**: `doc`
   - **Value**: `Your Hostinger IP Address`
   - **TTL**: `Automatic`
5. Click the **Checkmark** to save.

> **Note**: It may take 5-30 minutes for the subdomain `doc.sentio.ltd` to start working.

## Step 3: Hostinger Setup (Node.js)

### Option A: Hostinger VPS (Recommended)
1. **SSH into your server**: `ssh root@doc.sentio.ltd` (or use the IP).
2. **Install Node.js & Nginx**:
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install Nginx
   sudo apt-get install -y nginx
   ```
3. **Clone & Setup**:
   ```bash
   git clone https://github.com/kdh9981/SentioDoc.git
   cd SentioDoc
   npm install
   npm run build
   ```
4. **Start App**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "docsend" -- start
   ```
5. **Configure Nginx (Reverse Proxy)**:
   Edit `/etc/nginx/sites-available/default`:
   ```nginx
   server {
       listen 80;
       server_name doc.sentio.ltd;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Restart Nginx: `sudo systemctl restart nginx`

### Option B: Hostinger Shared Hosting (Cloud)
1. Go to **Websites** -> **Create or Migrate**.
2. Choose **Node.js**.
3. Connect your **GitHub Repo**.
4. Set **Build Command**: `npm run build`.
5. Set **Start Command**: `npm start`.
6. Add **Environment Variables** (see list below).

## Environment Variables Checklist
Add these in your Hostinger Dashboard or `.env` file on VPS:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` = `https://doc.sentio.ltd`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ALLOWED_EMAILS`

## Google Auth Update
Don't forget to update **Google Cloud Console**:
- **Authorized JavaScript origins**: `https://doc.sentio.ltd`
- **Authorized redirect URIs**: `https://doc.sentio.ltd/api/auth/callback/google`
