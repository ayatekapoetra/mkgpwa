# Fix: Unexpected token '<' Error (Chunk Loading Issue)

## Problem

```
Uncaught SyntaxError: Unexpected token '<' (at webpack-xxx.js:1:1)
Uncaught SyntaxError: Unexpected token '<' (at 3589-xxx.js:1:1)
```

## Root Cause

Browser meminta JavaScript chunks (`.js` files) tapi server mengembalikan **HTML** (biasanya 404 page atau index.html). Ini terjadi karena:

1. ❌ **Nginx tidak dikonfigurasi dengan benar** untuk proxy ke Next.js
2. ❌ **Build ID tidak konsisten** antara builds
3. ❌ **Next.js server tidak running** atau crash
4. ❌ **Static files tidak ter-serve** dengan benar

## Solution Steps

### Step 1: Verify Next.js Server is Running

SSH ke server:

```bash
ssh www@<your-ec2-ip>

# Check PM2 status
pm2 status

# Expected output:
# ┌─────┬──────────────┬─────────┬─────────┐
# │ id  │ name         │ status  │ restart │
# ├─────┼──────────────┼─────────┼─────────┤
# │  0  │ mkg-frontend │ online  │ 0       │
# └─────┴──────────────┴─────────┴─────────┘

# If stopped or errored:
pm2 restart mkg-frontend

# Check logs for errors:
pm2 logs mkg-frontend --lines 50
```

### Step 2: Fix Nginx Configuration

Di aaPanel:

1. **Website** → **pwa.makkuragatama.id** → **Configuration**
2. Replace dengan config dari `nginx.conf` di repository
3. Key points yang HARUS ada:

```nginx
location / {
    proxy_pass http://127.0.0.1:3005;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    # ... (lihat nginx.conf lengkap)
}

location /_next/static/ {
    proxy_pass http://127.0.0.1:3005/_next/static/;
    add_header Cache-Control "public, max-age=31536000, immutable";
    expires 1y;
}
```

4. **Save** → **Restart Nginx**

### Step 3: Clear All Caches & Rebuild

Di server:

```bash
ssh www@<your-ec2-ip>
cd /www/wwwroot/pwa.makkuragatama.id

# Stop PM2
pm2 stop mkg-frontend

# Clear build
rm -rf .next

# Pull latest code
git fetch origin
git reset --hard origin/main

# Rebuild
npm ci --legacy-peer-deps
BUILD_ID="production-$(date +%s)" npm run build

# Restart PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Check status
pm2 logs mkg-frontend --lines 20
```

### Step 4: Test Chunk Loading

Dari browser DevTools Console:

```javascript
// Test if chunks are accessible
fetch('/_next/static/chunks/webpack-xxx.js')
  .then(r => r.text())
  .then(t => {
    console.log('First 100 chars:', t.substring(0, 100));
    // Should see JavaScript code, not HTML
  })
```

Expected: JavaScript code starting with something like `(self.webpackChunk_N_E=self...`
❌ Wrong: HTML starting with `<!DOCTYPE html>` or `<html>`

### Step 5: Force Browser Cache Clear

Di browser:

1. Open DevTools (F12)
2. **Application** tab → **Storage** → **Clear site data**
3. Or hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
4. Or Incognito/Private window

### Step 6: Verify Build Consistency

Di server:

```bash
cd /www/wwwroot/pwa.makkuragatama.id

# Check build ID
cat .next/BUILD_ID

# Should be consistent, not random hash
# Expected: "production-build" or "production-1234567890"

# List static chunks
ls -lh .next/static/chunks/ | head -20

# These files MUST exist
```

## Quick Fix Command

Run this on server:

```bash
cd /www/wwwroot/pwa.makkuragatama.id && \
pm2 stop mkg-frontend && \
rm -rf .next && \
git pull origin main && \
npm ci --legacy-peer-deps && \
BUILD_ID="production-$(date +%s)" npm run build && \
pm2 start ecosystem.config.js --env production && \
pm2 save && \
echo "✅ Deployment completed" && \
pm2 logs mkg-frontend --lines 20
```

## Verification Checklist

After fix, verify:

- ✅ PM2 status shows "online"
- ✅ `pm2 logs` shows no errors
- ✅ Nginx config has proxy_pass to port 3005
- ✅ `curl http://localhost:3005` returns HTML
- ✅ `curl http://localhost:3005/_next/static/chunks/webpack-xxx.js` returns JavaScript
- ✅ Browser can load website without console errors
- ✅ Browser DevTools Network tab shows `.js` files with 200 status
- ✅ No "Unexpected token '<'" errors

## Common Mistakes

### ❌ Mistake 1: Nginx trying to serve static files directly

```nginx
# WRONG:
location /_next/static/ {
    alias /www/wwwroot/pwa.makkuragatama.id/.next/static/;
}

# CORRECT:
location /_next/static/ {
    proxy_pass http://127.0.0.1:3005/_next/static/;
}
```

### ❌ Mistake 2: PM2 not running on correct port

```bash
# Check what port PM2 is using
pm2 info mkg-frontend | grep PORT

# Should be 3005, not something else
```

### ❌ Mistake 3: Firewall blocking port 3005

```bash
# Port 3005 should be accessible from localhost
curl http://localhost:3005

# Should return HTML, not "Connection refused"
```

### ❌ Mistake 4: Wrong document root in Nginx

```nginx
# WRONG:
root /www/wwwroot/pwa.makkuragatama.id/.next;

# CORRECT:
root /www/wwwroot/pwa.makkuragatama.id;
# (Let Next.js server handle routing)
```

## If Still Not Working

### Debug Mode:

```bash
# Enable detailed PM2 logs
pm2 stop mkg-frontend
cd /www/wwwroot/pwa.makkuragatama.id

# Run Next.js directly to see errors
NODE_ENV=production PORT=3005 npm start

# Look for errors in output
```

### Check Nginx Access/Error Logs:

```bash
# In aaPanel or via SSH
tail -f /www/wwwlogs/pwa.makkuragatama.id-error.log
tail -f /www/wwwlogs/pwa.makkuragatama.id-access.log
```

### Test Without Nginx:

```bash
# Temporarily test on another port
PORT=3007 npm start

# Then access: http://<ec2-ip>:3007
# (Need to open port 3007 in AWS Security Group)
```

## Prevention

To prevent this issue in future:

1. ✅ Always use consistent BUILD_ID
2. ✅ Proper Nginx configuration from start
3. ✅ Monitor PM2 status after deployments
4. ✅ Test deployment in staging first
5. ✅ Keep PM2 logs for debugging

## Related Files

- `nginx.conf` - Correct Nginx configuration
- `next.config.js` - Fixed generateBuildId
- `.github/workflows/deploy-web.yml` - Auto-deployment
- `ecosystem.config.js` - PM2 configuration

---

**Version:** 1.4.10  
**Issue:** Chunk loading error - Unexpected token '<'  
**Status:** Fixed with proper Nginx + consistent build ID
