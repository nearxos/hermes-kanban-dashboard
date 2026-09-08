# Live smoke test and deployment

## Local fixture mode

```bash
npm install
npm run check
npm run dev -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/`. With no `VITE_HERMES_KANBAN_ORIGIN`, the dashboard must show `Synthetic source · read-only` and render the five fixture tasks.

## Live mode

Create an untracked local environment file from `.env.example`:

```bash
cp .env.example .env.local
```

Set only the approved Hermes origin:

```env
VITE_HERMES_KANBAN_ORIGIN=http://<approved-hermes-host>
```

Do not place credentials, cookies, tokens, or private keys in this repository or any Vite-exposed variable. Vite variables are client-visible.

Run the dashboard and verify:

1. Header reports `Hermes API · read-only` for the source connection; mutation controls are available only after the API connection succeeds.
2. Board counts and cards come from the selected Hermes board.
3. Selecting a task loads its detail endpoint.
4. Runs, comments, artifacts, and events appear when provided.
5. A live event refreshes the board, and the three-second polling fallback updates the sync timestamp without a page reload.
6. Create a disposable task, drag it between columns, and verify the destination column and backend status.
7. Add a comment in the task drawer and verify it appears after read-back.
8. Open Board settings, save a non-sensitive orchestration default, and verify it persists.
9. Stopping the API changes the source state to fixture fallback without breaking the UI.

The client uses the following Hermes source and mutation contract:

```text
GET   /api/boards
GET   /api/board?include_archived=true
GET   /api/tasks/:id
GET   /api/projects
SSE   /api/events/stream
POST  /api/boards
POST  /api/boards/:slug/bind-project
POST  /api/boards/:slug/unbind-project
PATCH /api/boards/:slug
POST  /api/tasks
PATCH /api/tasks/:id
POST  /api/tasks/:id/comments
POST  /api/tasks/:id/assign
```

## Production preview

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4175
```

For a reverse proxy, forward both HTTP API requests and WebSocket upgrades. The dashboard itself performs no mutating API calls.
