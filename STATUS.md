# Kanban Hermes Dashboard — Project Status

Updated: 2026-09-08

## Purpose

Custom Kanban dashboard for Hermes Agent.

## Current state

This status file establishes the Hermes project handoff point. The repository state must be inspected at the start of each session; this file does not assume that existing working-tree changes are part of a new task.

## Last verified

- Project path: `/home/nearxos/Projects/kanban-hermes-dashboard`
- Git repository: initialized on branch `main`
- Root-level project files: `IDEA.md`, `README.md`, `.gitignore`, `STATUS.md`
- Repository changes: inspect with `git status --short --branch` before work
- Implementation stack and architecture: selected; see `docs/architecture-decision-record.md`
- Working dashboard scaffold: React/Vite fixture-backed read-only UI; `npm run build` passes
- Browser verification: local Vite page rendered lifecycle board and task evidence drawer successfully
- Task details UX: centered modal window, widened to 720px with viewport-safe max height
- Dependency flow UX: directional SVG connectors with animated flow dots between linked tasks
- Hermes adapter increment: typed REST client and URL/error contract tests added under `src/adapter/`; fixture mode remains the active UI source
- Source integration: optional `VITE_HERMES_KANBAN_ORIGIN` probe with visible connected/degraded state and safe fixture fallback
- Live board integration: configured API board payloads now populate cards/metrics; WebSocket events refresh the board with bounded reconnects
- Live task detail integration: selected tasks fetch `/tasks/:id` and expose runs, artifacts, comments, and event history in the drawer
- Accessibility/test polish: Escape closes the drawer; connection and detail loading states use live status announcements; adapter coverage now includes board/detail payloads
- Product baseline completed: debounced live refreshes, last-sync indicator, responsive no-overflow layout, centered detail drawer, fixture fallback, and verified desktop/mobile browser behavior
- Release hardening: `npm run check` now runs tests, production build, and diff validation; live smoke-test/deployment instructions are documented in `docs/live-smoke-test.md`
- Live lifecycle correction: board synchronization requests `archived=true` so the Archive column is preserved in Hermes-connected mode
- Canonical Hermes project record: verified as `kanban-hermes-dashboard` (`p_88977672`)
- Dedicated Kanban board: pending; creation was blocked by the active delegated-child mutation guard

## Active work

Product baseline is complete. The next phase is live-environment validation and release hardening: confirm the Hermes read-only API/WebSocket payloads, configure the endpoint locally, and package the dashboard for its intended deployment target.

## Open blockers

- The local Hermes Kanban service requires `PyYAML` in its virtual environment; without it, `/api/board` raised `ModuleNotFoundError: No module named 'yaml'`. Installed `PyYAML 6.0.3` with `uv` and restarted the service; `/api/board` now returns 200.
- The dashboard uses a same-origin `/hermes-api` Vite proxy to avoid browser CORS failures when reaching the local service on port 8790.
- Create and bind the dedicated `kanban-hermes-dashboard` board from a non-delegated Hermes session; do not switch the current `starlink-quota-controller` board.
- Choose the deployment target before packaging (local static hosting, Hermes desktop plugin surface, or another internal host).
- Create an initial commit after reviewing the uncommitted files.

## Next action

Run a read-only diagnosis of the local Kanban service’s `/api/board` HTTP 500, then rerun the live smoke test; do not mutate boards or tasks from this dashboard session.

## Verification commands

```bash
git status --short --branch
git diff --check
```

Use the project README, this status file, and applicable repository rules before implementation.

## Hermes project registration

This folder is intended to become the Hermes project **Kanban Hermes Dashboard**. Register one canonical project record for this absolute path before recurring specialist work; do not create duplicate records for review phases or sessions.

Use this status file as the durable handoff point for future sessions.
