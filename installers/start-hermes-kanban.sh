#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${KANBAN_PORT:-4175}"

if [[ ! -f "$ROOT/dist/index.html" ]]; then
  printf 'Missing dist/index.html. Run npm install && npm run build first.\n' >&2
  exit 1
fi
command -v npm >/dev/null 2>&1 || { printf 'npm is required to serve the dashboard.\n' >&2; exit 1; }

cd "$ROOT"
# This serves the dashboard only. The Hermes Kanban API must be started
# separately using Hermes documentation; do not guess its executable here.
exec npm run preview -- --host 127.0.0.1 --port "$PORT"
