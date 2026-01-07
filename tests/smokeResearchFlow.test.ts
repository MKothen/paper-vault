import { describe, it, expect } from 'vitest';
import { buildProjectMarkdownExport } from '../src/utils/exportUtils';
import type { DatasetLink, PaperExtraction, Project, Protocol, Run } from '../src/domain';
import type { Paper } from '../src/types';

describe('Research OS smoke flow', () => {
  it('exports markdown after core workflow', () => {
    const project: Project = {
      id: 'project_1',
      name: 'Neuro OS Demo',
      description: 'Testing flow',
      conceptIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
      status: 'active',
      milestones: [],
      collaborators: [],
      paperIds: [],
    };

    const papers: Paper[] = [
      {
        id: 'paper_1',
        userId: 'user_1',
        title: 'LIF Networks',
        link: '',
        tags: [],
        color: 'bg-nb-yellow',
        status: 'to-read',
        abstract: '',
        authors: 'Doe',
        year: '2023',
        venue: '',
        notes: '',
        pdfUrl: '',
        createdAt: Date.now(),
        projectIds: ['project_1'],
      },
    ];

    const runs: Run[] = [
      {
        id: 'run_1',
        projectId: 'project_1',
        date: '2024-01-01',
        aim: 'Run LIF',
        modelConceptIds: [],
        methodConceptIds: [],
        datasetLinks: [],
        codeLinks: [],
        parameters: {},
        resultsSummaryMd: '',
        metrics: [],
        artifacts: [],
        qcMd: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const protocols: Protocol[] = [];
    const datasetLinks: DatasetLink[] = [];
    const extractions: PaperExtraction[] = [];

    const markdown = buildProjectMarkdownExport(project, papers, extractions, runs, protocols, datasetLinks);
    expect(markdown).toContain('Neuro OS Demo');
    expect(markdown).toContain('Linked Papers');
  });
});
