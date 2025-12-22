# Deployment Instructions for v1.4.12

## Issue Fixed
- Fixed TypeError: Cannot read properties of undefined (reading 'filter') in lokasi tag feature
- Fixed data structure handling in grouptag-timesheet API hook

## Deploy to Production Server

### Method 1: Using deploy.sh script (Recommended)
```bash
ssh www@pwa.makkuragatama.id
cd /www/wwwroot/pwa.makkuragatama.id
./deploy.sh production
```

### Method 2: Manual deployment
```bash
ssh www@pwa.makkuragatama.id
cd /www/wwwroot/pwa.makkuragatama.id

# Pull latest changes
git fetch origin
git pull origin main

# Clean old build and cache
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
npm ci --legacy-peer-deps

# Build with cache clearing
NODE_ENV=production npm run build

# Restart PM2
pm2 reload mkg-frontend --update-env

# Verify deployment
pm2 logs mkg-frontend --lines 50
```

### Method 3: Force complete rebuild
```bash
ssh www@pwa.makkuragatama.id
cd /www/wwwroot/pwa.makkuragatama.id

# Stop application
pm2 stop mkg-frontend

# Clean everything
rm -rf .next
rm -rf node_modules
rm -rf node_modules/.cache

# Pull latest
git fetch origin
git reset --hard origin/main
git pull origin main

# Fresh install
npm ci --legacy-peer-deps

# Build
NODE_ENV=production npm run build

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save
```

## Verification Steps

1. Check PM2 status:
```bash
pm2 status
pm2 logs mkg-frontend --lines 50
```

2. Check application version:
```bash
curl http://localhost:3005/api/health
```

3. Test lokasi tag feature:
- Navigate to: https://pwa.makkuragatama.id/lokasikerja-tag
- Open browser console (F12)
- Check for any errors
- Test filtering functionality

## Browser Cache Clearing

Users may need to clear browser cache:
1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. Or clear site data in browser developer tools

## Rollback (if needed)
```bash
ssh www@pwa.makkuragatama.id
cd /www/wwwroot/pwa.makkuragatama.id

# Restore from backup
tar -xzf /www/backup/mkg-frontend-backup-[TIMESTAMP].tar.gz

# Restart
pm2 reload mkg-frontend
```

## Files Changed
- `src/api/grouptag-timesheet.js` - Fixed data structure return
- `package.json` - Version bump to 1.4.12
- `VERSION` - Updated to v1.4.12

## Git Tags
- Tag created: v1.4.12
- Commit: 6978dde
