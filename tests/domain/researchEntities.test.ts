import { describe, it, expect } from 'vitest';
import {
  ConceptSchema,
  DatasetLinkSchema,
  PaperExtractionSchema,
  ProtocolSchema,
  RunSchema,
} from '../../src/domain';

describe('Research OS schemas', () => {
  it('validates ConceptSchema', () => {
    const result = ConceptSchema.safeParse({
      id: 'concept_1',
      name: 'Hippocampus',
      type: 'BrainRegion',
      aliases: ['HPC'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('validates ProtocolSchema with defaults', () => {
    const result = ProtocolSchema.safeParse({
      id: 'protocol_1',
      projectId: 'project_1',
      title: 'Simulation checklist',
      version: '1.0',
      bodyMd: '## Steps',
      checklist: [],
      attachments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('validates RunSchema', () => {
    const result = RunSchema.safeParse({
      id: 'run_1',
      projectId: 'project_1',
      date: '2024-01-01',
      aim: 'Test LIF model',
      modelConceptIds: [],
      methodConceptIds: [],
      datasetLinks: [],
      codeLinks: [],
      parameters: { lr: 0.01 },
      resultsSummaryMd: '',
      metrics: [],
      artifacts: [],
      qcMd: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('validates DatasetLinkSchema', () => {
    const result = DatasetLinkSchema.safeParse({
      id: 'dataset_1',
      projectId: 'project_1',
      type: 'Dataset',
      title: 'OpenNeuro Dataset',
      url: 'https://openneuro.org/datasets/ds000001',
      formatConceptIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('validates PaperExtractionSchema', () => {
    const result = PaperExtractionSchema.safeParse({
      id: 'extract_1',
      paperId: 'paper_1',
      projectId: 'project_1',
      taskParadigmConceptIds: [],
      dataTypeConceptIds: [],
      modelTypeConceptIds: [],
      evaluationMetrics: ['accuracy'],
      keyFindingsMd: 'Findings',
      limitationsMd: 'Limitations',
      reproChecklist: [],
      linkedRunIds: [],
      linkedConceptIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });
});
