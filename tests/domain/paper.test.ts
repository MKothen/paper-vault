import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPaperForCreate, mergePaperUpdate, normalizePaper } from '../../src/domain/paper.js';

describe('paper domain model', () => {
  it('fills defaults when creating a paper', () => {
    const paper = buildPaperForCreate({ userId: 'user-1', title: 'Test Paper' });

    assert.equal(paper.status, 'to-read');
    assert.deepEqual(paper.tags, []);
    assert.equal(paper.notes, '');
    assert.ok(paper.createdAt);
    assert.ok(paper.addedDate);
  });

  it('normalizes timestamp-like values', () => {
    const mockTimestamp = { toMillis: () => 1700000000000 };
    const paper = normalizePaper(
      {
        userId: 'user-2',
        title: 'Timestamp Paper',
        createdAt: mockTimestamp,
        addedDate: mockTimestamp,
      },
      'paper-123'
    );

    assert.equal(paper.id, 'paper-123');
    assert.equal(paper.createdAt, 1700000000000);
  });

  it('rejects invalid status updates', () => {
    const basePaper = normalizePaper({ userId: 'user-3', title: 'Valid' }, 'paper-456');
    assert.throws(() => mergePaperUpdate(basePaper, { status: 'archived' as any }), /Cannot update paper/);
  });
});
