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
export type HermesBoardSummary = { slug: string; name: string; description?: string | null; icon?: string | null; color?: string | null; archived?: boolean; orchestration?: HermesOrchestrationSettings }
export type HermesOrchestrationSettings = { default_profile?: string | null; max_runtime_seconds?: number | null; max_retries?: number | null; goal_mode?: boolean; goal_max_turns?: number | null; skills?: string[] | null; workflow_template_id?: string | null }
export type HermesAssignee = { name: string; on_disk?: boolean; counts?: Record<string, number> }
export type HermesProject = { id: string; slug: string; name: string; description?: string | null; primary_folder?: string | null; bound_board?: string | null; archived?: boolean }
export type HermesConfig = { columns: string[]; archived_column?: string; dangerous_statuses?: string[]; cli_parity?: Array<{ cli: string; api: string; ui: string }> }
export type CreateTaskInput = { title: string; body?: string | null; status?: string; assignee?: string | null; created_by?: string; workspace_kind?: string; workspace_path?: string | null; priority?: number; parents?: string[]; max_runtime_seconds?: number | null; max_retries?: number | null; goal_mode?: boolean; goal_max_turns?: number | null; skills?: string[] | null; workflow_template_id?: string | null }

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
  async createBoard(input: { slug: string; name: string; description?: string; icon?: string; color?: string; switch?: boolean }): Promise<unknown> { return this.send('/api/boards', 'POST', input) }
  async getBoardDetail(slug: string): Promise<{ board: HermesBoardSummary }> { return this.get(`/api/boards/${encodeURIComponent(slug)}`) }
  async updateBoard(slug: string, input: { name?: string; description?: string; icon?: string; color?: string; orchestration?: HermesOrchestrationSettings }): Promise<unknown> { return this.send(`/api/boards/${encodeURIComponent(slug)}`, 'PATCH', input) }
  async getAssignees(): Promise<{ assignees: HermesAssignee[] }> { return this.get('/api/assignees') }
  async getProjects(): Promise<{ projects: HermesProject[] }> { return this.get('/api/projects') }
  async bindBoardProject(board: string, project: string): Promise<unknown> { return this.send(`/api/boards/${encodeURIComponent(board)}/bind-project`, 'POST', { project }) }
  async getConfig(): Promise<HermesConfig> { return this.get('/api/config') }
  async switchBoard(slug: string): Promise<unknown> { return this.send(`/api/boards/${encodeURIComponent(slug)}/switch`, 'POST', {}) }
  async getBoard(includeArchived = false, board?: string): Promise<HermesBoard> {
    return this.get<HermesBoard>(`/api/board?include_archived=${includeArchived ? 'true' : 'false'}${board ? `&board=${encodeURIComponent(board)}` : ''}`)
  }

  async getTask(taskId: string, board?: string): Promise<HermesTaskDetail> {
    return this.get<HermesTaskDetail>(`/api/tasks/${encodeURIComponent(taskId)}${board ? `?board=${encodeURIComponent(board)}` : ''}`)
  }

  async createTask(input: CreateTaskInput, board: string): Promise<unknown> { return this.send('/api/tasks?board=' + encodeURIComponent(board), 'POST', input) }
  async assignTask(taskId: string, profile: string | null, board: string): Promise<unknown> { return this.send(`/api/tasks/${encodeURIComponent(taskId)}/assign?board=${encodeURIComponent(board)}`, 'POST', { profile }) }
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

  eventsStreamUrl(): string {
    return `${this.origin}/api/events/stream`
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
