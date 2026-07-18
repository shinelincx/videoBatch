#!/usr/bin/env bash
set -Eeuo pipefail

backend_root=/opt/video-publish-admin
current_jar="$backend_root/video-publish-admin.jar"
old_config=$(mktemp)
env_file=/etc/sysconfig/video-publish-admin
nginx_config=/usr/local/nginx/conf/vhost/video-publish.conf
nginx_backup=$(mktemp)

cleanup() {
  rm -f "$old_config" "$nginx_backup"
}
trap cleanup EXIT

test -f /tmp/video-publish-admin.service
test -f /tmp/video-publish-admin.env
test -f /tmp/video-publish.conf
test -f "$current_jar"

unzip -p "$current_jar" BOOT-INF/classes/application.yml > "$old_config"

datasource_password=$(sed -n -E 's/^    password:[[:space:]]*(.*)$/\1/p' "$old_config" | head -n 1)
redis_password=$(sed -n -E 's/^      password:[[:space:]]*(.*)$/\1/p' "$old_config" | head -n 1)
aes_key=$(awk '/^aes:/{in_aes=1; next} in_aes && /^  key:/{sub(/^[^:]*:[[:space:]]*/, ""); print; exit}' "$old_config")
aes_iv=$(awk '/^aes:/{in_aes=1; next} in_aes && /^  iv:/{sub(/^[^:]*:[[:space:]]*/, ""); print; exit}' "$old_config")
aes_sign_key=$(awk '/^aes:/{in_aes=1; next} in_aes && /^  signKey:/{sub(/^[^:]*:[[:space:]]*/, ""); print; exit}' "$old_config")

test -n "$datasource_password"
test -n "$aes_key"
test -n "$aes_iv"
test -n "$aes_sign_key"

install -m 0644 /tmp/video-publish-admin.service /etc/systemd/system/video-publish-admin.service
{
  cat /tmp/video-publish-admin.env
  printf 'DATASOURCE_PASSWORD=%q\n' "$datasource_password"
  printf 'REDIS_PASSWORD=%q\n' "$redis_password"
  printf 'AES_KEY=%q\n' "$aes_key"
  printf 'AES_IV=%q\n' "$aes_iv"
  printf 'AES_SIGN_KEY=%q\n' "$aes_sign_key"
} > "$env_file"
chmod 600 "$env_file"

cp "$nginx_config" "$nginx_backup"
install -m 0644 /tmp/video-publish.conf "$nginx_config"
if ! /usr/local/nginx/sbin/nginx -t; then
  cp "$nginx_backup" "$nginx_config"
  exit 1
fi

systemctl daemon-reload
systemctl enable video-publish-admin
