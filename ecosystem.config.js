module.exports = {
  apps: [
    {
      name: 'mkg-frontend',
      script: '.next/standalone/server.js',
      interpreter: 'node',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3006,
      },
      error_file: '/www/wwwlogs/mkg-frontend-error.log',
      out_file: '/www/wwwlogs/mkg-frontend-out.log',
      log_file: '/www/wwwlogs/mkg-frontend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],

  deploy: {
    production: {
      user: 'www',
      host: process.env.AWS_HOST || 'pwa.makkuragatama.id',
      ref: 'origin/main',
      repo: 'https://github.com/ayatekapoetra/mkgpwa.git',
      path: '/www/wwwroot/pwa.makkuragatama.id',
      'post-deploy': 'npm ci --legacy-peer-deps && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': '',
      'post-setup': 'npm ci --legacy-peer-deps && npm run build && pm2 start ecosystem.config.js --env production',
      ssh_options: 'StrictHostKeyChecking=no',
    },
    staging: {
      user: 'www',
      host: process.env.AWS_HOST_STAGING || 'staging.makkuragatama.id',
      ref: 'origin/develop',
      repo: 'https://github.com/ayatekapoetra/mkgpwa.git',
      path: '/www/wwwroot/staging.makkuragatama.id',
      'post-deploy': 'npm ci --legacy-peer-deps && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-deploy-local': '',
      'post-setup': 'npm ci --legacy-peer-deps && npm run build && pm2 start ecosystem.config.js --env staging',
      ssh_options: 'StrictHostKeyChecking=no',
    },
  },
};
