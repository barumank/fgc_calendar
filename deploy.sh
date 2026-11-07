#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/var/www/fightnexus"
cd "$APP_DIR"

git pull --ff-only origin main
npm ci --legacy-peer-deps

set -a
source /etc/fightnexus/app.env
set +a

npx prisma generate
npx prisma db push
npm run build

sudo systemctl restart fightnexus.service
sudo systemctl is-active fightnexus.service
echo "FightNexus deployed successfully."
