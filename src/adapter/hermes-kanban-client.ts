export type HermesStatus = 'archived' | 'blocked' | 'done' | 'ready' | 'review' | 'running' | 'scheduled' | 'todo' | 'triage'

export type HermesTask = {
  id: string
  title: string
  body?: string | null
  status: HermesStatus
  assignee?: string | null
  workspace_path?: string | null
  links?: { parents: string[]; children: string[] }
  verification: string[]
  residual_risk: string[]
  runs: HermesRun[]
}

export type HermesRun = {
  id: number
  profile?: string | null
  status: string
  outcome?: string | null
  started_at?: number | null
  ended_at?: number | null
  summary?: string | null
  error?: string | null
}

export type HermesBoard = {
  columns: Array<{ name: HermesStatus; tasks: HermesTask[] }> | Record<string, HermesTask[]>
  tasks?: HermesTask[]
  links?: Array<{ parent_id: string; child_id: string }>
}
export type HermesBoardSummary = { slug: string; name: string; archived?: boolean }
export type CreateTaskInput = { title: string; body?: string | null; status?: string; assignee?: string | null; created_by?: string; workspace_kind?: string; workspace_path?: string | null; priority?: number; parents?: string[] }

export type HermesTaskDetail = {
  task: HermesTask
  runs: HermesRun[]
  events: Array<{ id: number; run_id?: number | null; kind: string; payload?: unknown; created_at?: number }>
  comments: Array<{ id: number; author: string; body: string; created_at?: number }>
  attachments?: Array<{ id: number; filename: string }>
}

export type HermesConnectionState = 'connected' | 'connecting' | 'degraded' | 'offline'

export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, '')
}

export class HermesKanbanClient {
  readonly origin: string
  private readonly fetcher: typeof fetch

  constructor(origin: string, fetcher: typeof fetch = globalThis.fetch) {
    this.origin = normalizeOrigin(origin)
    this.fetcher = fetcher.bind(globalThis)
  }

  async getBoards(): Promise<{ boards: HermesBoardSummary[]; current?: string }> { return this.get('/api/boards') }
  async switchBoard(slug: string): Promise<unknown> { return this.send(`/api/boards/${encodeURIComponent(slug)}/switch`, 'POST', {}) }
  async getBoard(includeArchived = false, board?: string): Promise<HermesBoard> {
    return this.get<HermesBoard>(`/api/board?include_archived=${includeArchived ? 'true' : 'false'}${board ? `&board=${encodeURIComponent(board)}` : ''}`)
  }

  async getTask(taskId: string, board?: string): Promise<HermesTaskDetail> {
    return this.get<HermesTaskDetail>(`/api/tasks/${encodeURIComponent(taskId)}${board ? `?board=${encodeURIComponent(board)}` : ''}`)
  }

  async createTask(input: CreateTaskInput, board: string): Promise<unknown> { return this.send('/api/tasks?board=' + encodeURIComponent(board), 'POST', input) }
  async moveTask(taskId: string, status: string, board: string): Promise<unknown> { return this.send(`/api/tasks/${encodeURIComponent(taskId)}?board=${encodeURIComponent(board)}`, 'PATCH', { status }) }
  async addComment(taskId: string, body: string, board: string, author = 'kanban-dashboard'): Promise<unknown> { return this.send(`/api/tasks/${encodeURIComponent(taskId)}/comments?board=${encodeURIComponent(board)}`, 'POST', { body, author }) }

  async getStats(): Promise<unknown> {
    return this.get<unknown>('/api/boards')
  }

  async getWorkers(): Promise<unknown> {
    return this.get<unknown>('/api/service/status')
  }

  eventsUrl(since?: number): string {
    const suffix = since == null ? '' : `?since=${encodeURIComponent(String(since))}`
    return `${this.origin}/api/events${suffix}`
  }

  eventsSocketUrl(since?: number): string {
    const url = this.eventsUrl(since)
    if (/^https?:/i.test(url)) return url.replace(/^http/, 'ws')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${url}`
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetcher(`${this.origin}${path}`, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Hermes Kanban request failed (${response.status})`)
    return response.json() as Promise<T>
  }
  private async send<T>(path: string, method: string, body: unknown): Promise<T> {
    const response = await this.fetcher(`${this.origin}${path}`, { method, headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`Hermes Kanban request failed (${response.status})`)
    return response.json() as Promise<T>
  }
}

export function createHermesClient(origin: string): HermesKanbanClient {
  return new HermesKanbanClient(normalizeOrigin(origin))
}
