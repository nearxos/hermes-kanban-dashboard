import { describe, expect, it } from 'vitest'
import { fixtureData } from './source'

describe('dashboard source normalization', () => {
  it('normalizes fixture tasks with complete detail collections', () => {
    const tasks = fixtureData()
    expect(tasks).toHaveLength(5)
    expect(tasks.every(task => Array.isArray(task.comments))).toBe(true)
    expect(tasks.every(task => Array.isArray(task.artifacts))).toBe(true)
    expect(tasks.every(task => Array.isArray(task.events))).toBe(true)
  })

  it('preserves the fixture dependency chain', () => {
    const tasks = fixtureData()
    expect(tasks.find(task => task.id === 't_fixture_triage')?.links.children).toContain('t_fixture_running')
    expect(tasks.find(task => task.id === 't_fixture_running')?.links.children).toContain('t_fixture_review')
    expect(tasks.find(task => task.id === 't_fixture_review')?.links.children).toContain('t_fixture_blocked')
  })
})
