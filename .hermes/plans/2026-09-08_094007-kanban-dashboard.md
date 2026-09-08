# Hermes Kanban Dashboard Product and Implementation Plan

> **For Hermes:** Use the project-initialization skill before beginning work, then use the Kanban orchestration workflow for substantial implementation.

**Goal:** Build a self-hosted containerized dashboard that makes Hermes Kanban work easy to scan, understand, review, and safely approve—especially the work completed by autonomous workers.

**Architecture:** Start with a read-oriented dashboard over Hermes Kanban state and worker evidence. Separate the presentation layer from a small adapter/API layer so the UI does not depend directly on unstable storage or CLI details. Add mutations only after read models, authorization boundaries, and read-after-write verification are defined.

**Tech Stack:** To be selected after a short architecture spike. Prefer a low-operations container deployment, a responsive web UI, a small typed API, and a persistent local store only when the Hermes source data is not sufficient.

---

## 1. Research synthesis

This is a multi-agent MOA synthesis: two independent research passes were run, then their overlapping recommendations were combined. Direct Hermes web search and extraction were unavailable because the configured Nous web gateway was unreachable; the agents verified several public pages with direct HTTP requests. Treat the source coverage as useful but incomplete and re-check the selected projects during the architecture spike.

### Patterns worth adopting

| Reference | Adopt | Why it helps Hermes review | Do not copy wholesale |
|---|---|---|---|
| Plane | Focused project/work-item navigation, compact list/board views, filters, cycles and relations | Keeps the daily view fast and scannable instead of turning every task into a log dump | Generic product/project management breadth |
| OpenProject | Structured work packages, typed fields, status/workflow transitions, activity and audit history | Makes state changes and ownership explainable and reviewable | Heavy enterprise planning surface |
| Taiga | Hierarchy from larger work to executable tasks, Scrum/Kanban concepts, comments, attachments and configurable states | Maps well to initiative → task → worker run → review evidence | Full Scrum ceremony model if Hermes does not need it |
| Vikunja | Lightweight task model, labels, filters and self-hosting orientation | Good baseline for a simple local container and fast personal workflow | Its simpler task model does not solve agent execution evidence |
| GitHub/GitLab reviews | Comment / approve / request-changes states, grouped review submission, line-level feedback and merge gating | Gives the reviewer an explicit decision surface rather than an ambiguous task comment | Git-centric concepts where no commit or diff exists |
| OpenHands | Worker execution context, transcript/output, changed files and artifacts | Lets a reviewer see what the worker actually did, not only its final status | A full coding-agent runtime inside this dashboard |
| LangSmith | Trace/run views, metadata, feedback and evaluation-oriented inspection | Supports evidence-first review and comparison of attempts | Provider-specific observability complexity |
| Temporal | Event history, parent/retry relationships, attempt timing and failure categories | Makes retries and partial progress visible and prevents “last run wins” data loss | Distributed workflow-engine scope |

### Product thesis

The differentiator should be a **review-first task detail view**, not another generic Kanban board. Every task should answer four questions quickly:

1. What was requested?
2. What did the worker do?
3. What changed and what evidence supports it?
4. What decision or action is needed from the human reviewer?

### Sources

- Plane repository: https://github.com/makeplane/plane
- Plane documentation: https://docs.plane.so/
- Vikunja repository: https://github.com/go-vikunja/vikunja
- Vikunja official site: https://vikunja.io/
- OpenProject repository: https://github.com/opf/openproject
- OpenProject documentation: https://www.openproject.org/docs/
- Taiga backend repository: https://github.com/taigaio/taiga-back
- Taiga frontend repository: https://github.com/taigaio/taiga-front
- Taiga documentation: https://docs.taiga.io/
- GitHub pull-request reviews: https://docs.github.com/en/pull-requests/reference/pull-request-reviews
- GitHub Actions: https://docs.github.com/en/actions
- GitHub Projects: https://docs.github.com/en/issues/planning-and-tracking-with-projects
- GitLab merge-request reviews: https://docs.gitlab.com/user/project/merge_requests/reviews/
- OpenHands introduction: https://docs.openhands.dev/overview/introduction
- OpenHands repository: https://github.com/All-Hands-AI/OpenHands
- LangSmith observability concepts: https://docs.langchain.com/langsmith/observability-concepts
- LangSmith evaluation: https://docs.langchain.com/langsmith/evaluation
- Temporal event history: https://docs.temporal.io/workflow-execution/event-history
- Temporal retry policies: https://docs.temporal.io/encyclopedia/retry-policies

---

## 2. Proposed user experience

### A. Command center / inbox

The landing page should prioritize attention, not merely show columns.

- “Needs my review” queue with explicit reason and age.
- Running, blocked, failed, completed, and awaiting-review counts.
- Stale-run and no-heartbeat indicators.
- Recent activity stream with project, task, worker, event, and timestamp.
- Saved filters such as “failed since yesterday”, “awaiting approval”, and “changed files present”.
- Keyboard-friendly quick navigation and a dense/comfortable display toggle.

**Benefit:** The user can find the next decision without scanning every board column.

### B. Board and list views

- Board for flow and bottleneck recognition.
- List/table for sorting, filtering, bulk triage, and comparing workers.
- Optional hierarchy: project → parent task → child task/run.
- Clear status, assignee/worker, priority, age, retry count, and review state on each card.
- Preserve filters in the URL so views are shareable and reproducible.

**Benefit:** Board view answers “where is work stuck?” while list view answers “which tasks require attention?”

### C. Review-first task detail

Use a split or tabbed layout with a persistent review summary.

1. **Request:** goal, context, constraints, acceptance criteria, dependencies.
2. **Decision banner:** review state, recommended next action, blocker, and why it is surfaced.
3. **Worker summary:** concise result, claims, warnings, and residual risk.
4. **Run history:** attempts, parent/retry relationship, trigger, duration, status, failure category, and timestamps.
5. **Timeline:** immutable event stream for dispatch, heartbeat, comments, tool phases, state changes, review decisions, and completion.
6. **Changes:** changed files, diff/stat summary, commit or revision, and artifact links.
7. **Verification:** exact commands, exit codes, test results, health checks, and evidence freshness.
8. **Artifacts:** logs, screenshots, reports, and generated files with worker, run, timestamp, hash/revision, and current/superseded label.
9. **Conversation:** comments anchored to the task, run, artifact, or diff line where possible.
10. **Actions:** approve, request changes, block, retry, resume, or archive—with confirmation, scope, and read-back.

**Benefit:** A reviewer can establish provenance and make a safe decision without opening several unrelated tools.

### D. Review decision flow

- A task enters `awaiting_review` only when required evidence is present.
- Show acceptance criteria as a checklist with evidence links.
- Reviewer choices: approve, request changes, block/needs-input, or reject as invalid.
- Require a reason for request-changes, block, and rejection.
- Make the next state and side effect explicit before mutation.
- Keep review decisions in the timeline and do not overwrite previous decisions.
- Show “what changed since my last review”.

**Benefit:** Review becomes a controlled, auditable workflow rather than a free-form comment exchange.

### E. Safe recovery controls

- Retry only a failed or incomplete attempt and show what will be retried.
- Resume from the latest verified checkpoint when supported.
- Do not hide previous attempts; show attempt lineage.
- Warn when a retry could duplicate work or touch a shared workspace.
- Require approval for destructive or externally visible actions.
- Read back the task/run state after each mutation.

**Benefit:** The dashboard helps recover work without encouraging blind retries.

### F. Explainability and accessibility

- Plain-language labels for worker state and failure category.
- Relative time plus exact timestamp on hover/detail.
- Color is supplemental; use icons/text for status and severity.
- Search across task title, worker, project, failure, artifact, and commit.
- Responsive layout that preserves the review summary on narrow screens.
- Loading, empty, stale, partial, and error states are first-class UI states.

---

## 3. MVP scope

### Include

- Read-only connection to Hermes Kanban data.
- Dashboard/inbox for review-needed, blocked, failed, running, and stale tasks.
- Board and list views.
- Task detail with request, status, worker summary, run history, timeline, changes, artifacts, and verification.
- Basic search, filters, saved views, and deep links.
- Container image plus local configuration and health endpoint.
- Fixture-backed demo mode for UI development and deterministic tests.

### Defer

- Full task creation/editing.
- Arbitrary workflow customization.
- Multi-user identity/SSO and complex permissions.
- Remote deployment orchestration.
- Cost accounting unless Hermes already exposes reliable data.
- Replacing Hermes Kanban as the source of truth.
- Real-time streaming until polling/read models are stable.

### Non-goals

- Building a generic Jira/Linear competitor.
- Embedding an autonomous agent runtime.
- Hiding raw evidence behind an AI-generated summary.
- Treating worker completion messages as proof without artifacts or verification.

---

## 4. Proposed delivery phases

### Phase 0 — Discovery and contract

- Inspect Hermes Kanban storage/API/CLI and identify the minimum read contract.
- Capture representative fixtures: queued, running, blocked, failed, retried, awaiting-review, and completed tasks.
- Define canonical event, run, artifact, verification, review, and task schemas.
- Decide whether a local read-model database is necessary.
- Record architecture decision and source compatibility risks.

**Exit:** fixture set and versioned read contract exist; no UI implementation has started against guessed data.

### Phase 1 — Review model and adapter

- Implement the adapter/API around the confirmed Hermes source.
- Normalize task state, events, attempts, artifacts, and verification evidence.
- Add freshness, provenance, superseded-artifact, and partial-data flags.
- Add fixture mode and contract tests.

**Exit:** API responses are deterministic, provenance-preserving, and tested against all fixture states.

### Phase 2 — Review inbox and task detail

- Build the review-needed inbox and attention counts.
- Build the review-first task detail view.
- Implement timeline, run history, evidence checklist, changes/artifacts, and comments as read-only surfaces.
- Add deep links and URL-persisted filters.

**Exit:** a reviewer can inspect a fixture task end-to-end without opening another dashboard.

### Phase 3 — Board/list usability

- Add board and table views.
- Add search, filters, saved views, density toggle, keyboard navigation, and responsive behavior.
- Add stale/partial/error/empty states.
- Run an evidence-based usability review focused on review completion time and missed-risk prevention.

**Exit:** the dashboard is usable for daily triage and review, not just visually complete.

### Phase 4 — Container packaging and dogfooding

- Add Dockerfile, compose example, configuration documentation, health check, and persistent-data guidance if needed.
- Run locally on the PC with fixture mode, then against a non-destructive Hermes read path.
- Capture screenshots and record defects.
- Verify the image starts cleanly, health responds, and the UI shows current source state.

**Exit:** a reproducible local container can be started and independently verified.

### Phase 5 — Carefully scoped mutations

Only after read-only MVP acceptance:

- Add one mutation at a time, starting with review decisions or comments.
- Define the mutation envelope, confirmation UX, audit event, and read-after-write check.
- Add authorization and failure recovery before enabling the next action.

**Exit:** each mutation has explicit safety, verification, and rollback behavior.

---

## 5. Technical decisions to make next

1. What Hermes Kanban API, database, event stream, or CLI output is the source of truth?
2. Is the dashboard allowed to write to Hermes, or is MVP read-only?
3. Which worker evidence is available today: summaries, heartbeats, logs, diffs, artifacts, test output, and commit IDs?
4. Should the container mount a project workspace, consume an API, or both?
5. Which browser/device sizes matter for daily use?
6. Is single-user local access sufficient for MVP?
7. Which review actions are safe to expose first?
8. What is the minimum data retention and privacy boundary for worker logs and artifacts?
9. Which stack best fits the source contract and local container constraints?

---

## 6. Candidate acceptance criteria for MVP

- A reviewer can identify the highest-priority review-needed task from the landing page.
- A task detail page shows request, worker result, attempt lineage, timeline, changed files/artifacts, verification evidence, and residual risk together.
- The UI distinguishes worker claims from verified evidence and stale/superseded artifacts.
- Failed and retried attempts remain visible instead of being replaced by the latest attempt.
- Every fixture state renders a deliberate loading, empty, partial, stale, or error state where applicable.
- Filters and deep links reproduce the same review queue after reload.
- The container starts locally from documented commands and exposes a working health check.
- No mutation is enabled without explicit scope, confirmation, audit event, and read-after-write verification.
- Tests and checks pass, and a usability review records findings with screenshots or equivalent evidence.

---

## 7. Risks and mitigations

- **Unstable Hermes internals:** isolate them behind an adapter and version the read contract.
- **Evidence volume:** paginate and summarize, but preserve links to raw evidence.
- **False confidence from summaries:** always show provenance, freshness, and raw evidence access.
- **Retry duplication:** display attempt lineage and require scoped retry confirmation.
- **Workspace contention:** show workspace/branch ownership and block unsafe concurrent actions.
- **Container permissions:** document read-only mounts first and avoid broad host access.
- **Scope creep:** keep generic project-management features deferred until review workflow proves its value.
- **Web research coverage:** re-check primary sources when the web gateway is available; current research includes verified direct HTTP checks but not a complete search sweep.

---

## Verification plan

Before implementation begins:

```bash
git status --short --branch
git diff --check
```

During implementation:

```text
Run adapter contract tests against all fixtures.
Run frontend unit/component tests.
Run accessibility and responsive checks.
Build the container image.
Start the container in fixture mode.
GET /health and verify the expected status and fields.
Exercise each MVP acceptance criterion from a clean browser session.
```

Before enabling mutations:

```text
Capture state before.
Perform one narrowly scoped action.
Read back the exact target.
Verify the audit/timeline event.
Verify the UI reflects the new state.
Document rollback.
```
