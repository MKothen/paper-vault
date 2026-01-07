import { describe, expect, it } from 'vitest';
import { buildObsidianBundle } from '../../src/utils/exportUtils';
import type { Paper } from '../../src/types';

const basePaper = (overrides: Partial<Paper>): Paper => ({
  id: 'paper_1',
  userId: 'user_1',
  title: 'Alpha Study',
  link: '',
  tags: [],
  color: 'bg-nb-yellow',
  status: 'read',
  abstract: '',
  authors: 'A. Author',
  year: '2024',
  venue: '',
  notes: '',
  pdfUrl: '',
  createdAt: 0,
  ...overrides,
});

describe('obsidian export', () => {
  it('produces deterministic output', () => {
    const papers = [basePaper({ title: 'Beta Study', id: 'paper_2' }), basePaper({ id: 'paper_1' })];
    const first = buildObsidianBundle({
      papers,
      evidenceItems: [],
      simulationRuns: [],
      codeSnippets: [],
      ontologyLookup: {},
    });
    const second = buildObsidianBundle({
      papers,
      evidenceItems: [],
      simulationRuns: [],
      codeSnippets: [],
      ontologyLookup: {},
    });
    expect(first).toEqual(second);
    expect(first[0].path).toContain('Alpha Study');
  });
});
