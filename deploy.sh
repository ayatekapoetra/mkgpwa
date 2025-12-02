#!/bin/bash

# MKG Frontend Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Backup current build
if [ -d ".next" ]; then
    echo "📦 Backing up current build..."
    tar -czf "$BACKUP_DIR/build_backup_$TIMESTAMP.tar.gz" .next
    echo "✅ Backup saved to $BACKUP_DIR/build_backup_$TIMESTAMP.tar.gz"
fi

# Pull latest changes
echo "📥 Pulling latest changes from repository..."
git fetch origin
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Build application
echo "🔨 Building application..."
if [ "$ENVIRONMENT" == "production" ]; then
    NODE_ENV=production npm run build
else
    NODE_ENV=staging npm run build
fi

# Restart PM2
echo "🔄 Restarting PM2 process..."
if pm2 list | grep -q "mkg-frontend"; then
    pm2 reload mkg-frontend
    echo "✅ PM2 process reloaded"
else
    pm2 start npm --name "mkg-frontend" -- start
    echo "✅ PM2 process started"
fi

# Save PM2 configuration
pm2 save

# Check application status
echo "🔍 Checking application status..."
sleep 3
pm2 status mkg-frontend

# Clean old backups (keep last 5)
echo "🧹 Cleaning old backups..."
ls -t $BACKUP_DIR/build_backup_*.tar.gz | tail -n +6 | xargs -r rm --

echo "✅ Deployment completed successfully!"
echo "📊 View logs: pm2 logs mkg-frontend"
echo "📈 View status: pm2 status"
