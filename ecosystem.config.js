module.exports = {
  apps: [
    {
      name: 'mkg-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
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
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
    },
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'pwa.makkuragatama.id',
      ref: 'origin/main',
      repo: 'git@github.com:ayatekapoetra/mkgpwa.git',
      path: '/var/www/mkg-frontend',
      'post-deploy': 'npm ci --legacy-peer-deps && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': '',
      'post-setup': '',
    },
    staging: {
      user: 'root',
      host: 'staging.makkuragatama.id',
      ref: 'origin/develop',
      repo: 'git@github.com:ayatekapoetra/mkgpwa.git',
      path: '/var/www/mkg-frontend-staging',
      'post-deploy': 'npm ci --legacy-peer-deps && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-deploy-local': '',
      'post-setup': '',
    },
  },
};
