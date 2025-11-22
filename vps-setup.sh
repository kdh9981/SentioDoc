#!/bin/bash

# DocSend Clone VPS Setup Script
# Run this on your Hostinger VPS as root

DOMAIN="doc.sentio.ltd"
REPO="https://github.com/kdh9981/SentioDoc.git"
APP_DIR="/var/www/docsend"

echo "🚀 Starting Setup for $DOMAIN..."

# 1. System Update
echo "📦 Updating system..."
apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx

# 2. Install Node.js 20
echo "🟢 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Install PM2
echo "⚙️ Installing PM2..."
npm install -g pm2

# 4. Setup App
echo "📂 Cloning repository..."
mkdir -p /var/www
if [ -d "$APP_DIR" ]; then
    echo "Directory exists, pulling latest..."
    cd $APP_DIR
    git pull
else
    git clone $REPO $APP_DIR
    cd $APP_DIR
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building application..."
npm run build

# 5. Start with PM2
echo "🚀 Starting application..."
pm2 delete docsend 2>/dev/null || true
pm2 start npm --name "docsend" -- start
pm2 save
pm2 startup

# 6. Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/docsend <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/docsend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and Restart Nginx
nginx -t && systemctl restart nginx

# 7. SSL Certificate (Certbot)
echo "🔒 Setting up SSL..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

echo "✅ Setup Complete!"
echo "⚠️ IMPORTANT: You must now create your .env.local file:"
echo "   nano $APP_DIR/.env.local"
echo "   (Paste your environment variables there, then run: pm2 restart docsend)"
