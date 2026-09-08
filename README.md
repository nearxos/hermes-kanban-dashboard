# Hermes Kanban Dashboard

A standalone, self-hosted companion UI for the Kanban service shipped with Hermes Agent. It runs in the browser on the user’s machine and reads/writes the user’s own Hermes service; it does not provide a hosted backend, task database, worker, or plugin registration layer.

## Requirements

- Node.js 20 or newer and npm
- A Hermes Agent installation with its Kanban dashboard API enabled for live mode
- A browser that supports Server-Sent Events (current Chromium, Firefox, or Safari)

The dashboard is tested against the Hermes Kanban API contract documented in [docs/kanban-source-contract.md](docs/kanban-source-contract.md). API compatibility is not guaranteed across arbitrary Hermes versions; verify the endpoint contract before upgrading either component.

## Install and run locally

```bash
git clone https://github.com/nearxos/hermes-kanban-dashboard.git
cd hermes-kanban-dashboard
npm install
npm run check
npm run dev -- --host 127.0.0.1 --port 4173
```

Open <http://127.0.0.1:4173/>. The default bind is loopback. Keep it that way unless the network exposure is intentional and protected by an appropriate reverse proxy/firewall.

### Fixture mode

With no environment variable, the UI uses synthetic, read-only fixture data. This is safe for development and does not contact Hermes.

### Live self-hosted mode

Copy the example environment file and set only the approved local Hermes origin:

```bash
cp .env.example .env.local
```

```env
VITE_HERMES_KANBAN_ORIGIN=http://127.0.0.1:8790
```

The Vite dev/preview proxy maps `/hermes-api` to `127.0.0.1:8790` for local setups. If your service uses another origin, set that origin explicitly and ensure its CORS policy allows the dashboard origin. See [docs/self-hosting.md](docs/self-hosting.md) for the deployment workflow and security boundary.

## Production-like local preview

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4175
```

For a reverse proxy deployment, serve the generated `dist/` assets and route the API/SSE paths to the Hermes service. Static hosting alone provides fixture mode only.

## Security model

- Treat the dashboard as a local-trust application. It can display task bodies, workspace paths, logs, comments, and artifacts returned by Hermes.
- Never put tokens, cookies, credentials, or private keys in `VITE_*` variables; Vite embeds them into client-visible assets.
- Do not expose the dev server or preview publicly without an authenticated, TLS-terminating proxy and deliberate CORS policy.
- Use a disposable board for smoke tests that create or move tasks.

## Scope and roadmap

The current release includes board selection, task creation and movement, assignment, comments, board settings, task detail, run/activity evidence, SSE updates, polling fallback, and fixture fallback. Destructive task deletion and artifact upload are out of scope.

This repository currently integrates as a standalone local web app. No Hermes plugin registration API is assumed or invented here. Native plugin/Desktop registration may be added later after a stable upstream extension contract exists.

## Documentation

- [Self-hosting and deployment](docs/self-hosting.md)
- [Live smoke test](docs/live-smoke-test.md)
- [Source/API contract](docs/kanban-source-contract.md)
