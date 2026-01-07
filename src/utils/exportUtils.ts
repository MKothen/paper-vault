import type { Paper } from '../types';
import type { DatasetLink, PaperExtraction, Project, Protocol, Run } from '../domain';
import { generateBibTeX } from './citationUtils';

export const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const buildProjectMarkdownExport = (
  project: Project,
  papers: Paper[],
  extractions: PaperExtraction[],
  runs: Run[],
  protocols: Protocol[],
  datasetLinks: DatasetLink[],
) => {
  const frontmatter = [
    '---',
    `title: "${project.name}"`,
    `description: "${project.description ?? ''}"`,
    `status: "${project.status ?? 'active'}"`,
    `conceptIds: [${project.conceptIds.map((id) => `"${id}"`).join(', ')}]`,
    `createdAt: ${project.createdAt}`,
    `updatedAt: ${project.updatedAt}`,
    '---',
    '',
  ].join('\n');

  const linkedPapers = papers.filter((paper) => paper.projectIds?.includes(project.id));

  const section = (title: string, body: string[]) => [
    `## ${title}`,
    ...body,
    '',
  ].join('\n');

  const paperSection = linkedPapers.length
    ? linkedPapers.map((paper) => `- ${paper.title} (${paper.year || 'n.d.'})`).join('\n')
    : '_No linked papers yet._';

  const runSection = runs
    .filter((run) => run.projectId === project.id)
    .map((run) => `- ${run.date}: ${run.aim ?? 'Run'} (${run.metrics.length} metrics)`)
    .join('\n') || '_No runs yet._';

  const protocolSection = protocols
    .filter((protocol) => protocol.projectId === project.id)
    .map((protocol) => `- ${protocol.title} (v${protocol.version})`)
    .join('\n') || '_No protocols yet._';

  const datasetSection = datasetLinks
    .filter((link) => link.projectId === project.id)
    .map((link) => `- ${link.title} (${link.type}) - ${link.url}`)
    .join('\n') || '_No dataset/code links yet._';

  const extractionSection = extractions
    .filter((extraction) => extraction.projectId === project.id)
    .map((extraction) => `- Paper ${extraction.paperId}: ${extraction.keyFindingsMd || 'No findings yet.'}`)
    .join('\n') || '_No extractions yet._';

  return [
    frontmatter,
    section('Linked Papers', [paperSection]),
    section('Runs', [runSection]),
    section('Protocols', [protocolSection]),
    section('Datasets & Code', [datasetSection]),
    section('Paper Extractions', [extractionSection]),
  ].join('\n');
};

export const buildEvidenceMatrixCsv = (
  papers: Paper[],
  extractions: PaperExtraction[],
) => {
  const header = [
    'Paper Title',
    'Task Paradigms',
    'Data Types',
    'Model Types',
    'Training Objective',
    'Evaluation Metrics',
    'Key Findings',
    'Limitations',
  ];

  const rows = extractions.map((extraction) => {
    const paper = papers.find((p) => p.id === extraction.paperId);
    return [
      paper?.title ?? extraction.paperId,
      extraction.taskParadigmConceptIds.join('; '),
      extraction.dataTypeConceptIds.join('; '),
      extraction.modelTypeConceptIds.join('; '),
      extraction.trainingObjective ?? '',
      extraction.evaluationMetrics.join('; '),
      extraction.keyFindingsMd.replace(/\n/g, ' '),
      extraction.limitationsMd.replace(/\n/g, ' '),
    ].map((value) => `"${value.replace(/"/g, '""')}"`);
  });

  return [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const buildEvidenceMatrixMarkdown = (
  papers: Paper[],
  extractions: PaperExtraction[],
) => {
  const header = [
    '| Paper | Paradigms | Data Types | Models | Metrics |',
    '| --- | --- | --- | --- | --- |',
  ];

  const rows = extractions.map((extraction) => {
    const paper = papers.find((p) => p.id === extraction.paperId);
    return `| ${paper?.title ?? extraction.paperId} | ${extraction.taskParadigmConceptIds.join(', ')} | ${extraction.dataTypeConceptIds.join(', ')} | ${extraction.modelTypeConceptIds.join(', ')} | ${extraction.evaluationMetrics.join(', ')} |`;
  });

  return [...header, ...rows].join('\n');
};

export const buildBibTeXExport = (papers: Paper[]) =>
  papers.map((paper) => generateBibTeX(paper)).join('\n\n');
