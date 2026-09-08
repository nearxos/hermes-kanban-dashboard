import { describe, expect, it, vi } from 'vitest'
import { createHermesClient, HermesKanbanClient, normalizeOrigin } from './hermes-kanban-client'

describe('Hermes Kanban adapter', () => {
  it('normalizes origins without changing the path contract', () => {
    expect(normalizeOrigin(' http://localhost:8000/ ')).toBe('http://localhost:8000')
    expect(createHermesClient('http://localhost:8000/').origin).toBe('http://localhost:8000')
  })

  it('builds board, task, and event URLs safely', () => {
    const client = new HermesKanbanClient('http://localhost:8000')
    expect(client.eventsUrl(42)).toBe('http://localhost:8000/api/events?since=42')
    expect(client.eventsUrl()).toBe('http://localhost:8000/api/events')
    expect(client.eventsSocketUrl()).toBe('ws://localhost:8000/api/events')
  })

  it('loads board and task detail payloads through the REST contract', async () => {
    const payloads = [
      { columns: [{ name: 'review', tasks: [{ id: 'task-1', title: 'Review task', status: 'review', links: { parents: [], children: [] }, runs: [] }] }] },
      { task: { id: 'task-1', title: 'Review task', status: 'review', links: { parents: [], children: [] }, runs: [] }, runs: [{ id: 7, status: 'succeeded', outcome: 'passed' }], comments: [{ id: 2, author: 'operator', body: 'Looks good.' }], events: [{ id: 3, kind: 'task_updated' }], attachments: [{ id: 4, filename: 'review.diff' }] }
    ]
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(payloads[0]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(payloads[1]), { status: 200 }))
    const client = new HermesKanbanClient('http://localhost:8000', fetcher)
    const board = await client.getBoard(true)
    expect(Array.isArray(board.columns) && board.columns[0]?.tasks[0]?.id).toBe('task-1')
    expect(fetcher).toHaveBeenNthCalledWith(1, 'http://localhost:8000/api/board?include_archived=true', { headers: { Accept: 'application/json' } })
    const detail = await client.getTask('task-1')
    expect(detail.comments[0]?.body).toBe('Looks good.')
    expect(fetcher).toHaveBeenNthCalledWith(2, 'http://localhost:8000/api/tasks/task-1', { headers: { Accept: 'application/json' } })
  })

  it('sends board-scoped task mutations with explicit JSON payloads', async () => {
    const response = () => new Response(JSON.stringify({ ok: true }), { status: 200 })
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => response())
    const client = new HermesKanbanClient('http://localhost:8000', fetcher)
    await client.createTask({ title: 'New task', body: 'Details', status: 'todo' }, 'default')
    await client.moveTask('task/1', 'review', 'default')
    await client.addComment('task/1', 'Approved after review.', 'default')
    expect(fetcher).toHaveBeenNthCalledWith(1, 'http://localhost:8000/api/tasks?board=default', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New task', body: 'Details', status: 'todo' }) })
    expect(fetcher).toHaveBeenNthCalledWith(2, 'http://localhost:8000/api/tasks/task%2F1?board=default', { method: 'PATCH', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'review' }) })
    expect(fetcher).toHaveBeenNthCalledWith(3, 'http://localhost:8000/api/tasks/task%2F1/comments?board=default', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ body: 'Approved after review.', author: 'kanban-dashboard' }) })
  })
  it('preserves HTTP failures as visible adapter errors', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 }))
    await expect(new HermesKanbanClient('http://localhost:8000', fetcher).getStats()).rejects.toThrow('503')
    expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/api/boards', { headers: { Accept: 'application/json' } })
  })
})
