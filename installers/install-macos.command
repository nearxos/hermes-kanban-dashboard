#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$HOME/Library/LaunchAgents/io.hermes.kanban-dashboard.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>Label</key><string>io.hermes.kanban-dashboard</string><key>ProgramArguments</key><array><string>$ROOT/installers/start-hermes-kanban.sh</string></array><key>RunAtLoad</key><true/><key>KeepAlive</key><true/></dict></plist>
EOF
chmod +x "$ROOT/installers/start-hermes-kanban.sh"
launchctl unload "$HOME/Library/LaunchAgents/io.hermes.kanban-dashboard.plist" 2>/dev/null || true
launchctl load "$HOME/Library/LaunchAgents/io.hermes.kanban-dashboard.plist"
printf 'Installed dashboard startup: http://127.0.0.1:4175\n'
printf 'Start the Hermes Kanban API separately using Hermes documentation.\n'
