# Quick Start - Deploy to AWS EC2 (aaPanel)

## Prerequisites Checklist

- ✅ AWS EC2 instance running Ubuntu
- ✅ aaPanel installed and configured
- ✅ Domain pointing to EC2 IP
- ✅ Node.js 20+ installed via aaPanel
- ✅ PM2 Manager installed via aaPanel
- ✅ Nginx configured with reverse proxy
- ✅ SSL certificate (Let's Encrypt) installed

## GitHub Secrets Required

Navigate to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

```
AWS_HOST=54.xxx.xxx.xxx (or pwa.makkuragatama.com)
AWS_USER=www
AWS_SSH_KEY=<paste entire private key here>
AWS_PORT=22
AAPANEL_PROJECT_PATH=/www/wwwroot/pwa.makkuragatama.id

NEXTAUTH_SECRET=LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=
NEXTAUTH_URL=https://pwa.makkuragatama.id
NEXT_APP_API_URL=https://apinext.makkuragatama.id
NEXT_APP_JWT_SECRET=ikRgjkhi15HJiU78-OLKfjngiu
```

## Initial Setup on EC2 (One-time)

```bash
# SSH to EC2
ssh www@<your-ec2-ip>

# Navigate to web root
cd /www/wwwroot/pwa.makkuragatama.id

# Clone repository
git clone https://github.com/ayatekapoetra/mkgpwa.git .

# Copy environment file
cp .env.production .env.local

# Install dependencies
npm ci --legacy-peer-deps

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## How It Works

### Auto Deploy (on push to main)

1. Developer pushes code to `main` branch
2. GitHub Actions automatically triggers
3. Workflow SSHs to AWS EC2
4. Pulls latest code
5. Installs dependencies
6. Builds Next.js app
7. Reloads PM2 process
8. Deployment complete! 🎉

### Manual Deploy

Go to: **GitHub → Actions → Manual Deploy to AWS (aaPanel) → Run workflow**

Choose:
- **Environment**: production/staging
- **Action**: deploy/restart/rollback

## Quick Commands

### Check Status
```bash
ssh www@<ec2-ip>
pm2 status
pm2 logs mkg-frontend --lines 50
```

### Manual Deploy
```bash
ssh www@<ec2-ip>
cd /www/wwwroot/pwa.makkuragatama.id
./deploy.sh production
```

### Restart Application
```bash
ssh www@<ec2-ip>
pm2 restart mkg-frontend
```

### Rollback
Use GitHub Actions "Manual Deploy" → Select "rollback" action

Or manually:
```bash
ssh www@<ec2-ip>
cd /www/wwwroot/pwa.makkuragatama.id
tar -xzf /www/backup/mkg-frontend-backup-LATEST.tar.gz
pm2 restart mkg-frontend
```

## Troubleshooting

### Deployment Failed
1. Check GitHub Actions logs
2. SSH to EC2 and check PM2: `pm2 logs mkg-frontend`
3. Check Nginx status: `systemctl status nginx`

### 502 Bad Gateway
```bash
# Check PM2 running
pm2 status mkg-frontend

# Restart if needed
pm2 restart mkg-frontend

# Check port
curl http://localhost:3005
```

### Port Conflict
```bash
# Kill existing process
pm2 delete mkg-frontend
pm2 start ecosystem.config.js --env production
```

## URLs

- **Production**: https://pwa.makkuragatama.id
- **aaPanel**: http://<ec2-ip>:7800
- **GitHub**: https://github.com/ayatekapoetra/mkgpwa
- **API Backend**: https://apinext.makkuragatama.id

## Support

For detailed documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
