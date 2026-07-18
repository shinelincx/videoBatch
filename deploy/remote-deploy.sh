#!/usr/bin/env bash
set -Eeuo pipefail

release_id="${1:?release id is required}"
archive_dir="${2:-/tmp}"
backend_root="/opt/video-publish-admin"
frontend_root="/opt/video-publish-admin-www"
backend_archive="$archive_dir/video-publish-admin-$release_id.jar"
frontend_archive="$archive_dir/video-publish-admin-www-$release_id.tar.gz"
backend_release="$backend_root/releases/$release_id"
frontend_release="$frontend_root/releases/$release_id"

test -f "$backend_archive"
test -f "$frontend_archive"
test -f /etc/systemd/system/video-publish-admin.service

install -d -m 0755 "$backend_release" "$frontend_release"
install -m 0644 "$backend_archive" "$backend_release/video-publish-admin.jar"
tar --extract --gzip --file="$frontend_archive" --directory="$frontend_release"
test -f "$frontend_release/index.html"

previous_backend="$(readlink -f "$backend_root/current" || true)"
previous_frontend="$(readlink -f "$frontend_root/current" || true)"

ln -sfn "$backend_release" "$backend_root/current"
ln -sfn "$frontend_release" "$frontend_root/current"
systemctl daemon-reload

if ! systemctl restart video-publish-admin; then
  test -n "$previous_backend" && ln -sfn "$previous_backend" "$backend_root/current"
  test -n "$previous_frontend" && ln -sfn "$previous_frontend" "$frontend_root/current"
  systemctl restart video-publish-admin || true
  exit 1
fi

for attempt in $(seq 1 15); do
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:8080/ >/dev/null; then
    if /usr/local/nginx/sbin/nginx -t && /usr/local/nginx/sbin/nginx -s reload; then
      rm -f "$backend_archive" "$frontend_archive" "$archive_dir/video-publish-admin-deploy-$release_id.sh"
      exit 0
    fi
    break
  fi
  sleep 2
done

test -n "$previous_backend" && ln -sfn "$previous_backend" "$backend_root/current"
test -n "$previous_frontend" && ln -sfn "$previous_frontend" "$frontend_root/current"
systemctl restart video-publish-admin || true
exit 1
