# Architecture Decision Record

## Decision

Build the dashboard as a standalone **TypeScript + React + Vite** web application that consumes Hermes's existing Kanban plugin API through a narrow source adapter.

Initial implementation choices:

- **UI:** React 19
- **Build/dev server:** Vite
- **Server-state cache:** TanStack Query
- **Live updates:** native WebSocket client using Hermes's `/events?since=` contract
- **Styling:** CSS modules or local CSS with design tokens; avoid introducing a second component framework until a concrete need exists
- **Validation:** TypeScript types at the adapter boundary plus runtime validation for network payloads before cache insertion
- **Test:** Vitest and Testing Library for adapter/state/UI invariants; Playwright later for browser acceptance flows
- **Deployment:** static assets served by an existing Hermes-compatible web host; no new task database or dispatcher

## Why this fits Hermes

The local Hermes Agent source already has a mature Kanban dashboard plugin and REST/WebSocket contract. Reusing that contract avoids duplicating task lifecycle semantics, worker dispatch, retries, comments, attachments, and board isolation.

Hermes Desktop also establishes the relevant client patterns:

- React + TypeScript
- Vite
- TanStack Query
- backend-owned state with renderer-side caching
- explicit WebSocket invalidation
- narrow feature-local adapters
- optimistic writes only where the product explicitly enables mutation

The first version of this project should be **read-only**. It should display review evidence rather than mutate the board until the adapter and safety model are verified.

## Adapter boundary

The UI must not call arbitrary URLs or know raw endpoint paths. Create one adapter with these responsibilities:

1. Resolve the configured Hermes origin and board scope.
2. Fetch and validate board, task detail, run, worker, stats, diagnostics, profile, project, and artifact responses.
3. Normalize epoch-second timestamps and event payloads without losing source values.
4. Subscribe to the board-pinned event stream and invalidate or merge affected queries.
5. Expose explicit connection states: loading, connected, stale/reconnecting, and exhausted recovery.
6. Preserve source IDs exactly: board slug, task ID, run ID, event ID, attachment ID.
7. Keep filesystem paths and raw logs inside the intended local trust boundary.

Suggested module shape:

```text
src/
  adapter/
    hermes-kanban-client.ts
    hermes-kanban-types.ts
    transport.ts
    validation.ts
    websocket.ts
  features/
    board/
    task-detail/
    review/
    workers/
  app/
  test/
```

## MVP surface

Read-only MVP acceptance target:

- board selector and board summary
- lifecycle columns and task cards
- task detail drawer
- run history with retry lineage
- event/activity stream grouped by run
- worker summary and liveness indicators
- review evidence: changed files, verification commands/results, artifacts, residual risk, and failure summary
- dependency links and blocked reason
- explicit stale/reconnecting state
- synthetic fixture mode for development when no live tasks exist

Mutation controls are intentionally out of scope for MVP:

- create/update/delete tasks
- drag-and-drop status changes
- comments
- reassignment/reclaim
- artifact upload
- approval or request-changes actions

## Rejected alternatives

### Forking Hermes's Kanban database

Rejected because it would create a second task authority and diverge on retries, events, board isolation, and worker ownership.

### Building a new backend/task engine

Rejected because Hermes already owns orchestration and exposes the required read model.

### Embedding the existing Hermes Desktop plugin

Rejected for this repository because the goal is an independent browser dashboard. The Desktop plugin remains a reference implementation for UI semantics and API usage.

### Adding a generic plugin framework

Rejected until more than one real consumer proves the need. Keep the adapter narrow and feature-local.

## Risks and mitigations

- **API drift:** validate payloads, include a contract fixture suite, and show a degraded state instead of silently rendering partial data.
- **Event loss:** reconnect with `since` cursor, then refetch authoritative board/task detail.
- **Stale state:** use query invalidation plus bounded reconnect retries; never imply live state after the socket is lost.
- **Sensitive paths/logs:** redact or constrain display/export and never write credentials to project files.
- **Read/write confusion:** ship no mutation endpoints or controls in the MVP adapter.

## Verification gates

Before implementation proceeds beyond scaffolding:

1. Dedicated Hermes board is created and bound from a normal non-delegated session.
2. Adapter contract tests pass against synthetic fixtures.
3. The app renders all fixture lifecycle states.
4. WebSocket disconnect/reconnect behavior is tested.
5. A human reviews the first task-detail and review-evidence flow.
