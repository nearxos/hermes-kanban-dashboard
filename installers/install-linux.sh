#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$HOME/.local/bin" "$HOME/.config/systemd/user"
cat > "$HOME/.local/bin/hermes-kanban-dashboard" <<EOF
#!/usr/bin/env bash
exec "$ROOT/installers/start-hermes-kanban.sh"
EOF
chmod +x "$HOME/.local/bin/hermes-kanban-dashboard"
cat > "$HOME/.config/systemd/user/hermes-kanban-dashboard.service" <<EOF
[Unit]
Description=Hermes Kanban Dashboard (dashboard only)
After=network-online.target
[Service]
Type=simple
WorkingDirectory=$ROOT
ExecStart=$HOME/.local/bin/hermes-kanban-dashboard
Restart=on-failure
[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now hermes-kanban-dashboard.service
printf 'Installed dashboard service: http://127.0.0.1:4175\n'
printf 'Start the Hermes Kanban API separately using Hermes documentation.\n'
