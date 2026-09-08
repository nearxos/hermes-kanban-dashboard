import fixture from '../../fixtures/kanban/states.json'
import { createHermesClient, type HermesConnectionState, type HermesKanbanClient, type HermesTask } from './hermes-kanban-client'

export type DashboardTask = {
  id: string
  title: string
  body?: string | null
  status: string
  assignee?: string | null
  workspace_path?: string | null
  links: { parents: string[]; children: string[] }
  verification: string[]
  residual_risk: string[]
  runs: Array<{ id: number; profile?: string | null; status: string; outcome?: string | null; summary?: string | null; error?: string | null }>
  comments: Array<{ id: number; author: string; body: string; created_at?: number }>
  artifacts: Array<{ id: number; filename: string; provenance?: string; state?: string }>
  events: Array<{ id: number; run_id?: number | null; kind: string; payload?: unknown; created_at?: number }>
}

export type DashboardSource = { client: HermesKanbanClient | null; label: string; state: HermesConnectionState }

export function configuredHermesOrigin(): string | null {
  const origin = import.meta.env.VITE_HERMES_KANBAN_ORIGIN
  return typeof origin === 'string' && origin.trim() ? origin.trim() : null
}

export function fixtureData(): DashboardTask[] {
  return (fixture.tasks as unknown as Array<Partial<DashboardTask>>).map(task => ({
    ...task,
    links: task.links ?? { parents: [], children: [] },
    verification: task.verification ?? [],
    residual_risk: task.residual_risk ?? [],
    runs: task.runs ?? [],
    comments: task.comments ?? [],
    artifacts: task.artifacts ?? [],
    events: task.events ?? []
  })) as DashboardTask[]
}

function normalizeTask(task: HermesTask): DashboardTask {
  return {
    id: task.id,
    title: task.title || task.id,
    body: task.body,
    status: task.status,
    assignee: task.assignee,
    workspace_path: task.workspace_path,
    links: task.links ?? { parents: [], children: [] },
    verification: task.verification ?? [],
    residual_risk: task.residual_risk ?? [],
    runs: (task.runs ?? []).map(run => ({ id: run.id, profile: run.profile, status: run.status, outcome: run.outcome, summary: run.summary, error: run.error })),
    comments: [],
    artifacts: [],
    events: []
  }
}

export async function loadLiveTasks(client: HermesKanbanClient, boardName?: string): Promise<DashboardTask[]> {
  const board = await client.getBoard(true, boardName)
  const rawTasks = board.tasks ?? (Array.isArray(board.columns) ? board.columns.flatMap(column => column.tasks) : Object.values(board.columns).flat())
  const links = board.links ?? []
  const linkMap = new Map<string, { parents: string[]; children: string[] }>()
  for (const link of links) {
    const parent = linkMap.get(link.parent_id) ?? { parents: [], children: [] }
    const child = linkMap.get(link.child_id) ?? { parents: [], children: [] }
    parent.children.push(link.child_id)
    child.parents.push(link.parent_id)
    linkMap.set(link.parent_id, parent)
    linkMap.set(link.child_id, child)
  }
  return rawTasks.map(task => normalizeTask({ ...task, links: task.links ?? linkMap.get(task.id) }))
}

export async function loadLiveTaskDetail(client: HermesKanbanClient, taskId: string, boardName?: string): Promise<DashboardTask> {
  const detail = await client.getTask(taskId, boardName)
  const task = normalizeTask(detail.task)
  return { ...task, runs: detail.runs.map(run => ({ id: run.id, profile: run.profile, status: run.status, outcome: run.outcome, summary: run.summary, error: run.error })), comments: detail.comments, artifacts: detail.attachments ?? [], events: detail.events }
}

export async function resolveDashboardSource(): Promise<DashboardSource> {
  const origin = configuredHermesOrigin()
  if (!origin) return { client: null, label: 'Synthetic source · read-only', state: 'offline' }
  const client = createHermesClient(origin)
  try {
    await client.getStats()
    return { client, label: 'Hermes API · read-only', state: 'connected' }
  } catch {
    return { client, label: 'Hermes API unavailable · fixture fallback', state: 'degraded' }
  }
}

export function subscribeToBoardEvents(client: HermesKanbanClient, onEvent: () => void): () => void {
  let socket: WebSocket | null = null
  let stopped = false
  let retries = 0
  const connect = () => {
    if (stopped || retries > 3) return
    socket = new WebSocket(client.eventsSocketUrl())
    socket.onmessage = () => onEvent()
    socket.onopen = () => { retries = 0 }
    socket.onclose = () => {
      if (stopped) return
      retries += 1
      window.setTimeout(connect, Math.min(1000 * 2 ** retries, 8000))
    }
    socket.onerror = () => socket?.close()
  }
  connect()
  return () => { stopped = true; socket?.close() }
}
