#!/bin/sh
set -eu
PLIST="$HOME/Library/LaunchAgents/io.hermes.kanban-dashboard.plist"
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || launchctl unload "$PLIST" 2>/dev/null || true
rm -f "$PLIST"
printf 'Removed dashboard startup entry. Repository, dist, Hermes Agent, API, boards, tasks, comments, credentials, and user data were left untouched.\n'
