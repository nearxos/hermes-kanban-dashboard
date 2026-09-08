# Self-hosting workflow

This project is a static frontend companion. Hermes Agent remains the authority for boards, tasks, runs, events, comments, and files.

## First run

1. Install and start Hermes Agent’s Kanban service using its own documentation.
2. Confirm the service is reachable from the same machine and note its HTTP origin.
3. Clone this repository and run `npm install`.
4. Start the dashboard on loopback with `npm run dev -- --host 127.0.0.1 --port 4173`.
5. Leave `VITE_HERMES_KANBAN_ORIGIN` unset for fixture mode, or set it in an untracked `.env.local` for live mode.
6. Run the checks and then follow [live-smoke-test.md](live-smoke-test.md) against a disposable board.

## Local deployment

Build with `npm run build`, then serve `dist/` using `npm run preview -- --host 127.0.0.1 --port 4175` or an equivalent local static server. A production reverse proxy must forward the API routes and the `/api/events/stream` SSE connection to Hermes; otherwise the page is only a static fixture preview.

The checked-in Vite proxy target is `http://127.0.0.1:8790`, matching the documented local Hermes default used by this project. Change the target in local configuration when your Hermes service listens elsewhere; do not commit machine-specific endpoints.

## Compatibility

The client expects the REST and SSE routes listed in the source contract. The dashboard is versioned independently from Hermes Agent, so upgrades should be validated by running `npm run check` and the live smoke test. An incompatible response should be treated as a release blocker rather than worked around by exposing raw or unvalidated data.

## Security boundary

Keep both services on loopback unless remote access is required. The browser receives all data returned by Hermes, including potentially sensitive workspace paths and logs. Do not place authentication material in Vite environment variables or commit `.env.local`. If remote access is necessary, use an authenticated HTTPS reverse proxy, restrictive CORS, and network controls.

## Integration status

There is no documented Hermes plugin registration API used by this release. Installation is intentionally standalone; future native registration should follow an upstream-supported contract rather than relying on private Hermes internals.
