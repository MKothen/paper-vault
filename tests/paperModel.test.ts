/// <reference types="vitest" />
import { describe, expect, it } from 'vitest'
import {
  buildPaperForCreate,
  paperCreateSchema,
  paperSchema,
} from '../src/domain/models/paper'

describe('paper domain model', () => {
  it('builds a paper with defaults for optional fields', () => {
    const created = buildPaperForCreate({
      userId: 'user-123',
      title: 'Sample Paper',
      status: 'to-read',
      color: 'bg-nb-yellow',
    })

    expect(created.tags).toEqual([])
    expect(created.methods).toEqual([])
    expect(typeof created.createdAt).toBe('number')
    expect(created.addedDate).toBe(created.createdAt)
  })

  it('rejects invalid status values', () => {
    expect(() =>
      paperCreateSchema.parse({
        userId: 'user-123',
        title: 'Bad Status',
        status: 'archived',
        color: 'bg-nb-yellow',
      }),
    ).toThrow()
  })

  it('parses a stored paper document and fills defaults', () => {
    const parsed = paperSchema.parse({
      id: 'abc',
      userId: 'user-123',
      title: 'Persisted',
      status: 'read',
      color: 'bg-nb-purple',
      createdAt: 123,
    })

    expect(parsed.hierarchicalTags).toEqual([])
    expect(parsed.references).toEqual([])
    expect(parsed.notes).toBe('')
  })
})
