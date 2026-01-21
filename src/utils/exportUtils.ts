import type { Paper } from '../types';
import type {
  CodeSnippet,
  DatasetLink,
  EvidenceItem,
  PaperExtraction,
  Project,
  Protocol,
  Run,
  SimulationRun,
} from '../domain';
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

export const buildEvidenceItemsCsv = (papers: Paper[], evidenceItems: EvidenceItem[]) => {
  const header = [
    'Paper Title',
    'Entity Type',
    'Value',
    'Unit',
    'Condition',
    'Region',
    'Species',
    'Technique',
    'Notes',
  ];

  const rows = evidenceItems.map((item) => {
    const paper = papers.find((p) => p.id === item.paperId);
    const value = item.fields.value?.value ?? '';
    const unit = item.fields.value?.unit ?? '';
    return [
      paper?.title ?? item.paperId,
      item.entityType,
      value.toString(),
      unit,
      item.fields.condition ?? '',
      item.fields.region ?? '',
      item.fields.species ?? '',
      item.fields.technique ?? '',
      item.fields.notes ?? '',
    ].map((entry) => `"${entry.toString().replace(/"/g, '""')}"`);
  });

  return [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

type ObsidianExportInput = {
  papers: Paper[];
  evidenceItems: EvidenceItem[];
  simulationRuns: SimulationRun[];
  codeSnippets: CodeSnippet[];
  ontologyLookup: Record<string, string>;
};

const buildHighlightMarkdown = (paper: Paper) => {
  const highlights = paper.highlights ?? [];
  if (!highlights.length) return '_No highlights yet._';
  return highlights
    .map((highlight) => `- (${highlight.category}) ${highlight.text}`)
    .join('\n');
};

const buildObsidianFrontmatter = (paper: Paper, ontologyTags: string[]) => [
  '---',
  `title: "${paper.title.replace(/"/g, '\\"')}"`,
  `authors: "${paper.authors ?? ''}"`,
  `year: "${paper.year ?? ''}"`,
  `doi: "${paper.doi ?? ''}"`,
  `tags: [${paper.tags?.map((tag) => `"${tag}"`).join(', ') ?? ''}]`,
  `ontologyTags: [${ontologyTags.map((tag) => `"${tag}"`).join(', ')}]`,
  '---',
  '',
].join('\n');

const buildObsidianPaper = (
  paper: Paper,
  evidenceItems: EvidenceItem[],
  simulationRuns: SimulationRun[],
  codeSnippets: CodeSnippet[],
  ontologyLookup: Record<string, string>,
) => {
  const ontologyTags = (paper.ontologyTagIds ?? []).map((id) => ontologyLookup[id] ?? id);
  const linkedEvidence = evidenceItems.filter((item) => item.paperId === paper.id);
  const linkedRuns = simulationRuns.filter((run) => run.linkedPapers.includes(paper.id));
  const linkedSnippets = codeSnippets.filter((snippet) => snippet.linkedPapers.includes(paper.id));

  const section = (title: string, body: string[]) => [`## ${title}`, ...body, ''].join('\n');

  const evidenceSection = linkedEvidence.length
    ? linkedEvidence
        .map((item) =>
          `- [[Evidence-${item.id}]] ${item.entityType}: ${item.fields.value?.value ?? ''} ${item.fields.value?.unit ?? ''}`.trim(),
        )
        .join('\n')
    : '_No evidence items yet._';

  const runSection = linkedRuns.length
    ? linkedRuns.map((run) => `- [[SimRun-${run.runLabel}]] (${run.modelId})`).join('\n')
    : '_No linked simulation runs._';

  const snippetSection = linkedSnippets.length
    ? linkedSnippets.map((snippet) => `- ${snippet.title} (${snippet.language})`).join('\n')
    : '_No linked snippets._';

  return [
    buildObsidianFrontmatter(paper, ontologyTags),
    section('Abstract', [paper.abstract || '_No abstract._']),
    section('Highlights', [buildHighlightMarkdown(paper)]),
    section('Notes', [paper.notes || '_No notes yet._']),
    section('Linked Simulation Runs', [runSection]),
    section('Evidence Items', [evidenceSection]),
    section('Code Snippets', [snippetSection]),
  ].join('\n');
};

export const buildObsidianBundle = ({
  papers,
  evidenceItems,
  simulationRuns,
  codeSnippets,
  ontologyLookup,
}: ObsidianExportInput) => {
  const sortedPapers = [...papers].sort((a, b) => a.title.localeCompare(b.title));
  const files = sortedPapers.flatMap((paper) => {
    const safeTitle = paper.title.replace(/[<>:"/\\\\|?*]/g, '').slice(0, 120) || paper.id;
    const highlightsContent = [`# Highlights for [[${paper.title}]]`, '', buildHighlightMarkdown(paper)].join('\n');
    return [
      {
        path: `${safeTitle}.md`,
        content: buildObsidianPaper(paper, evidenceItems, simulationRuns, codeSnippets, ontologyLookup),
      },
      {
        path: `Highlights/${safeTitle}-highlights.md`,
        content: highlightsContent,
      },
    ];
  });

  const runFiles = [...simulationRuns].sort((a, b) => a.runLabel.localeCompare(b.runLabel)).map((run) => {
    const linkedTitles = papers
      .filter((paper) => run.linkedPapers.includes(paper.id))
      .map((paper) => `- [[${paper.title}]]`)
      .join('\n') || '_No linked papers._';
    return {
      path: `SimRun-${run.runLabel}.md`,
      content: [`# Simulation Run: ${run.runLabel}`, '', '## Linked Papers', linkedTitles].join('\n'),
    };
  });

  const evidenceFiles = [...evidenceItems].sort((a, b) => a.id.localeCompare(b.id)).map((item) => {
    const paperTitle = papers.find((paper) => paper.id === item.paperId)?.title ?? item.paperId;
    return {
      path: `Evidence-${item.id}.md`,
      content: [
        `# Evidence Item ${item.id}`,
        '',
        `Paper: [[${paperTitle}]]`,
        `Entity Type: ${item.entityType}`,
        `Value: ${item.fields.value?.value ?? ''} ${item.fields.value?.unit ?? ''}`.trim(),
      ].join('\n'),
    };
  });
  return [...files, ...runFiles, ...evidenceFiles];
};
