# Hermes Kanban Source Contract

## Discovery status

- Source inspected: local Hermes Agent checkout under the active `HERMES_HOME`.
- Live boards inspected read-only: `default` and `starlink-quota-controller`.
- Both live boards currently report zero tasks.
- No live task records were copied into this project.
- `fixtures/kanban/states.json` contains synthetic contract fixtures for UI and adapter development.

## Storage model

Hermes Kanban is a SQLite-backed board. The default board uses the shared Kanban database; named boards have separate database paths and workspace/log directories.

Core tables confirmed from the local schema:

- `tasks`: logical task identity, title/body, assignee, status, priority, workspace, project, failure counters, current run, model/skills, and block metadata.
- `task_runs`: one row per execution attempt, including profile, lifecycle status, outcome, timing, heartbeat, summary, metadata, and error.
- `task_events`: append-only event stream with task id, run id, kind, payload, and timestamp.
- `task_comments`: durable human/agent comments.
- `task_links`: parent/child dependency edges.
- `task_attachments`: file metadata and stored paths.
- `kanban_notify_subs`: terminal-event notification subscriptions.

## Status values

```text
triage | todo | scheduled | ready | running | blocked | review | done | archived
```

Typed block kinds are:

```text
dependency | needs_input | capability | transient
```

## Existing dashboard API

The shipped Hermes Kanban plugin is mounted under `/api/plugins/kanban/` and exposes:

- `GET /board`
- `GET /tasks/{task_id}`
- `GET /tasks/{task_id}/attachments`
- `GET /attachments/{attachment_id}`
- `GET /tasks/{task_id}/log`
- `GET /tasks/{task_id}` with `runs[]`, `events[]`, `comments[]`, `attachments[]`, links, child results, and diagnostics
- `GET /runs/{run_id}`
- `GET /runs/{run_id}/inspect`
- `GET /workers/active`
- `GET /stats`
- `GET /diagnostics`
- `GET /boards`
- `GET /projects`
- `GET /profiles`
- `GET /config`
- `GET /orchestration`
- `GET /events`
- `GET /events/stream` (SSE)

The same plugin also exposes mutation endpoints used by the dashboard after the live connection is verified:

- `POST /boards`
- `PATCH /boards/{slug}`
- `POST /boards/{slug}/bind-project`
- `POST /boards/{slug}/unbind-project`
- `POST /tasks`
- `PATCH /tasks/{task_id}`
- `POST /tasks/{task_id}/comments`
- `POST /tasks/{task_id}/assign`

The dashboard performs read-after-write refreshes after mutations and retains fixture fallback when the live source is unavailable.

## Important semantics for the dashboard

- `review` is distinct from `blocked`: implementation can be complete while awaiting human review.
- `task_runs` must be preserved as attempt history; do not reduce a task to its latest run.
- `task_events` are append-only and carry `run_id`, allowing the UI to group activity by attempt.
- Worker handoff evidence is structured in run `summary` and `metadata`; common metadata includes `changed_files`, `verification`, dependencies, retry notes, blocked reason, and residual risk.
- `review_requested` is a durable handoff event and may be followed by human approval or requested changes.
- Artifacts and logs need provenance and freshness indicators; paths may disclose local workspace information and should not be exposed beyond the intended local trust boundary.
- The WebSocket is board-pinned at connection time; switching boards should establish a new connection.
- Board and project identity are separate concepts: a board isolates Kanban work, while a Hermes project provides named workspace/folder context and may be bound to a board.

## Source files inspected

- `hermes_cli/kanban_db.py`
- `hermes_cli/kanban_db_connect.py`
- `plugins/kanban/dashboard/plugin_api.py`
- `plugins/kanban/dashboard/manifest.json`
- `website/docs/user-guide/features/kanban.md`
- `tests/plugins/test_kanban_dashboard_plugin.py`
- `tests/hermes_cli/test_kanban_review_lifecycle.py`
