#!/usr/bin/env bash
set -euo pipefail
SERVICE="hermes-kanban-dashboard.service"
WRAPPER="$HOME/.local/bin/hermes-kanban-dashboard"
UNIT="$HOME/.config/systemd/user/$SERVICE"
systemctl --user disable --now "$SERVICE" 2>/dev/null || true
rm -f "$UNIT" "$WRAPPER"
systemctl --user daemon-reload 2>/dev/null || true
printf 'Removed dashboard startup entry. Repository, dist, Hermes Agent, API, boards, tasks, comments, credentials, and user data were left untouched.\n'
