# Live smoke test and deployment

## Local fixture mode

```bash
npm install
npm run check
npm run dev -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/`. With no `VITE_HERMES_KANBAN_ORIGIN`, the dashboard must show `Synthetic source · read-only` and render the five fixture tasks.

## Live read-only mode

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

1. Header reports `Hermes API · read-only`.
2. Board counts and cards come from the Hermes board payload.
3. Selecting a task loads its detail endpoint.
4. Runs, comments, artifacts, and events appear when provided.
5. A live event refreshes the board once after the debounce interval.
6. Stopping the API changes the source state to fixture fallback without breaking the UI.

The client expects the read-only boundary documented in `docs/kanban-source-contract.md`:

```text
GET /api/boards
GET /api/board?include_archived=true
GET /api/tasks/:id
WS  /api/events
```

## Production preview

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4175
```

For a reverse proxy, forward both HTTP API requests and WebSocket upgrades. The dashboard itself performs no mutating API calls.
