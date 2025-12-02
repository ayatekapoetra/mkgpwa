# Deployment Guide

## Auto Deploy Web Platform

Project ini memiliki GitHub Actions workflow untuk auto-deploy ke server production setiap kali ada push ke branch `main`.

### Setup GitHub Secrets

Untuk mengaktifkan auto-deploy, tambahkan secrets berikut di GitHub repository:

1. **Buka repository di GitHub**
2. **Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets:

##### Server SSH Access:
- `SERVER_HOST`: Hostname/IP server production (e.g., `pwa.makkuragatama.com` atau IP address)
- `SERVER_USER`: SSH username (e.g., `root`, `ubuntu`, atau username lain)
- `SERVER_SSH_KEY`: Private SSH key untuk akses ke server
- `SERVER_PORT`: SSH port (default: 22, optional)
- `SERVER_PATH`: Path direktori aplikasi di server (e.g., `/var/www/mkg-frontend`)

##### Environment Variables:
- `NEXTAUTH_SECRET`: Secret key untuk NextAuth (sama dengan `.env.production`)
- `NEXTAUTH_URL`: URL production (e.g., `https://pwa.makkuragatama.id`)
- `NEXT_APP_API_URL`: API URL (e.g., `https://apinext.makkuragatama.id`)
- `NEXT_APP_JWT_SECRET`: JWT secret key

##### Webhook (Optional - untuk manual deploy):
- `DEPLOY_WEBHOOK_URL`: URL webhook untuk trigger deploy
- `DEPLOY_TOKEN`: Bearer token untuk webhook authorization

### Generate SSH Key untuk GitHub Actions

Di server production:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Add public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Copy private key untuk di-paste ke GitHub Secret SERVER_SSH_KEY
cat ~/.ssh/github-actions
```

### Setup PM2 di Server

Pastikan PM2 sudah terinstall di server:

```bash
# Install PM2 globally
npm install -g pm2

# Setup PM2 untuk auto-start
pm2 startup
pm2 save

# Start aplikasi dengan PM2
cd /var/www/mkg-frontend
pm2 start npm --name "mkg-frontend" -- start

# Check status
pm2 status
pm2 logs mkg-frontend
```

### Setup Nginx Reverse Proxy (Optional)

Jika menggunakan Nginx:

```nginx
server {
    listen 80;
    server_name pwa.makkuragatama.id;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Workflows Available

#### 1. `deploy-web.yml` - Auto Deploy
Trigger: Push ke branch `main`

Otomatis build dan deploy ke production server setiap ada perubahan code.

#### 2. `deploy-web-manual.yml` - Manual Deploy
Trigger: Manual via GitHub Actions UI

Gunakan untuk deployment manual dengan pilihan environment (production/staging).

#### 3. `build-release.yml` - Build Electron
Trigger: Push tag `v*` (e.g., v1.4.5)

Build aplikasi Electron untuk macOS dan Windows, lalu publish ke GitHub Releases.

### Testing Deployment

1. **Test auto deploy:**
   ```bash
   git add .
   git commit -m "test: trigger auto deploy"
   git push origin main
   ```

2. **Check workflow status:**
   - Buka GitHub repository
   - Actions tab
   - Lihat running/completed workflows

3. **Check server:**
   ```bash
   pm2 logs mkg-frontend
   pm2 status
   ```

### Troubleshooting

#### Deploy gagal - SSH connection error
- Pastikan `SERVER_SSH_KEY` benar (copy seluruh private key termasuk header/footer)
- Pastikan public key sudah ada di `~/.ssh/authorized_keys` server
- Check firewall server allow port 22 (atau custom SSH port)

#### Deploy gagal - Build error
- Check logs di GitHub Actions
- Pastikan semua environment variables sudah di-set di GitHub Secrets
- Test build local: `npm run build`

#### PM2 tidak reload
- SSH ke server dan check PM2 status: `pm2 status`
- Manual reload: `pm2 reload mkg-frontend`
- Restart PM2: `pm2 restart mkg-frontend`

#### Port already in use
- Check process: `lsof -i :3005`
- Kill process: `kill -9 <PID>`
- Atau gunakan port lain di `package.json` script `start`

### Alternative: Deploy dengan Vercel/Netlify

Jika tidak ingin self-host, bisa deploy ke platform:

**Vercel:**
```bash
npm i -g vercel
vercel --prod
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Security Best Practices

1. ✅ Jangan commit secrets ke repository
2. ✅ Gunakan environment variables untuk sensitive data
3. ✅ Rotate SSH keys secara berkala
4. ✅ Setup firewall di server (allow only port 22, 80, 443)
5. ✅ Enable HTTPS dengan Let's Encrypt
6. ✅ Setup rate limiting di Nginx
7. ✅ Regular backup database & files
