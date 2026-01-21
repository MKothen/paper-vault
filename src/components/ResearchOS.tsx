import React, { useEffect, useMemo, useState } from 'react';
import type { Paper } from '../types';
import type {
  Concept,
  ConceptType,
  DatasetLink,
  PaperExtraction,
  Project,
  Protocol,
  CaptureInboxItem,
  Run,
  RunSweepDimension,
} from '../domain';
import {
  createConcept,
  createDatasetLink,
  createPaperExtraction,
  createProject,
  createProtocol,
  createRun,
  deleteDatasetLink,
  deleteProject,
  listenToUserConcepts,
  listenToUserDatasetLinks,
  listenToUserPaperExtractions,
  listenToUserProjects,
  listenToUserProtocols,
  listenToUserRuns,
  listenToCaptureInbox,
} from '../data/researchRepositories';
import { updatePaper } from '../data/papersRepository';
import { defaultConceptSeed } from '../data/seedConcepts';
import { useToast } from './ToastProvider';
import { generateRunSweep } from '../utils/runSweep';
import {
  buildBibTeXExport,
  buildEvidenceMatrixCsv,
  buildEvidenceMatrixMarkdown,
  buildProjectMarkdownExport,
  downloadTextFile,
} from '../utils/exportUtils';

const conceptTypes: ConceptType[] = [
  'BrainRegion',
  'CellType',
  'Method',
  'Paradigm',
  'Molecule',
  'Model',
  'Theory',
  'DatasetFormat',
  'Metric',
];

const runTemplates = {
  'Spiking network simulation': {
    aim: 'Simulate spiking network dynamics',
    parameters: { durationMs: 1000, dtMs: 0.1 },
  },
  'Encoding/decoding model': {
    aim: 'Train encoding/decoding model',
    parameters: { epochs: 100, optimizer: 'adam' },
  },
  'RL agent / cognitive model': {
    aim: 'Train agent for task',
    parameters: { episodes: 500, gamma: 0.99 },
  },
  'Dynamical systems analysis': {
    aim: 'Analyze latent dynamics',
    parameters: { method: 'PCA', components: 10 },
  },
};

type ResearchOSProps = {
  userId: string;
  papers: Paper[];
  onBack: () => void;
};

export function ResearchOS({ userId, papers, onBack }: ResearchOSProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'projects' | 'concepts' | 'runs' | 'protocols' | 'datasets' | 'evidence' | 'export'>('projects');

  const [projects, setProjects] = useState<Project[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [datasetLinks, setDatasetLinks] = useState<DatasetLink[]>([]);
  const [extractions, setExtractions] = useState<PaperExtraction[]>([]);
  const [captureInbox, setCaptureInbox] = useState<CaptureInboxItem[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    conceptIds: [] as string[],
  });

  const [conceptForm, setConceptForm] = useState({
    name: '',
    type: 'Method' as ConceptType,
    aliases: '',
  });

  const [runForm, setRunForm] = useState({
    projectId: '',
    template: 'Spiking network simulation',
    date: new Date().toISOString().slice(0, 10),
    aim: '',
    modelConceptIds: [] as string[],
    methodConceptIds: [] as string[],
    datasetLinks: [] as string[],
    codeLinks: [] as string[],
    parameters: '{}',
  });

  const [sweepDimensions, setSweepDimensions] = useState<RunSweepDimension[]>([]);

  const [protocolForm, setProtocolForm] = useState({
    projectId: '',
    title: '',
    version: '1.0',
    bodyMd: '',
    checklistText: '',
  });

  const [datasetForm, setDatasetForm] = useState({
    projectId: '',
    type: 'Dataset' as DatasetLink['type'],
    title: '',
    url: '',
    description: '',
  });

  const [extractionForm, setExtractionForm] = useState({
    projectId: '',
    paperId: '',
    taskParadigmConceptIds: [] as string[],
    dataTypeConceptIds: [] as string[],
    modelTypeConceptIds: [] as string[],
    trainingObjective: '',
    evaluationMetrics: '',
    keyFindingsMd: '',
    limitationsMd: '',
  });

  const [compareSelection, setCompareSelection] = useState({ left: '', right: '' });
  const appBaseUrl = import.meta.env.VITE_APP_BASE_URL || window.location.origin;
  const captureBookmarklet = `javascript:(() => {const url=encodeURIComponent(location.href);const title=encodeURIComponent(document.title);const target='${appBaseUrl.replace(/'/g, "\\'")}/?capture='+url+'&title='+title;window.open(target,'_blank');})();`;

  useEffect(() => {
    const unsubProjects = listenToUserProjects(userId, setProjects);
    const unsubConcepts = listenToUserConcepts(userId, setConcepts);
    const unsubRuns = listenToUserRuns(userId, setRuns);
    const unsubProtocols = listenToUserProtocols(userId, setProtocols);
    const unsubDatasets = listenToUserDatasetLinks(userId, setDatasetLinks);
    const unsubExtractions = listenToUserPaperExtractions(userId, setExtractions);
    const unsubInbox = listenToCaptureInbox(userId, setCaptureInbox);

    return () => {
      unsubProjects();
      unsubConcepts();
      unsubRuns();
      unsubProtocols();
      unsubDatasets();
      unsubExtractions();
      unsubInbox();
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const conceptLookup = useMemo(
    () => new Map(concepts.map((concept) => [concept.id, concept.name])),
    [concepts],
  );

  const linkedPapers = useMemo(
    () => papers.filter((paper) => activeProject && paper.projectIds?.includes(activeProject.id)),
    [papers, activeProject],
  );

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) return;
    await createProject(userId, {
      name: projectForm.name,
      description: projectForm.description,
      conceptIds: projectForm.conceptIds,
      archived: false,
      paperIds: [],
      status: 'active',
      milestones: [],
      collaborators: [],
    });
    setProjectForm({ name: '', description: '', conceptIds: [] });
    addToast('Project created.', 'success');
  };

  const handleSeedConcepts = async () => {
    const existing = new Set(concepts.map((concept) => `${concept.type}:${concept.name}`));
    const toCreate = defaultConceptSeed().filter(
      (seed) => !existing.has(`${seed.type}:${seed.name}`),
    );
    await Promise.all(
      toCreate.map((seed) =>
        createConcept(userId, {
          name: seed.name,
          type: seed.type,
          aliases: seed.aliases,
          parentId: undefined,
        }),
      ),
    );
    addToast('Default concepts seeded.', 'success');
  };

  const handleCreateConcept = async () => {
    if (!conceptForm.name.trim()) return;
    await createConcept(userId, {
      name: conceptForm.name.trim(),
      type: conceptForm.type,
      aliases: conceptForm.aliases
        .split(',')
        .map((alias) => alias.trim())
        .filter(Boolean),
      parentId: undefined,
    });
    setConceptForm({ name: '', type: 'Method', aliases: '' });
    addToast('Concept added.', 'success');
  };

  const handleCreateRun = async () => {
    if (!runForm.projectId) return;
    let parameters: Record<string, unknown> = {};
    try {
      parameters = JSON.parse(runForm.parameters || '{}');
    } catch (error) {
      addToast('Parameters JSON is invalid.', 'error');
      return;
    }

    const templateDefaults = runTemplates[runForm.template as keyof typeof runTemplates];
    const baseRunInput = {
      projectId: runForm.projectId,
      date: runForm.date,
      aim: runForm.aim || templateDefaults.aim,
      modelConceptIds: runForm.modelConceptIds,
      methodConceptIds: runForm.methodConceptIds,
      datasetLinks: runForm.datasetLinks,
      codeLinks: runForm.codeLinks,
      parameters: { ...templateDefaults.parameters, ...parameters },
      resultsSummaryMd: '',
      metrics: [],
      artifacts: [],
      qcMd: '',
      parentRunId: undefined,
      sweepKey: undefined,
    };

    if (sweepDimensions.length > 0) {
      const parentId = await createRun(userId, {
        ...baseRunInput,
      });

      const sweep = generateRunSweep(
        {
          id: parentId,
          ...baseRunInput,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        sweepDimensions,
      );
      await Promise.all(
        sweep.childRuns.map((child) => {
          const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = child;
          return createRun(userId, {
            ...payload,
            parentRunId: parentId,
          });
        }),
      );
      addToast('Parameter sweep created.', 'success');
    } else {
      await createRun(userId, baseRunInput);
      addToast('Run logged.', 'success');
    }

    setRunForm({
      projectId: runForm.projectId,
      template: 'Spiking network simulation',
      date: new Date().toISOString().slice(0, 10),
      aim: '',
      modelConceptIds: [],
      methodConceptIds: [],
      datasetLinks: [],
      codeLinks: [],
      parameters: '{}',
    });
    setSweepDimensions([]);
  };

  const handleCreateProtocol = async () => {
    if (!protocolForm.projectId || !protocolForm.title.trim()) return;
    const checklist = protocolForm.checklistText
      .split('\n')
      .map((line, idx) => ({ id: `item_${idx}_${Date.now()}`, text: line.trim(), done: false }))
      .filter((item) => item.text.length > 0);

    await createProtocol(userId, {
      projectId: protocolForm.projectId,
      title: protocolForm.title,
      version: protocolForm.version,
      bodyMd: protocolForm.bodyMd,
      checklist,
      attachments: [],
    });
    setProtocolForm({ projectId: protocolForm.projectId, title: '', version: '1.0', bodyMd: '', checklistText: '' });
    addToast('Protocol created.', 'success');
  };

  const handleCreateDatasetLink = async () => {
    if (!datasetForm.projectId || !datasetForm.title.trim() || !datasetForm.url.trim()) return;
    await createDatasetLink(userId, {
      projectId: datasetForm.projectId,
      type: datasetForm.type,
      title: datasetForm.title,
      url: datasetForm.url,
      description: datasetForm.description,
      formatConceptIds: [],
      license: undefined,
      version: undefined,
    });
    setDatasetForm({ projectId: datasetForm.projectId, type: 'Dataset', title: '', url: '', description: '' });
    addToast('Dataset link added.', 'success');
  };

  const handleCreateExtraction = async () => {
    if (!extractionForm.paperId) return;
    await createPaperExtraction(userId, {
      paperId: extractionForm.paperId,
      projectId: extractionForm.projectId || undefined,
      taskParadigmConceptIds: extractionForm.taskParadigmConceptIds,
      dataTypeConceptIds: extractionForm.dataTypeConceptIds,
      modelTypeConceptIds: extractionForm.modelTypeConceptIds,
      trainingObjective: extractionForm.trainingObjective,
      evaluationMetrics: extractionForm.evaluationMetrics
        .split(',')
        .map((metric) => metric.trim())
        .filter(Boolean),
      keyFindingsMd: extractionForm.keyFindingsMd,
      limitationsMd: extractionForm.limitationsMd,
      reproChecklist: [],
      linkedRunIds: [],
      linkedConceptIds: [],
    });
    setExtractionForm({
      projectId: extractionForm.projectId,
      paperId: '',
      taskParadigmConceptIds: [],
      dataTypeConceptIds: [],
      modelTypeConceptIds: [],
      trainingObjective: '',
      evaluationMetrics: '',
      keyFindingsMd: '',
      limitationsMd: '',
    });
    addToast('Extraction saved.', 'success');
  };

  const handleLinkPaperToProject = async (paperId: string, projectId: string, isLinked: boolean) => {
    const paper = papers.find((p) => p.id === paperId);
    if (!paper) return;
    const nextProjectIds = new Set(paper.projectIds ?? []);
    if (isLinked) {
      nextProjectIds.add(projectId);
    } else {
      nextProjectIds.delete(projectId);
    }
    await updatePaper(paperId, { projectIds: Array.from(nextProjectIds) });
  };

  const renderConceptCheckboxes = (selected: string[], onChange: (next: string[]) => void, filterType?: ConceptType) => {
    const available = filterType ? concepts.filter((c) => c.type === filterType) : concepts;
    return (
      <div className="grid grid-cols-2 gap-2">
        {available.map((concept) => (
          <label key={concept.id} className="text-xs flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(concept.id)}
              onChange={(event) => {
                const next = new Set(selected);
                if (event.target.checked) next.add(concept.id);
                else next.delete(concept.id);
                onChange(Array.from(next));
              }}
            />
            {concept.name}
          </label>
        ))}
      </div>
    );
  };

  const renderProjectSelect = (value: string, onChange: (value: string) => void) => (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="nb-input w-full"
    >
      <option value="">Select project...</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-h-screen bg-nb-gray flex flex-col">
      <header className="bg-white border-b-4 border-black p-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase">Computational Neuroscience Research OS</h1>
          <p className="text-xs font-bold uppercase text-gray-500">Projects → Concepts → Runs → Evidence → Export</p>
        </div>
        <button onClick={onBack} className="nb-button">Back to Library</button>
      </header>

      <nav className="bg-white border-b-4 border-black px-4 py-2 flex gap-3 text-sm font-black uppercase">
        {([
          ['projects', 'Projects'],
          ['concepts', 'Concepts'],
          ['runs', 'Runs'],
          ['protocols', 'Protocols'],
          ['datasets', 'Datasets'],
          ['evidence', 'Evidence'],
          ['export', 'Export'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-1 border-b-4 ${activeTab === key ? 'border-nb-purple' : 'border-transparent'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Create Project</h2>
              <input
                className="nb-input"
                placeholder="Project name"
                value={projectForm.name}
                onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
              />
              <textarea
                className="nb-input h-24"
                placeholder="Description"
                value={projectForm.description}
                onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })}
              />
              <div>
                <p className="text-xs font-bold uppercase mb-2">Concept Anchors</p>
                {renderConceptCheckboxes(projectForm.conceptIds, (next) =>
                  setProjectForm({ ...projectForm, conceptIds: next }),
                )}
              </div>
              <button onClick={handleCreateProject} className="nb-button w-full">Create</button>
            </section>

            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Projects</h2>
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`border-2 border-black p-2 cursor-pointer ${
                      selectedProjectId === project.id ? 'bg-nb-yellow' : 'bg-white'
                    }`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <div className="font-black">{project.name}</div>
                    <div className="text-xs text-gray-600">{project.description}</div>
                  </div>
                ))}
                {projects.length === 0 && <p className="text-sm text-gray-500">No projects yet.</p>}
              </div>
              {selectedProjectId && (
                <button
                  onClick={() => deleteProject(userId, selectedProjectId)}
                  className="nb-button bg-red-500 text-white"
                >
                  Archive Project
                </button>
              )}
            </section>

            <section className="nb-card p-4 space-y-4">
              <h2 className="text-xl font-black uppercase">Project Dashboard</h2>
              {activeProject ? (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Pinned Papers</p>
                    <ul className="text-sm list-disc list-inside">
                      {linkedPapers.map((paper) => (
                        <li key={paper.id}>{paper.title}</li>
                      ))}
                    </ul>
                    {linkedPapers.length === 0 && <p className="text-sm text-gray-500">No linked papers yet.</p>}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Concept Anchors</p>
                    <div className="flex flex-wrap gap-2">
                      {activeProject.conceptIds.map((conceptId) => (
                        <span key={conceptId} className="text-xs border-2 border-black px-2 py-1">
                          {conceptLookup.get(conceptId) ?? conceptId}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Latest Runs</p>
                    <ul className="text-sm list-disc list-inside">
                      {runs
                        .filter((run) => run.projectId === activeProject.id)
                        .slice(0, 3)
                        .map((run) => (
                          <li key={run.id}>{run.date}: {run.aim ?? 'Run'}</li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">Link Papers</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {papers.map((paper) => {
                        const linked = paper.projectIds?.includes(activeProject.id) ?? false;
                        return (
                          <label key={paper.id} className="text-xs flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={linked}
                              onChange={(event) =>
                                handleLinkPaperToProject(paper.id, activeProject.id, event.target.checked)
                              }
                            />
                            {paper.title}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Select a project to view its dashboard.</p>
              )}
            </section>
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Add Concept</h2>
              <input
                className="nb-input"
                placeholder="Concept name"
                value={conceptForm.name}
                onChange={(event) => setConceptForm({ ...conceptForm, name: event.target.value })}
              />
              <select
                className="nb-input"
                value={conceptForm.type}
                onChange={(event) => setConceptForm({ ...conceptForm, type: event.target.value as ConceptType })}
              >
                {conceptTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                className="nb-input"
                placeholder="Aliases (comma separated)"
                value={conceptForm.aliases}
                onChange={(event) => setConceptForm({ ...conceptForm, aliases: event.target.value })}
              />
              <button onClick={handleCreateConcept} className="nb-button w-full">Add Concept</button>
              <button onClick={handleSeedConcepts} className="nb-button w-full bg-nb-cyan">Seed Default Concepts</button>
            </section>
            <section className="nb-card p-4 lg:col-span-2">
              <h2 className="text-xl font-black uppercase mb-4">Concept Browser</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {concepts.map((concept) => (
                  <div key={concept.id} className="border-2 border-black p-2 bg-white">
                    <div className="text-xs font-bold uppercase text-gray-500">{concept.type}</div>
                    <div className="font-black">{concept.name}</div>
                    {concept.aliases.length > 0 && (
                      <div className="text-xs text-gray-600">Aliases: {concept.aliases.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'runs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Log Run</h2>
              {renderProjectSelect(runForm.projectId, (value) => setRunForm({ ...runForm, projectId: value }))}
              <select
                className="nb-input"
                value={runForm.template}
                onChange={(event) => setRunForm({ ...runForm, template: event.target.value })}
              >
                {Object.keys(runTemplates).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <input
                className="nb-input"
                type="date"
                value={runForm.date}
                onChange={(event) => setRunForm({ ...runForm, date: event.target.value })}
              />
              <input
                className="nb-input"
                placeholder="Aim"
                value={runForm.aim}
                onChange={(event) => setRunForm({ ...runForm, aim: event.target.value })}
              />
              <div>
                <p className="text-xs font-bold uppercase">Model Concepts</p>
                {renderConceptCheckboxes(runForm.modelConceptIds, (next) =>
                  setRunForm({ ...runForm, modelConceptIds: next }),
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase">Method Concepts</p>
                {renderConceptCheckboxes(runForm.methodConceptIds, (next) =>
                  setRunForm({ ...runForm, methodConceptIds: next }),
                )}
              </div>
              <textarea
                className="nb-input h-24"
                placeholder='Parameters JSON e.g. {"lr":0.01}'
                value={runForm.parameters}
                onChange={(event) => setRunForm({ ...runForm, parameters: event.target.value })}
              />
              <button onClick={handleCreateRun} className="nb-button w-full">Save Run</button>
            </section>

            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Parameter Sweep</h2>
              {sweepDimensions.map((dimension, idx) => (
                <div key={dimension.key} className="border-2 border-black p-2 bg-white">
                  <div className="font-bold text-xs uppercase">{dimension.key}</div>
                  <div className="text-xs">Values: {dimension.values.join(', ')}</div>
                  <button
                    className="text-xs underline"
                    onClick={() => setSweepDimensions((prev) => prev.filter((_, index) => index !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <SweepDimensionForm
                onAdd={(dimension) => setSweepDimensions((prev) => [...prev, dimension])}
              />
              <p className="text-xs text-gray-500">Generate child runs for each parameter combination.</p>
            </section>

            <section className="nb-card p-4">
              <h2 className="text-xl font-black uppercase mb-3">Recent Runs</h2>
              <div className="space-y-2">
                {runs.slice(0, 8).map((run) => (
                  <div key={run.id} className="border-2 border-black p-2">
                    <div className="font-black">{run.aim || 'Run'}</div>
                    <div className="text-xs text-gray-600">{run.date} • {run.projectId}</div>
                    {run.sweepKey && <div className="text-xs">Sweep: {run.sweepKey}</div>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Create Protocol</h2>
              {renderProjectSelect(protocolForm.projectId, (value) => setProtocolForm({ ...protocolForm, projectId: value }))}
              <input
                className="nb-input"
                placeholder="Protocol title"
                value={protocolForm.title}
                onChange={(event) => setProtocolForm({ ...protocolForm, title: event.target.value })}
              />
              <input
                className="nb-input"
                placeholder="Version"
                value={protocolForm.version}
                onChange={(event) => setProtocolForm({ ...protocolForm, version: event.target.value })}
              />
              <textarea
                className="nb-input h-24"
                placeholder="Protocol body (Markdown)"
                value={protocolForm.bodyMd}
                onChange={(event) => setProtocolForm({ ...protocolForm, bodyMd: event.target.value })}
              />
              <textarea
                className="nb-input h-24"
                placeholder="Checklist items (one per line)"
                value={protocolForm.checklistText}
                onChange={(event) => setProtocolForm({ ...protocolForm, checklistText: event.target.value })}
              />
              <button onClick={handleCreateProtocol} className="nb-button w-full">Save Protocol</button>
            </section>
            <section className="nb-card p-4 lg:col-span-2">
              <h2 className="text-xl font-black uppercase mb-3">Protocols</h2>
              <div className="space-y-2">
                {protocols.map((protocol) => (
                  <div key={protocol.id} className="border-2 border-black p-3">
                    <div className="font-black">{protocol.title}</div>
                    <div className="text-xs text-gray-500">Project: {protocol.projectId}</div>
                    <div className="text-xs">Checklist: {protocol.checklist.length} items</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Add Dataset/Code</h2>
              {renderProjectSelect(datasetForm.projectId, (value) => setDatasetForm({ ...datasetForm, projectId: value }))}
              <select
                className="nb-input"
                value={datasetForm.type}
                onChange={(event) => setDatasetForm({ ...datasetForm, type: event.target.value as DatasetLink['type'] })}
              >
                <option value="Dataset">Dataset</option>
                <option value="Code">Code</option>
                <option value="Notebook">Notebook</option>
              </select>
              <input
                className="nb-input"
                placeholder="Title"
                value={datasetForm.title}
                onChange={(event) => setDatasetForm({ ...datasetForm, title: event.target.value })}
              />
              <input
                className="nb-input"
                placeholder="URL"
                value={datasetForm.url}
                onChange={(event) => setDatasetForm({ ...datasetForm, url: event.target.value })}
              />
              <textarea
                className="nb-input h-24"
                placeholder="Description"
                value={datasetForm.description}
                onChange={(event) => setDatasetForm({ ...datasetForm, description: event.target.value })}
              />
              <button onClick={handleCreateDatasetLink} className="nb-button w-full">Add Link</button>
            </section>
            <section className="nb-card p-4 lg:col-span-2">
              <h2 className="text-xl font-black uppercase mb-3">Dataset & Code Links</h2>
              <div className="space-y-2">
                {datasetLinks.map((link) => (
                  <div key={link.id} className="border-2 border-black p-3">
                    <div className="font-black">{link.title}</div>
                    <div className="text-xs text-gray-500">{link.type} • {link.projectId}</div>
                    <a href={link.url} className="text-xs underline" target="_blank" rel="noreferrer">{link.url}</a>
                    <button
                      onClick={() => deleteDatasetLink(userId, link.id)}
                      className="text-xs text-red-600 underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Extract Paper</h2>
              {renderProjectSelect(extractionForm.projectId, (value) => setExtractionForm({ ...extractionForm, projectId: value }))}
              <select
                className="nb-input"
                value={extractionForm.paperId}
                onChange={(event) => setExtractionForm({ ...extractionForm, paperId: event.target.value })}
              >
                <option value="">Select paper...</option>
                {papers.map((paper) => (
                  <option key={paper.id} value={paper.id}>{paper.title}</option>
                ))}
              </select>
              <div>
                <p className="text-xs font-bold uppercase">Task Paradigm Concepts</p>
                {renderConceptCheckboxes(extractionForm.taskParadigmConceptIds, (next) =>
                  setExtractionForm({ ...extractionForm, taskParadigmConceptIds: next }),
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase">Data Type Concepts</p>
                {renderConceptCheckboxes(extractionForm.dataTypeConceptIds, (next) =>
                  setExtractionForm({ ...extractionForm, dataTypeConceptIds: next }),
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase">Model Type Concepts</p>
                {renderConceptCheckboxes(extractionForm.modelTypeConceptIds, (next) =>
                  setExtractionForm({ ...extractionForm, modelTypeConceptIds: next }),
                )}
              </div>
              <input
                className="nb-input"
                placeholder="Training objective"
                value={extractionForm.trainingObjective}
                onChange={(event) => setExtractionForm({ ...extractionForm, trainingObjective: event.target.value })}
              />
              <input
                className="nb-input"
                placeholder="Evaluation metrics (comma separated)"
                value={extractionForm.evaluationMetrics}
                onChange={(event) => setExtractionForm({ ...extractionForm, evaluationMetrics: event.target.value })}
              />
              <textarea
                className="nb-input h-24"
                placeholder="Key findings (Markdown)"
                value={extractionForm.keyFindingsMd}
                onChange={(event) => setExtractionForm({ ...extractionForm, keyFindingsMd: event.target.value })}
              />
              <textarea
                className="nb-input h-24"
                placeholder="Limitations (Markdown)"
                value={extractionForm.limitationsMd}
                onChange={(event) => setExtractionForm({ ...extractionForm, limitationsMd: event.target.value })}
              />
              <button onClick={handleCreateExtraction} className="nb-button w-full">Save Extraction</button>
            </section>
            <section className="nb-card p-4 lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-xl font-black uppercase mb-3">Evidence Matrix</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-2 border-black">
                    <thead className="bg-nb-yellow">
                      <tr>
                        <th className="border-2 border-black p-2">Paper</th>
                        <th className="border-2 border-black p-2">Models</th>
                        <th className="border-2 border-black p-2">Data Types</th>
                        <th className="border-2 border-black p-2">Metrics</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractions.map((extraction) => (
                        <tr key={extraction.id}>
                          <td className="border-2 border-black p-2">
                            {papers.find((paper) => paper.id === extraction.paperId)?.title ?? extraction.paperId}
                          </td>
                          <td className="border-2 border-black p-2">
                            {extraction.modelTypeConceptIds.map((id) => conceptLookup.get(id) ?? id).join(', ')}
                          </td>
                          <td className="border-2 border-black p-2">
                            {extraction.dataTypeConceptIds.map((id) => conceptLookup.get(id) ?? id).join(', ')}
                          </td>
                          <td className="border-2 border-black p-2">
                            {extraction.evaluationMetrics.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black uppercase mb-2">Compare Papers</h2>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="nb-input"
                    value={compareSelection.left}
                    onChange={(event) => setCompareSelection({ ...compareSelection, left: event.target.value })}
                  >
                    <option value="">Left paper</option>
                    {extractions.map((extraction) => (
                      <option key={extraction.id} value={extraction.id}>
                        {papers.find((paper) => paper.id === extraction.paperId)?.title ?? extraction.paperId}
                      </option>
                    ))}
                  </select>
                  <select
                    className="nb-input"
                    value={compareSelection.right}
                    onChange={(event) => setCompareSelection({ ...compareSelection, right: event.target.value })}
                  >
                    <option value="">Right paper</option>
                    {extractions.map((extraction) => (
                      <option key={extraction.id} value={extraction.id}>
                        {papers.find((paper) => paper.id === extraction.paperId)?.title ?? extraction.paperId}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {[compareSelection.left, compareSelection.right].map((id, idx) => {
                    const extraction = extractions.find((item) => item.id === id);
                    if (!extraction) return <div key={idx} className="border-2 border-black p-3 text-sm">Select an extraction.</div>;
                    return (
                      <div key={extraction.id} className="border-2 border-black p-3 text-sm">
                        <div className="font-black mb-2">{papers.find((paper) => paper.id === extraction.paperId)?.title ?? extraction.paperId}</div>
                        <div className="text-xs text-gray-500 uppercase">Findings</div>
                        <p>{extraction.keyFindingsMd || 'No findings yet.'}</p>
                        <div className="text-xs text-gray-500 uppercase mt-2">Limitations</div>
                        <p>{extraction.limitationsMd || 'No limitations yet.'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Project Export</h2>
              {renderProjectSelect(selectedProjectId ?? '', (value) => setSelectedProjectId(value))}
              <button
                onClick={() => {
                  if (!activeProject) return;
                  const markdown = buildProjectMarkdownExport(
                    activeProject,
                    papers,
                    extractions,
                    runs,
                    protocols,
                    datasetLinks,
                  );
                  downloadTextFile(`${activeProject.name}.md`, markdown);
                }}
                className="nb-button w-full"
              >
                Export Markdown (Obsidian)
              </button>
            </section>
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">Evidence Matrix Export</h2>
              <button
                onClick={() => {
                  const csv = buildEvidenceMatrixCsv(papers, extractions);
                  downloadTextFile('evidence-matrix.csv', csv);
                }}
                className="nb-button w-full"
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  const md = buildEvidenceMatrixMarkdown(papers, extractions);
                  downloadTextFile('evidence-matrix.md', md);
                }}
                className="nb-button w-full"
              >
                Export Markdown
              </button>
            </section>
            <section className="nb-card p-4 space-y-3">
              <h2 className="text-xl font-black uppercase">BibTeX</h2>
              <button
                onClick={() => {
                  const linked = activeProject
                    ? papers.filter((paper) => paper.projectIds?.includes(activeProject.id))
                    : papers;
                  const bibtex = buildBibTeXExport(linked);
                  downloadTextFile('paper-vault.bib', bibtex);
                }}
                className="nb-button w-full"
              >
                Export Reading List BibTeX
              </button>
              <p className="text-xs text-gray-500">Uses linked papers when a project is selected.</p>
            </section>
            <section className="nb-card p-4 space-y-3 lg:col-span-3">
              <h2 className="text-xl font-black uppercase">Capture Inbox</h2>
              <p className="text-xs text-gray-500">
                Drag this link to your bookmarks bar to capture DOI/URLs into PaperVault.
              </p>
              <a className="nb-button inline-block" href={captureBookmarklet}>
                📌 Capture to PaperVault
              </a>
              <div className="mt-4 space-y-2">
                {captureInbox.length === 0 && (
                  <p className="text-sm text-gray-500">No captured links yet.</p>
                )}
                {captureInbox.map((item) => (
                  <div key={item.id} className="border-2 border-black p-2 text-sm">
                    <div className="font-black">{item.title || item.url}</div>
                    <a href={item.url} className="text-xs underline" target="_blank" rel="noreferrer">
                      {item.url}
                    </a>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function SweepDimensionForm({ onAdd }: { onAdd: (dimension: RunSweepDimension) => void }) {
  const [key, setKey] = useState('');
  const [values, setValues] = useState('');

  const handleAdd = () => {
    if (!key.trim() || !values.trim()) return;
    const parsedValues = values
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        const numeric = Number(value);
        return Number.isNaN(numeric) ? value : numeric;
      });
    onAdd({ key: key.trim(), values: parsedValues });
    setKey('');
    setValues('');
  };

  return (
    <div className="space-y-2">
      <input
        className="nb-input"
        placeholder="Parameter key (e.g., lr)"
        value={key}
        onChange={(event) => setKey(event.target.value)}
      />
      <input
        className="nb-input"
        placeholder="Values (comma separated)"
        value={values}
        onChange={(event) => setValues(event.target.value)}
      />
      <button onClick={handleAdd} className="nb-button w-full">Add Dimension</button>
    </div>
  );
}
