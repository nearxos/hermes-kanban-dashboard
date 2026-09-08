import { useLayoutEffect, useEffect, useMemo, useRef, useState } from 'react'
import fixture from '../fixtures/kanban/states.json'
import { fixtureData, loadLiveTaskDetail, loadLiveTasks, resolveDashboardSource, subscribeToBoardEvents, taskActivityLabel, type DashboardTask } from './adapter/source'
import type { HermesAssignee, HermesConfig, HermesKanbanClient, HermesProject } from './adapter/hermes-kanban-client'
import './styles.css'

type Status = (typeof fixture.statuses)[number]
type Task = DashboardTask
type Connection = { from: string; to: string; path: string }

const statusMeta: Record<string, { label: string; tone: string }> = {
  triage: { label: 'Triage', tone: '#a78bfa' },
  todo: { label: 'Todo', tone: '#94a3b8' },
  scheduled: { label: 'Scheduled', tone: '#60a5fa' },
  ready: { label: 'Ready', tone: '#38bdf8' },
  running: { label: 'Running', tone: '#34d399' },
  blocked: { label: 'Blocked', tone: '#fbbf24' },
  review: { label: 'Review', tone: '#f472b6' },
  done: { label: 'Done', tone: '#818cf8' },
  archived: { label: 'Archived', tone: '#64748b' }
}

function measureConnections(board: HTMLDivElement, visibleTasks: Task[]): Connection[] {
  const visible = new Set(visibleTasks.map(task => task.id))
  const boardRect = board.getBoundingClientRect()
  const connections: Connection[] = []

  for (const task of visibleTasks) {
    for (const childId of task.links.children) {
      if (!visible.has(childId)) continue
      const source = board.querySelector<HTMLElement>(`[data-task-id="${task.id}"]`)
      const target = board.querySelector<HTMLElement>(`[data-task-id="${childId}"]`)
      if (!source || !target) continue
      const sourceRect = source.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const x1 = sourceRect.right - boardRect.left
      const y1 = sourceRect.top + sourceRect.height / 2 - boardRect.top
      const x2 = targetRect.left - boardRect.left
      const y2 = targetRect.top + targetRect.height / 2 - boardRect.top
      const curve = Math.max(34, Math.abs(x2 - x1) * 0.42)
      connections.push({ from: task.id, to: childId, path: `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}` })
    }
  }
  return connections
}

function App() {
  const initialTasks = useMemo(() => fixtureData(), [])
  const [liveTasks, setLiveTasks] = useState<Task[] | null>(null)
  const [hermesClient, setHermesClient] = useState<HermesKanbanClient | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<Task | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialTasks[3]?.id ?? null)
  const [activeStatus, setActiveStatus] = useState<Status | 'all'>('all')
  const [sourceLabel, setSourceLabel] = useState('Synthetic source · read-only')
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [boards, setBoards] = useState<Array<{ slug: string; name: string }>>([])
  const [selectedBoard, setSelectedBoard] = useState('')
  const selectedBoardRef = useRef('')
  selectedBoardRef.current = selectedBoard
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [mutationError, setMutationError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [boardCreateOpen, setBoardCreateOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [assignees, setAssignees] = useState<HermesAssignee[]>([])
  const [projects, setProjects] = useState<HermesProject[]>([])
  const [hermesConfig, setHermesConfig] = useState<HermesConfig | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    let mounted = true
    let stopEvents: (() => void) | undefined
    let refreshTimer: number | undefined
    const start = async () => {
      const source = await resolveDashboardSource()
      if (!mounted) return
      setSourceLabel(source.label)
      setHermesClient(source.client)
      if (!source.client) return
      const available = await source.client.getBoards()
      const [profileResult, configResult, projectResult] = await Promise.allSettled([source.client.getAssignees(), source.client.getConfig(), source.client.getProjects()])
      if (mounted) {
        if (profileResult.status === 'fulfilled') setAssignees(profileResult.value.assignees)
        if (configResult.status === 'fulfilled') setHermesConfig(configResult.value)
        if (projectResult.status === 'fulfilled') setProjects(projectResult.value.projects.filter(project => !project.archived))
        setBoards(available.boards.filter(board => !board.archived)); setSelectedBoard(available.current ?? available.boards[0]?.slug ?? '')
      }
      const refreshBoard = async () => {
        try {
          const nextTasks = await loadLiveTasks(source.client!, selectedBoardRef.current || available.current)
          if (mounted) {
            setLiveTasks(nextTasks)
            setLastSync(Date.now())
          }
        } catch {
          if (mounted) {
            setSourceLabel('Hermes API unavailable · fixture fallback')
            setLiveTasks(null)
          }
        }
      }
      await refreshBoard()
      const scheduleRefresh = () => {
        if (refreshTimer !== undefined) return
        refreshTimer = window.setTimeout(() => {
          refreshTimer = undefined
          void refreshBoard()
        }, 250)
      }
      if (mounted) stopEvents = subscribeToBoardEvents(source.client, scheduleRefresh)
      const pollingTimer = window.setInterval(() => { void refreshBoard() }, 3000)
      const previousCleanup = () => window.clearInterval(pollingTimer)
      const originalCleanup = stopEvents
      stopEvents = () => { originalCleanup?.(); previousCleanup() }
    }
    void start()
    return () => {
      mounted = false
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer)
      stopEvents?.()
    }
  }, [])

  const sourceTasks = liveTasks ?? initialTasks

  useEffect(() => {
    setSelectedDetail(null)
    if (!hermesClient || !selectedId) return
    let mounted = true
    setDetailLoading(true)
    void loadLiveTaskDetail(hermesClient, selectedId, selectedBoard).then(detail => {
      if (mounted) setSelectedDetail(detail)
    }).catch(() => {
      if (mounted) setSelectedDetail(null)
    }).finally(() => {
      if (mounted) setDetailLoading(false)
    })
    return () => { mounted = false }
  }, [hermesClient, selectedId])

  const tasks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return sourceTasks.filter(task => {
      const matchesStatus = activeStatus === 'all' || task.status === activeStatus
      const matchesQuery = !normalized || `${task.title} ${task.body} ${task.id}`.toLowerCase().includes(normalized)
      return matchesStatus && matchesQuery
    })
  }, [activeStatus, query, sourceTasks])

  const selected = selectedDetail ?? sourceTasks.find(task => task.id === selectedId) ?? null
  const running = sourceTasks.filter(task => task.status === 'running').length
  const needsReview = sourceTasks.filter(task => task.status === 'review').length
  const attention = sourceTasks.filter(task => task.status === 'blocked').length
  const boardRef = useRef<HTMLDivElement>(null)
  const refreshLive = async (boardName = selectedBoard) => { if (!hermesClient || !boardName) return; try { const next = await loadLiveTasks(hermesClient, boardName); setLiveTasks(next); setLastSync(Date.now()) } catch (error) { setMutationError(error instanceof Error ? error.message : 'Unable to refresh board') } }
  const moveTask = async (task: Task, status: string) => { const boardName = selectedBoard; if (!hermesClient || !boardName) return; setMutationError(''); try { await hermesClient.moveTask(task.id, status, boardName); await refreshLive(boardName) } catch (error) { setMutationError(error instanceof Error ? error.message : 'Unable to move task') } }
  const switchBoard = async (slug: string) => { if (!hermesClient) return; setMutationError(''); try { setSelectedBoard(slug); setLiveTasks(await loadLiveTasks(hermesClient, slug)); setLastSync(Date.now()) } catch (error) { setMutationError(error instanceof Error ? error.message : 'Unable to switch board') } }
  const [connections, setConnections] = useState<Connection[]>([])

  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board) return
    const update = () => setConnections(measureConnections(board, tasks))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(board)
    board.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      board.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [tasks])

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Hermes / operator board</p>
          <h1>Operator Kanban</h1>
        </div>
        <div className="top-actions"><button className="action secondary" onClick={() => setBoardCreateOpen(true)} disabled={!hermesClient}>+ New board</button><button className="action secondary" onClick={() => setSettingsOpen(true)} disabled={!hermesClient || !selectedBoard}>Board settings</button><button className="action" onClick={() => setCreateOpen(true)} disabled={!hermesClient || !selectedBoard}>+ New task</button></div>
        <div className="connection" role="status" aria-live="polite"><span className="pulse" /> {sourceLabel}{lastSync ? <small> · synced {new Date(lastSync).toLocaleTimeString()}</small> : null}</div>
      </header>
      {boards.length > 0 && <label className="board-picker">Board <select aria-label="Select board" value={selectedBoard} onChange={event => void switchBoard(event.target.value)}>
        {boards.map(board => <option key={board.slug} value={board.slug}>{board.name}</option>)}
      </select></label>}

      <section className="summary-grid" aria-label="Board summary">
        <Metric label="Visible tasks" value={tasks.length} detail="Across lifecycle states" />
        <Metric label="Running" value={running} detail="Worker activity" tone="green" />
        <Metric label="Needs review" value={needsReview} detail="Human gate" tone="pink" />
        <Metric label="Attention" value={attention} detail="Blocked work" tone="amber" />
      </section>

      <section className="toolbar">
        <div className="filters" role="group" aria-label="Task filters">
          <button className={activeStatus === 'all' ? 'filter active' : 'filter'} onClick={() => setActiveStatus('all')}>All</button>
          {fixture.statuses.map(status => (
            <button key={status} className={activeStatus === status ? 'filter active' : 'filter'} onClick={() => setActiveStatus(status)}>
              {statusMeta[status].label}
            </button>
          ))}
        </div>
        <input aria-label="Search tasks" placeholder="Search tasks…" value={query} onChange={event => setQuery(event.target.value)} />
      </section>

      {mutationError && <div className="error" role="alert">{mutationError}</div>}
      <section className="board" aria-label="Kanban board" ref={boardRef}>
        <svg className="connection-layer" aria-hidden="true">
          <defs>
            <marker id="flow-arrow" markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3" viewBox="0 0 6 6"><path d="M 0 0 L 6 3 L 0 6 z" fill="#8b5cf6" /></marker>
          </defs>
          {connections.map(connection => <g key={`${connection.from}-${connection.to}`}><path className="connection-path" d={connection.path} markerEnd="url(#flow-arrow)" /><circle className="flow-dot" r="3"><animateMotion dur="2.2s" path={connection.path} repeatCount="indefinite" /></circle></g>)}
        </svg>
        {fixture.statuses.map(status => {
          const columnTasks = tasks.filter(task => task.status === status)
          return (
            <div className="column" key={status} onDragOver={event => event.preventDefault()} onDrop={event => { const taskId = event.dataTransfer.getData('text/task-id'); const task = sourceTasks.find(item => item.id === taskId); if (task && task.status !== status) void moveTask(task, status) }}>
              <div className="column-header"><span className="dot" style={{ background: statusMeta[status].tone }} /><span>{statusMeta[status].label}</span><b>{columnTasks.length}</b></div>
              <div className="cards">
                {(expanded[status] ? columnTasks : columnTasks.slice(0, 10)).map(task => <TaskCard key={task.id} task={task} selected={task.id === selectedId} onSelect={() => setSelectedId(task.id)} />)}
                {columnTasks.length > 10 && <button className="expand" onClick={() => setExpanded(value => ({ ...value, [status]: !value[status] }))}>{expanded[status] ? 'Show fewer' : `Show ${columnTasks.length - 10} more`}</button>}
                {columnTasks.length === 0 && <div className="empty">No tasks</div>}
              </div>
            </div>
          )
        })}
      </section>

      {createOpen && <CreateTask client={hermesClient} board={selectedBoard} assignees={assignees} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); void refreshLive() }} />}
      {boardCreateOpen && <CreateBoard client={hermesClient} projects={projects} onClose={() => setBoardCreateOpen(false)} onCreated={async () => { setBoardCreateOpen(false); if (hermesClient) { const next = await hermesClient.getBoards(); setBoards(next.boards.filter(board => !board.archived)); setSelectedBoard(next.current ?? selectedBoard) } }} />}
      {settingsOpen && <BoardSettings client={hermesClient} board={selectedBoard} config={hermesConfig} onClose={() => setSettingsOpen(false)} onSaved={async () => { setSettingsOpen(false); if (hermesClient) { const next = await hermesClient.getBoards(); setBoards(next.boards.filter(board => !board.archived)) } }} />}
      {selected && <TaskDrawer task={selected} client={hermesClient} board={selectedBoard} mutationsEnabled={liveTasks !== null} loading={detailLoading} onClose={() => setSelectedId(null)} onCommented={detail => { setSelectedDetail(detail); void refreshLive() }} />}
    </main>
  )
}

function Metric({ label, value, detail, tone = 'violet' }: { label: string; value: number; detail: string; tone?: string }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function TaskCard({ task, selected, onSelect }: { task: Task; selected: boolean; onSelect: () => void }) {
  const meta = statusMeta[task.status]
  const latest = task.runs.at(-1)
  return <button draggable className={`task-card ${selected ? 'selected' : ''}`} data-task-id={task.id} onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/task-id', task.id) }} onClick={onSelect} style={{ borderLeftColor: meta.tone }}>
    <span className="task-title">{task.title}</span>
    <span className="task-body">{task.body}</span>
    <span className="task-footer"><span className="drag-hint">↕ Drag to move</span><span className="profile">{task.assignee ?? 'unassigned'}</span><span>{latest ? `run ${latest.id} · ${taskActivityLabel(task)}` : taskActivityLabel(task)}</span></span>
  </button>
}

function TaskDrawer({ task, client, board, mutationsEnabled, loading, onClose, onCommented }: { task: Task; client: HermesKanbanClient | null; board: string; mutationsEnabled: boolean; loading: boolean; onClose: () => void; onCommented: (detail: Task) => void }) {
  const meta = statusMeta[task.status]
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [comments, setComments] = useState(task.comments)
  useEffect(() => { setComments(task.comments) }, [task.id, task.comments])
  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!client || !board || !mutationsEnabled || !comment.trim()) return
    setCommentError('')
    try {
      await client.addComment(task.id, comment.trim(), board)
      const detail = await loadLiveTaskDetail(client, task.id, board)
      setComments(detail.comments)
      setComment('')
      onCommented(detail)
    } catch (error) { setCommentError(error instanceof Error ? error.message : 'Unable to add comment') }
  }
  return <aside className="drawer" aria-label="Task details">
    <div className="drawer-head"><div><span className="status-pill" style={{ color: meta.tone, background: `${meta.tone}22` }}>{meta.label}</span><span className="task-id">{task.id}</span></div><button className="close" onClick={onClose} aria-label="Close details">×</button></div>
    <h2>{task.title}</h2><p className="drawer-body">{task.body}</p>
    <Evidence label="Owner" value={task.assignee ?? 'Unassigned'} /><Evidence label="Workspace" value={task.workspace_path ?? 'Scratch workspace'} />
    {loading && <p className="loading-note" role="status" aria-live="polite">Loading live task evidence…</p>}
    <section className="evidence"><h3>Review / approval</h3><p className="muted">For review tasks, add approval notes here. Move the task to Done after approval, or leave it in Review with requested changes.</p>{!mutationsEnabled && <p className="muted">Comments are disabled in fixture/fallback mode. Select a live Hermes task to add a comment.</p>}<form className="comment-form" onSubmit={submitComment}><textarea aria-label="Add review comment" placeholder="Add review notes or approval…" value={comment} disabled={!mutationsEnabled} onChange={event => setComment(event.target.value)} /><button className="action" type="submit" disabled={!mutationsEnabled || !comment.trim()}>Add comment</button></form>{commentError && <p className="error">{commentError}</p>}</section>
    <section className="evidence"><h3>Review evidence</h3>{task.verification.length ? <ul>{task.verification.map(item => <li key={item}><span className="check">✓</span>{item}</li>)}</ul> : <p className="muted">No verification recorded.</p>}</section>
    <section className="evidence"><h3>Comments</h3>{comments.length ? comments.map(item => <div className="run" key={item.id}><div><b>{item.author}</b></div><p>{item.body}</p></div>) : <p className="muted">No comments recorded.</p>}</section>
    <section className="evidence"><h3>Run history</h3>{task.runs.length ? task.runs.map(run => <div className="run" key={run.id}><div><b>Run {run.id}</b><span className="run-state">{run.outcome ?? run.status}</span></div><p>{run.summary ?? run.error ?? 'No summary recorded.'}</p></div>) : <p className="muted">No runs yet.</p>}</section>
    <section className="evidence"><h3>Artifacts</h3>{task.artifacts.length ? <ul>{task.artifacts.map(artifact => <li key={artifact.id}><span className="check">↗</span>{artifact.filename}{artifact.state ? ` · ${artifact.state}` : ''}</li>)}</ul> : <p className="muted">No artifacts recorded.</p>}</section>
    <section className="evidence"><h3>Residual risk</h3>{task.residual_risk.length ? <ul className="risk">{task.residual_risk.map(item => <li key={item}>{item}</li>)}</ul> : <p className="muted">No residual risk recorded.</p>}</section>
  </aside>
}

function Evidence({ label, value }: { label: string; value: string }) { return <div className="evidence-row"><span>{label}</span><b>{value}</b></div> }

export default App

function CreateTask({ client, board, assignees, onClose, onCreated }: { client: HermesKanbanClient | null; board: string; assignees: HermesAssignee[]; onClose: () => void; onCreated: () => void }) { const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [profile, setProfile] = useState(''); const [error, setError] = useState(''); return <div className="modal"><form onSubmit={async event => { event.preventDefault(); if (!client || !board || !title.trim()) return; try { const created = await client.createTask({ title: title.trim(), body, status: 'todo', assignee: profile || null }, board) as { task?: { id: string }; id?: string }; const taskId = created.task?.id ?? created.id; if (taskId && profile) await client.assignTask(taskId, profile, board); onCreated() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create task') } }}><h2>New task</h2><input autoFocus placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} /><textarea placeholder="Description" value={body} onChange={e => setBody(e.target.value)} /><label>Hermes profile<select value={profile} onChange={e => setProfile(e.target.value)}><option value="">Unassigned</option>{assignees.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label><p className="muted">The selected profile is assigned after the task is created.</p><div className="modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="action" type="submit">Create task</button></div>{error && <p className="error">{error}</p>}</form></div> }

function CreateBoard({ client, projects, onClose, onCreated }: { client: HermesKanbanClient | null; projects: HermesProject[]; onClose: () => void; onCreated: () => void }) { const [name, setName] = useState(''); const [slug, setSlug] = useState(''); const [description, setDescription] = useState(''); const [project, setProject] = useState(''); const [switchTo, setSwitchTo] = useState(true); const [error, setError] = useState(''); return <div className="modal"><form onSubmit={async event => { event.preventDefault(); if (!client || !name.trim() || !slug.trim()) return; try { await client.createBoard({ name: name.trim(), slug: slug.trim().toLowerCase(), description: description.trim(), switch: switchTo }); if (project) await client.bindBoardProject(slug.trim().toLowerCase(), project); onCreated() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create or bind board') } }}><h2>New board</h2><input autoFocus placeholder="Board name" value={name} onChange={e => setName(e.target.value)} /><input placeholder="URL-safe slug, e.g. release-planning" value={slug} onChange={e => setSlug(e.target.value)} /><textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} /><label>Hermes project<select value={project} onChange={e => setProject(e.target.value)}><option value="">No project binding</option>{projects.map(item => <option key={item.id} value={item.slug}>{item.name} · {item.slug}</option>)}</select></label><p className="muted">The selected project will be bound after the board is created.</p><label className="check-row"><input type="checkbox" checked={switchTo} onChange={e => setSwitchTo(e.target.checked)} /> Switch to this board after creation</label><div className="modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="action" type="submit">Create board</button></div>{error && <p className="error">{error}</p>}</form></div> }

function BoardSettings({ client, board, config, onClose, onSaved }: { client: HermesKanbanClient | null; board: string; config: HermesConfig | null; onClose: () => void; onSaved: () => void }) { const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [profile, setProfile] = useState(''); const [runtime, setRuntime] = useState(''); const [retries, setRetries] = useState(''); const [goalMode, setGoalMode] = useState(false); const [goalTurns, setGoalTurns] = useState(''); const [skills, setSkills] = useState(''); const [template, setTemplate] = useState(''); const [error, setError] = useState(''); useEffect(() => { if (client && board) void client.getBoardDetail(board).then(result => { const b = result.board; const o = b.orchestration ?? {}; setName(b.name); setDescription(b.description ?? ''); setProfile(o.default_profile ?? ''); setRuntime(o.max_runtime_seconds?.toString() ?? ''); setRetries(o.max_retries?.toString() ?? ''); setGoalMode(Boolean(o.goal_mode)); setGoalTurns(o.goal_max_turns?.toString() ?? ''); setSkills((o.skills ?? []).join(', ')); setTemplate(o.workflow_template_id ?? '') }).catch(() => setError('Unable to load board settings')) }, [client, board]); return <div className="modal"><form onSubmit={async event => { event.preventDefault(); if (!client || !board || !name.trim()) return; try { await client.updateBoard(board, { name: name.trim(), description: description.trim(), orchestration: { default_profile: profile || null, max_runtime_seconds: runtime ? Number(runtime) : null, max_retries: retries ? Number(retries) : null, goal_mode: goalMode, goal_max_turns: goalTurns ? Number(goalTurns) : null, skills: skills.split(',').map(item => item.trim()).filter(Boolean), workflow_template_id: template || null } }); onSaved() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save board settings') } }}><h2>Board settings</h2><p className="muted">Board: <b>{board}</b></p><input placeholder="Board name" value={name} onChange={e => setName(e.target.value)} /><textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} /><h3>Orchestration defaults</h3><label>Default profile<input value={profile} onChange={e => setProfile(e.target.value)} placeholder="engineer" /></label><label>Max runtime (seconds)<input type="number" min="1" value={runtime} onChange={e => setRuntime(e.target.value)} /></label><label>Max retries<input type="number" min="0" value={retries} onChange={e => setRetries(e.target.value)} /></label><label className="check-row"><input type="checkbox" checked={goalMode} onChange={e => setGoalMode(e.target.checked)} /> Goal mode</label><label>Goal max turns<input type="number" min="1" value={goalTurns} onChange={e => setGoalTurns(e.target.value)} /></label><label>Skills (comma-separated)<input value={skills} onChange={e => setSkills(e.target.value)} /></label><label>Workflow template<input value={template} onChange={e => setTemplate(e.target.value)} placeholder="template-id" /></label><section className="settings-capabilities"><h3>Hermes capabilities</h3><p className="muted">New tasks inherit these defaults; explicit task values win.</p><p className="muted">Lifecycle columns: {(config?.columns ?? []).join(', ') || 'Unavailable'}</p></section><div className="modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="action" type="submit">Save settings</button></div>{error && <p className="error">{error}</p>}</form></div> }
