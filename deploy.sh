#!/bin/bash

# MKG Frontend Deployment Script for AWS EC2 with aaPanel
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/www/backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment for $ENVIRONMENT environment...${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Current directory: $(pwd)"
echo "Current user: $(whoami)"

# Create backup directory if not exists
sudo mkdir -p $BACKUP_DIR
sudo chown www:www $BACKUP_DIR

# Backup current build
if [ -d ".next" ]; then
    echo -e "${YELLOW}📦 Backing up current build...${NC}"
    tar -czf "$BACKUP_DIR/mkg-frontend-backup-$TIMESTAMP.tar.gz" .next 2>/dev/null || true
    echo -e "${GREEN}✅ Backup saved to $BACKUP_DIR/mkg-frontend-backup-$TIMESTAMP.tar.gz${NC}"
fi

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes from repository...${NC}"
git fetch origin
git reset --hard origin/main
git pull origin main

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo -e "${YELLOW}📝 Loading environment variables from .env.$ENVIRONMENT${NC}"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
elif [ -f ".env.production" ]; then
    echo -e "${YELLOW}📝 Loading environment variables from .env.production${NC}"
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --legacy-peer-deps

# Build application
echo -e "${YELLOW}🔨 Building Next.js application...${NC}"
if [ "$ENVIRONMENT" == "production" ]; then
    NODE_ENV=production npm run build
else
    NODE_ENV=staging npm run build
fi

# Set PM2 process name based on environment
if [ "$ENVIRONMENT" == "production" ]; then
    PM2_NAME="mkg-frontend"
else
    PM2_NAME="mkg-frontend-staging"
fi

# Restart PM2
echo -e "${YELLOW}🔄 Restarting PM2 process ($PM2_NAME)...${NC}"
if pm2 list | grep -q "$PM2_NAME"; then
    pm2 reload $PM2_NAME --update-env
    echo -e "${GREEN}✅ PM2 process reloaded${NC}"
else
    if [ "$ENVIRONMENT" == "production" ]; then
        pm2 start npm --name "$PM2_NAME" -- start
    else
        pm2 start npm --name "$PM2_NAME" -- run "start:staging"
    fi
    pm2 save
    echo -e "${GREEN}✅ PM2 process started${NC}"
fi

# Save PM2 configuration
pm2 save

# Wait for application to start
sleep 3

# Health check
echo -e "${YELLOW}🔍 Performing health check...${NC}"
if pm2 list | grep -q "online.*$PM2_NAME"; then
    echo -e "${GREEN}✅ Application is running!${NC}"
    pm2 info $PM2_NAME
    
    # Test HTTP endpoint
    if curl -f -s -o /dev/null http://localhost:3005; then
        echo -e "${GREEN}✅ HTTP endpoint is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP endpoint check failed${NC}"
    fi
else
    echo -e "${RED}❌ Application is not running properly${NC}"
    pm2 logs $PM2_NAME --lines 20 --nostream
    exit 1
fi

# Clean old backups (keep last 5)
echo -e "${YELLOW}🧹 Cleaning old backups...${NC}"
ls -t $BACKUP_DIR/mkg-frontend-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -- 2>/dev/null || true

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  📊 View logs: pm2 logs $PM2_NAME"
echo "  📈 View status: pm2 status"
echo "  🌐 Visit: https://pwa.makkuragatama.id"
echo ""
echo "Rollback command (if needed):"
echo "  ./deploy.sh rollback"
