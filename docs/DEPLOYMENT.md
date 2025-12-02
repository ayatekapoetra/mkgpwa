# Deployment Guide - AWS EC2 with aaPanel

## Auto Deploy Web Platform

Project ini memiliki GitHub Actions workflow untuk auto-deploy ke AWS EC2 server (managed by aaPanel) setiap kali ada push ke branch `main`.

### Setup GitHub Secrets

Untuk mengaktifkan auto-deploy, tambahkan secrets berikut di GitHub repository:

1. **Buka repository di GitHub**
2. **Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets:

##### AWS EC2 SSH Access (aaPanel):
- `AWS_HOST`: AWS EC2 Public IP atau hostname (e.g., `54.xxx.xxx.xxx` atau `pwa.makkuragatama.com`)
- `AWS_USER`: SSH username di EC2 (e.g., `www` untuk aaPanel, atau `root`)
- `AWS_SSH_KEY`: Private SSH key untuk akses ke EC2 instance
- `AWS_PORT`: SSH port (default: 22, atau custom port jika diubah di security group)
- `AAPANEL_PROJECT_PATH`: Path direktori aplikasi di aaPanel (e.g., `/www/wwwroot/pwa.makkuragatama.id`)
- `AAPANEL_PROJECT_PATH_STAGING`: Path untuk staging environment (optional)

##### Environment Variables:
- `NEXTAUTH_SECRET`: Secret key untuk NextAuth (sama dengan `.env.production`)
- `NEXTAUTH_URL`: URL production (e.g., `https://pwa.makkuragatama.id`)
- `NEXT_APP_API_URL`: API URL (e.g., `https://apinext.makkuragatama.id`)
- `NEXT_APP_JWT_SECRET`: JWT secret key

### Setup AWS EC2 Instance dengan aaPanel

#### 1. Install aaPanel di EC2 Instance

SSH ke EC2 instance dan install aaPanel:

```bash
# Install aaPanel
wget -O install.sh http://www.aapanel.com/script/install-ubuntu_6.0_en.sh
sudo bash install.sh aapanel

# Setelah install, catat:
# - aaPanel URL (e.g., http://54.xxx.xxx.xxx:7800)
# - Username dan password default
```

#### 2. Configure aaPanel

1. Login ke aaPanel dashboard
2. Install required software:
   - **Nginx** (web server)
   - **PM2 Manager** (dari App Store)
   - **Node.js** version 20+ (dari App Store)
3. Create website:
   - Domain: `pwa.makkuragatama.id`
   - Root directory: `/www/wwwroot/pwa.makkuragatama.id`
   - Enable SSL (Let's Encrypt)

#### 3. Setup SSH Access untuk GitHub Actions

Di EC2 instance (as root atau www user):

```bash
# Switch to www user (aaPanel default)
su - www

# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions

# Add public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Display private key (copy untuk GitHub Secret AWS_SSH_KEY)
cat ~/.ssh/github-actions
```

#### 4. Clone Repository di aaPanel

```bash
# Navigate to website root
cd /www/wwwroot/pwa.makkuragatama.id

# Clone repository
git clone https://github.com/ayatekapoetra/mkgpwa.git .

# Or jika sudah ada website, backup dulu:
cd /www/wwwroot/
mv pwa.makkuragatama.id pwa.makkuragatama.id.backup
git clone https://github.com/ayatekapoetra/mkgpwa.git pwa.makkuragatama.id
cd pwa.makkuragatama.id

# Install dependencies
npm ci --legacy-peer-deps

# Copy environment file
cp .env.production .env.local

# Build application
npm run build

# Start with PM2
pm2 start npm --name "mkg-frontend" -- start
pm2 save
```

#### 5. Configure Nginx di aaPanel

aaPanel → Website → pwa.makkuragatama.id → Configuration → Edit

Tambahkan reverse proxy ke Next.js:

```nginx
location / {
    proxy_pass http://127.0.0.1:3005;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}

# Static files
location /_next/static {
    proxy_pass http://127.0.0.1:3005/_next/static;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

#### 6. Configure AWS Security Group

Di AWS Console → EC2 → Security Groups:

Tambahkan inbound rules:
- **SSH**: Port 22 (dari GitHub Actions IPs atau 0.0.0.0/0)
- **HTTP**: Port 80 (dari 0.0.0.0/0)
- **HTTPS**: Port 443 (dari 0.0.0.0/0)
- **aaPanel**: Port 7800 (dari IP kantor/rumah saja untuk keamanan)

#### 7. Setup PM2 di aaPanel

Via aaPanel PM2 Manager atau via SSH:

```bash
# Install PM2 globally (jika belum)
npm install -g pm2

# Setup PM2 startup
pm2 startup
# Jalankan command yang di-generate

# Save PM2 process list
pm2 save

# Enable PM2 resurrection
pm2 unstartup
pm2 startup
pm2 save
```

### Workflows Available

#### 1. `deploy-web.yml` - Auto Deploy to AWS (aaPanel)
**Trigger:** Push ke branch `main`

Otomatis deploy ke AWS EC2 (managed by aaPanel) setiap ada perubahan code.

**Flow:**
1. Detect push ke `main` branch
2. SSH ke AWS EC2 instance
3. Pull latest code
4. Install dependencies
5. Build Next.js application
6. Reload PM2 process
7. Health check

#### 2. `deploy-web-manual.yml` - Manual Deploy/Restart/Rollback
**Trigger:** Manual via GitHub Actions UI

Actions tersedia:
- **Deploy**: Full deployment (pull, install, build, restart)
- **Restart**: Restart PM2 process saja
- **Rollback**: Restore dari backup terakhir

Environment:
- Production
- Staging (optional)

#### 3. `build-release.yml` - Build Electron
**Trigger:** Push tag `v*` (e.g., v1.4.6)

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
- Pastikan `AWS_SSH_KEY` benar (copy seluruh private key termasuk `-----BEGIN` dan `-----END`)
- Pastikan public key sudah ada di `~/.ssh/authorized_keys` di EC2 instance
- Check AWS Security Group allow SSH port 22 dari GitHub Actions IPs
- Test SSH manual: `ssh -i ~/.ssh/github-actions www@<AWS_IP>`

#### Deploy gagal - Permission denied
- Pastikan user `www` (aaPanel) memiliki permission ke project directory
- Check ownership: `chown -R www:www /www/wwwroot/pwa.makkuragatama.id`
- Check git permission: `sudo -u www git pull` (harus berhasil)

#### Deploy gagal - Git pull error
- SSH ke EC2 dan reset git: `cd /www/wwwroot/pwa.makkuragatama.id && git reset --hard origin/main`
- Setup git config untuk www user:
  ```bash
  su - www
  git config --global user.name "Deploy Bot"
  git config --global user.email "deploy@makkuragatama.id"
  ```

#### Deploy gagal - Build error
- Check logs di GitHub Actions
- Pastikan semua environment variables ada di `.env.production` di EC2
- SSH ke EC2 dan manual build: `npm run build`
- Check Node.js version: `node -v` (harus 18+)

#### PM2 tidak reload
- SSH ke EC2: `ssh www@<AWS_IP>`
- Check PM2 status: `pm2 status`
- Manual reload: `pm2 reload mkg-frontend`
- Check logs: `pm2 logs mkg-frontend --lines 50`
- Restart: `pm2 restart mkg-frontend`

#### Port already in use
- Check process: `lsof -i :3005` atau `netstat -tuln | grep 3005`
- Kill via PM2: `pm2 delete mkg-frontend`
- Kill manual: `kill -9 <PID>`
- Start fresh: `pm2 start npm --name "mkg-frontend" -- start`

#### Nginx 502 Bad Gateway
- Check PM2 running: `pm2 status mkg-frontend`
- Check port: `curl http://localhost:3005` (harus return HTML)
- Check Nginx config di aaPanel → Website → pwa.makkuragatama.id → Configuration
- Restart Nginx: `systemctl restart nginx` atau via aaPanel

#### SSL Certificate Error
- Di aaPanel → Website → pwa.makkuragatama.id → SSL
- Apply for Let's Encrypt certificate
- Pastikan domain sudah pointing ke AWS EC2 IP
- Force HTTPS redirect

#### Memory Issues (Build OOM)
- Increase swap di EC2:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```
- Atau upgrade EC2 instance type (minimum t3.small recommended)

### aaPanel Tips

#### Backup Configuration
- aaPanel → Cron → Add scheduled backup
- Backup frequency: Daily
- Backup retention: Keep last 7 days
- Backup location: AWS S3 atau local `/www/backup`

#### Monitor Resources
- aaPanel → System Info → CPU/Memory/Disk usage
- Setup alerts untuk high usage
- Integrate dengan AWS CloudWatch (optional)

#### Database Management (jika ada)
- aaPanel → Database → phpMyAdmin
- Backup database sebelum major deployment
- Setup daily automated backup

### GitHub Actions Tips

#### View Deployment Logs
1. GitHub → Actions tab
2. Select workflow run
3. Click "Deploy to AWS EC2" job
4. Expand "Deploy to AWS EC2 (aaPanel)" step

#### Cancel Running Deployment
- GitHub → Actions → Running workflow → Cancel workflow

#### Re-run Failed Deployment
- GitHub → Actions → Failed workflow → Re-run jobs

### Alternative: Manual Deployment

Jika GitHub Actions bermasalah, deploy manual via SSH:

```bash
# SSH to EC2
ssh www@<AWS_IP>

# Run deployment script
cd /www/wwwroot/pwa.makkuragatama.id
./deploy.sh production
```

### Security Best Practices

1. ✅ Jangan commit secrets ke repository
2. ✅ Gunakan environment variables untuk sensitive data
3. ✅ Rotate SSH keys secara berkala
4. ✅ Setup firewall di server (allow only port 22, 80, 443)
5. ✅ Enable HTTPS dengan Let's Encrypt
6. ✅ Setup rate limiting di Nginx
7. ✅ Regular backup database & files
