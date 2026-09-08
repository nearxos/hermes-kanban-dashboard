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
- Working dashboard: React/Vite fixture and live Hermes UI with board selection, task cards, detail drawer, comments, and responsive layout
- Hermes adapter increment: typed REST client and URL/error contract tests under `src/adapter/`
- Source integration: optional `VITE_HERMES_KANBAN_ORIGIN` probe with visible connected/degraded state and safe fixture fallback
- Live board integration: configured API board payloads populate cards/metrics; Hermes SSE events and three-second polling refresh the selected board
- Live task detail integration: selected tasks fetch `/tasks/:id` and expose runs, artifacts, comments, and event history in the drawer
- Mutation surface: board creation, task creation, profile assignment, drag-and-drop movement, comments, and board orchestration settings
- Accessibility/test polish: Escape closes the drawer; connection and detail loading states use live status announcements; adapter coverage now includes board/detail payloads
- Product baseline completed: debounced live refreshes, last-sync indicator, responsive no-overflow layout, centered detail drawer, fixture fallback, and verified desktop/mobile browser behavior
- Release hardening: `npm run check` now runs tests, production build, and diff validation; live smoke-test/deployment instructions are documented in `docs/live-smoke-test.md`
- Live lifecycle correction: board synchronization requests `archived=true` so the Archive column is preserved in Hermes-connected mode
- Canonical Hermes project record: verified as `kanban-hermes-dashboard` (`p_88977672`)
- Dedicated Kanban board: created and verified as `kanban-hermes-dashboard`; bound to project `p_88977672`; remains non-current so the active `test` board was not switched

## Active work

Feature implementation is complete for the current scope. Remaining work is release hardening: run disposable-board acceptance checks, decide the deployment target, review uncommitted changes, and create the initial commit.

## Open blockers

- The full Hermes backend suite has five unrelated compatibility failures because the installed compatibility module no longer exposes `kanban_db.active_run`; targeted board/task tests pass.
- The dashboard uses a same-origin `/hermes-api` Vite proxy to avoid browser CORS failures when reaching the local service on port 8790.
- Choose the deployment target before packaging (local static hosting, Hermes desktop plugin surface, or another internal host).
- Create an initial commit after reviewing the uncommitted files.

## Next action

Run the disposable-board live smoke test from `docs/live-smoke-test.md`, then review and commit the implementation.

## Verification commands

```bash
git status --short --branch
git diff --check
```

Use the project README, this status file, and applicable repository rules before implementation.

## Hermes project registration

This folder is intended to become the Hermes project **Kanban Hermes Dashboard**. Register one canonical project record for this absolute path before recurring specialist work; do not create duplicate records for review phases or sessions.

Use this status file as the durable handoff point for future sessions.
