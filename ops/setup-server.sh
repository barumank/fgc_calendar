#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

APP_DIR="/var/www/fightnexus"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYSTEMCTL_BIN="$(command -v systemctl)"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "Expected Git checkout at ${APP_DIR}." >&2
  exit 1
fi
if [[ ! -f /etc/fightnexus/app.env ]]; then
  echo "Expected environment file at /etc/fightnexus/app.env." >&2
  exit 1
fi
if [[ ! -s /root/.ssh/authorized_keys ]]; then
  echo "No root SSH public keys found to grant deployment access." >&2
  exit 1
fi

if ! id -u fightnexus >/dev/null 2>&1; then
  useradd --create-home --home-dir /home/fightnexus --shell /bin/bash fightnexus
fi

install -d -o fightnexus -g fightnexus -m 700 /home/fightnexus/.ssh
touch /home/fightnexus/.ssh/authorized_keys
while IFS= read -r public_key; do
  [[ -n "${public_key}" ]] || continue
  grep -Fqx -- "${public_key}" /home/fightnexus/.ssh/authorized_keys || \
    printf '%s\n' "${public_key}" >> /home/fightnexus/.ssh/authorized_keys
done < /root/.ssh/authorized_keys
chown fightnexus:fightnexus /home/fightnexus/.ssh/authorized_keys
chmod 600 /home/fightnexus/.ssh/authorized_keys

chown -R fightnexus:fightnexus "${APP_DIR}"
install -d -o fightnexus -g fightnexus -m 755 "${APP_DIR}/.next"
chown root:fightnexus /etc/fightnexus/app.env
chmod 640 /etc/fightnexus/app.env

install -o root -g root -m 644 \
  "${PROJECT_ROOT}/ops/fightnexus.service" \
  /etc/systemd/system/fightnexus.service
install -o root -g root -m 644 \
  "${PROJECT_ROOT}/ops/nginx-fightnexus.conf" \
  /etc/nginx/sites-available/fightnexus

printf 'fightnexus ALL=(root) NOPASSWD: %s restart fightnexus.service, %s is-active fightnexus.service\n' \
  "${SYSTEMCTL_BIN}" "${SYSTEMCTL_BIN}" > /etc/sudoers.d/fightnexus
chmod 440 /etc/sudoers.d/fightnexus
visudo -cf /etc/sudoers.d/fightnexus

if [[ -L /etc/nginx/sites-enabled/default ]]; then
  unlink /etc/nginx/sites-enabled/default
elif [[ -e /etc/nginx/sites-enabled/default ]]; then
  echo "Unexpected file at /etc/nginx/sites-enabled/default; refusing to replace it." >&2
  exit 1
fi
ln -sfn /etc/nginx/sites-available/fightnexus /etc/nginx/sites-enabled/fightnexus

systemctl daemon-reload
systemctl enable fightnexus.service
nginx -t
systemctl reload nginx
sudo -u fightnexus test -r /etc/fightnexus/app.env

echo "Server configuration installed. The application service is enabled but not started yet."
