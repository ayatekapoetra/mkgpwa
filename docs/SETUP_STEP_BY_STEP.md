# Setup Step by Step - Deploy ke AWS EC2 dengan aaPanel

Tutorial lengkap dari nol sampai auto-deploy berjalan.

---

## 📋 PART 1: Persiapan AWS EC2

### Step 1.1: Buat EC2 Instance di AWS

1. Login ke **AWS Console**: https://aws.amazon.com/console/
2. Pilih region terdekat (e.g., **Singapore - ap-southeast-1**)
3. Buka **EC2 Dashboard** → klik **Launch Instance**
4. Konfigurasi:
   - **Name**: `mkg-frontend-server`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: `t3.small` (minimum) atau `t3.medium` (recommended)
   - **Key pair**: 
     - Klik "Create new key pair"
     - Name: `mkg-aws-key`
     - Type: RSA
     - Format: .pem
     - Download dan simpan file `mkg-aws-key.pem`
   - **Network settings**:
     - Allow SSH (port 22)
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
     - Allow Custom TCP (port 7800) untuk aaPanel
   - **Storage**: 20 GB (minimum)

5. Klik **Launch Instance**
6. Tunggu sampai status **Running**
7. Catat **Public IPv4 address** (e.g., `54.xxx.xxx.xxx`)

### Step 1.2: Setting Security Group

1. Di EC2 Dashboard → **Security Groups**
2. Pilih security group instance Anda
3. Tab **Inbound rules** → **Edit inbound rules**
4. Pastikan ada rules:
   ```
   Type            Port    Source
   SSH             22      0.0.0.0/0
   HTTP            80      0.0.0.0/0
   HTTPS           443     0.0.0.0/0
   Custom TCP      7800    <IP kantor/rumah Anda>/32 (untuk keamanan)
   ```
5. **Save rules**

### Step 1.3: Connect ke EC2 Instance

Di terminal komputer Anda:

```bash
# Set permission file key
chmod 400 ~/Downloads/mkg-aws-key.pem

# SSH ke EC2 (ganti dengan IP Anda)
ssh -i ~/Downloads/mkg-aws-key.pem ubuntu@54.xxx.xxx.xxx

# Jika berhasil, Anda akan masuk ke terminal EC2
```

---

## 📦 PART 2: Install aaPanel di EC2

### Step 2.1: Install aaPanel

Di terminal EC2 yang sudah connect:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install aaPanel
wget -O install.sh http://www.aapanel.com/script/install-ubuntu_6.0_en.sh
sudo bash install.sh aapanel
```

Proses install 5-10 menit. Setelah selesai, akan muncul:

```
==================================================================
Congratulations! Installed successfully!
==================================================================
aaPanel Internet Address: http://54.xxx.xxx.xxx:7800/xxxxxxxx
aaPanel Internal Address: http://10.xxx.xxx.xxx:7800/xxxxxxxx
username: xxxxxxxx
password: xxxxxxxx
==================================================================
```

**PENTING: Simpan informasi ini!**

### Step 2.2: Login ke aaPanel

1. Buka browser, akses URL yang diberikan (e.g., `http://54.xxx.xxx.xxx:7800/xxxxxxxx`)
2. Login dengan username dan password yang diberikan
3. Pilih bahasa **English**
4. Akan muncul recommended apps untuk install

### Step 2.3: Install Required Software di aaPanel

1. Di aaPanel dashboard → **App Store**
2. Install aplikasi berikut (satu per satu):

   **a. Nginx** (Web Server)
   - Search "Nginx"
   - Klik **Install**
   - Version: Latest stable
   - Tunggu sampai selesai

   **b. Node.js** (untuk Next.js)
   - Search "Node.js"
   - Klik **Install**
   - Version: **20.x** atau **18.x**
   - Tunggu sampai selesai

   **c. PM2 Manager** (Process Manager)
   - Search "PM2 Manager"
   - Klik **Install**
   - Tunggu sampai selesai

3. Verify instalasi di terminal EC2:
   ```bash
   nginx -v
   node -v
   npm -v
   pm2 -v
   ```

---

## 🌐 PART 3: Setup Domain & SSL

### Step 3.1: Point Domain ke EC2

1. Login ke **Cloudflare** atau provider DNS Anda
2. Tambah DNS record:
   ```
   Type: A
   Name: pwa
   Content: 54.xxx.xxx.xxx (IP EC2 Anda)
   TTL: Auto
   Proxy status: DNS only (abu-abu)
   ```
3. Save
4. Tunggu 5-10 menit untuk propagasi DNS

### Step 3.2: Buat Website di aaPanel

1. Di aaPanel → **Website** → **Add site**
2. Konfigurasi:
   - **Domain**: `pwa.makkuragatama.id`
   - **Root directory**: `/www/wwwroot/pwa.makkuragatama.id`
   - **PHP Version**: Pure static (karena kita pakai Node.js)
   - **Database**: MySQL (skip untuk sekarang)
3. Klik **Submit**

### Step 3.3: Setup SSL Certificate

1. Di aaPanel → **Website** → klik domain `pwa.makkuragatama.id`
2. Tab **SSL** → **Let's Encrypt**
3. Konfigurasi:
   - Email: `ayatekapoetra@gmail.com`
   - Domain: pilih `pwa.makkuragatama.id`
   - Auto-renew: **Enable**
4. Klik **Apply**
5. Tunggu 1-2 menit
6. Setelah berhasil, enable **Force HTTPS**

---

## 🔧 PART 4: Setup Git & Clone Repository

### Step 4.1: Generate SSH Key di EC2

SSH ke EC2 sebagai user `www` (user aaPanel):

```bash
# Dari terminal EC2 sebagai ubuntu
sudo su - www

# Generate SSH key
ssh-keygen -t ed25519 -C "github-deploy"

# Tekan Enter 3x (no passphrase)

# Tampilkan public key
cat ~/.ssh/id_ed25519.pub
```

**Copy output public key** (mulai dari `ssh-ed25519` sampai akhir)

### Step 4.2: Tambahkan SSH Key ke GitHub

1. Login ke **GitHub** → **Settings** → **SSH and GPG keys**
2. Klik **New SSH key**
3. Title: `AWS EC2 aaPanel`
4. Key: Paste public key dari step sebelumnya
5. Klik **Add SSH key**

### Step 4.3: Clone Repository

Masih sebagai user `www`:

```bash
# Hapus directory default (jika ada)
cd /www/wwwroot/
rm -rf pwa.makkuragatama.id/*

# Clone repository
cd /www/wwwroot/
git clone git@github.com:ayatekapoetra/mkgpwa.git pwa.makkuragatama.id

# Masuk ke directory
cd pwa.makkuragatama.id

# Check branch
git branch
# Pastikan di branch 'main'
```

### Step 4.4: Setup Git Config

```bash
# Masih sebagai user www
git config --global user.name "Deploy Bot"
git config --global user.email "deploy@makkuragatama.id"
git config --global --add safe.directory /www/wwwroot/pwa.makkuragatama.id
```

---

## ⚙️ PART 5: Setup Environment & Build

### Step 5.1: Copy Environment File

```bash
# Masih di /www/wwwroot/pwa.makkuragatama.id
cd /www/wwwroot/pwa.makkuragatama.id

# Copy production env
cp .env.production .env.local

# Edit jika perlu
nano .env.local
```

Pastikan isi `.env.local`:
```env
NEXT_APP_VERSION=v1.4.7
NEXTAUTH_SECRET=LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=
NEXTAUTH_URL=https://pwa.makkuragatama.id
NEXTAUTH_TRUST_HOST=true
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAXv4RQK39CskcIB8fvM1Q7XCofZcLxUXw
NEXT_APP_API_URL=https://apinext.makkuragatama.id
NEXT_APP_JWT_SECRET=ikRgjkhi15HJiU78-OLKfjngiu
NEXT_APP_JWT_TIMEOUT=86400
NEXT_APP_JWT_TIMEOUT_REMEMBER=604800
NODE_ENV=production
```

Save (Ctrl+O, Enter, Ctrl+X)

### Step 5.2: Install Dependencies & Build

```bash
# Install dependencies
npm ci --legacy-peer-deps

# Build Next.js application
npm run build
```

**Catatan:** Proses build bisa 5-15 menit tergantung spesifikasi EC2.

Jika dapat error "out of memory", tambah swap:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Ulangi build
npm run build
```

---

## 🚀 PART 6: Setup PM2 & Start Application

### Step 6.1: Start dengan PM2

```bash
# Masih di /www/wwwroot/pwa.makkuragatama.id
pm2 start ecosystem.config.js --env production

# Save PM2 list
pm2 save

# Setup PM2 startup
pm2 startup
# Copy command yang muncul, lalu exit dan jalankan sebagai ubuntu:
exit

# Jalankan command yang di-copy (sebagai ubuntu, bukan www)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u www --hp /home/www
```

### Step 6.2: Verify PM2 Running

```bash
# Switch kembali ke www
sudo su - www

# Check PM2 status
pm2 status

# Expected output:
# ┌─────┬──────────────────┬─────────┬────────┐
# │ id  │ name             │ status  │ cpu    │
# ├─────┼──────────────────┼─────────┼────────┤
# │  0  │ mkg-frontend     │ online  │ 0%     │
# └─────┴──────────────────┴─────────┴────────┘

# Check logs
pm2 logs mkg-frontend --lines 20
```

### Step 6.3: Test Application

```bash
# Test dari dalam EC2
curl http://localhost:3005

# Seharusnya return HTML
```

---

## 🔄 PART 7: Configure Nginx Reverse Proxy

### Step 7.1: Edit Nginx Config di aaPanel

1. Di aaPanel → **Website** → klik domain `pwa.makkuragatama.id`
2. Tab **Config File**
3. Cari section `location /` dan **ganti semua isinya** dengan:

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

location /_next/static {
    proxy_pass http://127.0.0.1:3005/_next/static;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location /favicon.ico {
    proxy_pass http://127.0.0.1:3005/favicon.ico;
    add_header Cache-Control "public, max-age=86400";
}
```

4. Klik **Save**
5. Restart Nginx: Website → Service → Nginx → **Restart**

### Step 7.2: Test Website

Buka browser: `https://pwa.makkuragatama.id`

Seharusnya website sudah bisa diakses! ✅

---

## 🤖 PART 8: Setup GitHub Actions Auto Deploy

### Step 8.1: Generate SSH Key untuk GitHub Actions

SSH ke EC2 sebagai www:

```bash
sudo su - www
cd ~/.ssh

# Generate key khusus untuk GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f github-actions

# Tekan Enter 3x (no passphrase)

# Tambahkan public key ke authorized_keys
cat github-actions.pub >> authorized_keys

# Set permissions
chmod 600 authorized_keys
chmod 600 github-actions
chmod 644 github-actions.pub

# Tampilkan private key (untuk GitHub Secret)
cat github-actions
```

**Copy seluruh output**, mulai dari:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Step 8.2: Setup GitHub Secrets

1. Buka **GitHub** → Repository `mkgpwa`
2. **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**

Tambahkan secrets berikut satu per satu:

#### Secret 1: AWS_HOST
- Name: `AWS_HOST`
- Value: `54.xxx.xxx.xxx` (ganti dengan IP EC2 Anda)
- Klik **Add secret**

#### Secret 2: AWS_USER
- Name: `AWS_USER`
- Value: `www`
- Klik **Add secret**

#### Secret 3: AWS_SSH_KEY
- Name: `AWS_SSH_KEY`
- Value: Paste private key dari step 8.1 (seluruh isi file `github-actions`)
- Klik **Add secret**

#### Secret 4: AWS_PORT
- Name: `AWS_PORT`
- Value: `22`
- Klik **Add secret**

#### Secret 5: AAPANEL_PROJECT_PATH
- Name: `AAPANEL_PROJECT_PATH`
- Value: `/www/wwwroot/pwa.makkuragatama.id`
- Klik **Add secret**

#### Secret 6-9: Environment Variables

- Name: `NEXTAUTH_SECRET`
- Value: `LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=`

- Name: `NEXTAUTH_URL`
- Value: `https://pwa.makkuragatama.id`

- Name: `NEXT_APP_API_URL`
- Value: `https://apinext.makkuragatama.id`

- Name: `NEXT_APP_JWT_SECRET`
- Value: `ikRgjkhi15HJiU78-OLKfjngiu`

### Step 8.3: Test GitHub Actions

1. Di komputer Anda, buat perubahan kecil:
   ```bash
   cd /Users/makkuragatama/Project/nextjs/ai-project/mkg/fe
   
   # Edit file README atau tambah comment
   echo "# Test auto deploy" >> README.md
   
   # Commit & push
   git add .
   git commit -m "test: trigger auto deploy"
   git push origin main
   ```

2. Buka **GitHub** → Repository → **Actions** tab
3. Lihat workflow "Deploy Web to AWS (aaPanel)" sedang running
4. Klik workflow untuk lihat progress
5. Tunggu sampai selesai (✅ hijau = success, ❌ merah = failed)

### Step 8.4: Verify Deployment

Jika workflow success:

1. Buka `https://pwa.makkuragatama.id`
2. Website sudah update otomatis! 🎉

---

## ✅ PART 9: Verifikasi & Testing

### Checklist Final

Pastikan semua ini berfungsi:

- ✅ Website bisa diakses via HTTPS
- ✅ PM2 status "online"
- ✅ Nginx reverse proxy berfungsi
- ✅ SSL certificate aktif (gembok hijau di browser)
- ✅ GitHub Actions workflow success
- ✅ Auto-deploy bekerja saat push ke main

### Test Auto Deploy

```bash
# Di komputer Anda
cd /Users/makkuragatama/Project/nextjs/ai-project/mkg/fe

# Buat perubahan
nano src/app/page.js
# Ubah sesuatu kecil

# Commit & push
git add .
git commit -m "test: update homepage"
git push origin main

# Check GitHub Actions → tunggu deployment selesai
# Refresh website → perubahan sudah muncul!
```

---

## 🛠️ PART 10: Maintenance & Monitoring

### Commands yang Sering Digunakan

#### Check Status
```bash
ssh www@54.xxx.xxx.xxx
pm2 status
pm2 logs mkg-frontend --lines 50
```

#### Restart Application
```bash
ssh www@54.xxx.xxx.xxx
pm2 restart mkg-frontend
```

#### Pull Latest Code Manual
```bash
ssh www@54.xxx.xxx.xxx
cd /www/wwwroot/pwa.makkuragatama.id
./deploy.sh production
```

#### Check Disk Space
```bash
ssh ubuntu@54.xxx.xxx.xxx
df -h
```

#### Check Memory Usage
```bash
ssh ubuntu@54.xxx.xxx.xxx
free -h
```

### Monitoring di aaPanel

1. Login ke aaPanel
2. **Dashboard** → lihat CPU, Memory, Disk usage
3. **Website** → pwa.makkuragatama.id → **Traffic Statistics**
4. **PM2 Manager** → lihat status aplikasi Node.js

### Backup Strategy

Di aaPanel:
1. **Cron** → **Add Task**
2. Type: **Backup website**
3. Website: `pwa.makkuragatama.id`
4. Frequency: Daily
5. Time: 02:00 AM
6. Keep: Last 7 days

---

## 🆘 Troubleshooting

### Problem 1: Website tidak bisa diakses

**Symptoms:** Error "This site can't be reached"

**Solution:**
```bash
# Check PM2 running
ssh www@54.xxx.xxx.xxx
pm2 status

# If stopped, restart
pm2 restart mkg-frontend

# Check nginx
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Problem 2: GitHub Actions gagal - SSH connection error

**Symptoms:** Workflow error "Permission denied (publickey)"

**Solution:**
1. Regenerate SSH key di EC2 (Step 8.1)
2. Update GitHub Secret `AWS_SSH_KEY` dengan key baru
3. Re-run workflow

### Problem 3: Build gagal - Out of memory

**Symptoms:** "JavaScript heap out of memory"

**Solution:**
```bash
# Tambah swap memory
ssh ubuntu@54.xxx.xxx.xxx
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Atau upgrade EC2 ke t3.medium
```

### Problem 4: Port 3005 already in use

**Symptoms:** PM2 error "port already in use"

**Solution:**
```bash
ssh www@54.xxx.xxx.xxx

# Kill process on port 3005
sudo lsof -ti:3005 | xargs kill -9

# Restart PM2
pm2 delete mkg-frontend
pm2 start ecosystem.config.js --env production
pm2 save
```

### Problem 5: SSL certificate tidak valid

**Symptoms:** "Your connection is not private"

**Solution:**
1. Di aaPanel → Website → pwa.makkuragatama.id → SSL
2. Klik **Let's Encrypt**
3. Re-apply certificate
4. Enable **Force HTTPS**

---

## 📞 Support

Jika ada masalah:

1. Check GitHub Actions logs di repository
2. Check PM2 logs: `ssh www@54.xxx.xxx.xxx && pm2 logs`
3. Check aaPanel error logs
4. Lihat dokumentasi lengkap di `DEPLOYMENT.md`

---

## 🎉 Selesai!

Sekarang Anda punya:
- ✅ Website production di AWS EC2
- ✅ Auto-deploy setiap push ke GitHub
- ✅ SSL certificate (HTTPS)
- ✅ Monitoring via aaPanel
- ✅ PM2 untuk process management
- ✅ Automated backup

**Next time deploy:** Tinggal `git push origin main` dan otomatis deploy! 🚀
