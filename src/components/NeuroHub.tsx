import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileUp, Plus, Search } from 'lucide-react';
import type { Paper } from '../types';
import type {
  CodeSnippet,
  EvidenceItem,
  EvidenceEntityType,
  OntologyNode,
  OntologyNodeType,
  SimulationModel,
  SimulationRun,
} from '../domain';
import {
  createCodeSnippet,
  createEvidenceItem,
  createOntologyNode,
  createSimulationModel,
  createSimulationRun,
  listenToUserCodeSnippets,
  listenToUserEvidenceItems,
  listenToUserOntologyNodes,
  listenToUserSimulationModels,
  listenToUserSimulationRuns,
  updateSimulationRun,
} from '../data/neuroRepositories';
import { defaultOntologySeed } from '../data/seedOntology';
import { useToast } from './ToastProvider';
import { OntologyTagPicker } from './OntologyTagPicker';
import { buildEvidenceItemsCsv, buildObsidianBundle, downloadTextFile } from '../utils/exportUtils';
import { validateSimulationRunLog } from '../utils/simulationLog';
import { isSupportedUnit } from '../utils/units';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const ontologyTypes: OntologyNodeType[] = [
  'brainRegion',
  'ionChannel',
  'plasticity',
  'circuitMotif',
  'modelType',
  'technique',
  'drug',
  'species',
  'preparation',
  'other',
];

const evidenceTypes: EvidenceEntityType[] = [
  'ionChannelKinetics',
  'plasticityRule',
  'firingRate',
  'membraneConstant',
  'synapticWeight',
];

const unitOptions = ['ms', 'mV', 'nS', 'Hz', '°C', 'pA', 'nA'];

type NeuroHubProps = {
  userId: string;
  papers: Paper[];
  onBack: () => void;
};

export function NeuroHub({ userId, papers, onBack }: NeuroHubProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'ontology' | 'simulations' | 'evidence' | 'exports' | 'snippets'>(
    'ontology',
  );

  const [ontologyNodes, setOntologyNodes] = useState<OntologyNode[]>([]);
  const [simulationModels, setSimulationModels] = useState<SimulationModel[]>([]);
  const [simulationRuns, setSimulationRuns] = useState<SimulationRun[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);

  const [ontologyForm, setOntologyForm] = useState({
    label: '',
    type: 'brainRegion' as OntologyNodeType,
    parentId: '',
    synonyms: '',
  });

  const [modelForm, setModelForm] = useState({
    name: '',
    description: '',
    framework: 'brian2' as SimulationModel['framework'],
  });

  const [runImportForm, setRunImportForm] = useState({
    modelId: '',
    runLabel: '',
    linkedPapers: [] as string[],
    tags: [] as string[],
  });
  const [logFile, setLogFile] = useState<File | null>(null);
  const [logData, setLogData] = useState<ReturnType<typeof validateSimulationRunLog> | null>(null);
  const [artifactFiles, setArtifactFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [runFilters, setRunFilters] = useState({ modelId: '', tagId: '' });

  const [evidenceForm, setEvidenceForm] = useState({
    paperId: '',
    entityType: 'ionChannelKinetics' as EvidenceEntityType,
    condition: '',
    region: '',
    species: '',
    technique: '',
    tauMs: '',
    tauUnit: 'ms',
    vHalf: '',
    vHalfUnit: 'mV',
    gmax: '',
    gmaxUnit: 'nS',
    temperature: '',
    temperatureUnit: '°C',
    tauPre: '',
    tauPreUnit: 'ms',
    tauPost: '',
    tauPostUnit: 'ms',
    learningRate: '',
    firingRate: '',
    firingRateUnit: 'Hz',
    membraneTau: '',
    membraneTauUnit: 'ms',
    synapticWeight: '',
    synapticWeightUnit: 'nS',
    notes: '',
    sourceQuote: '',
    sourcePage: '',
    tags: [] as string[],
  });

  const [snippetForm, setSnippetForm] = useState({
    title: '',
    language: 'python',
    code: '',
    linkedPapers: [] as string[],
    linkedModels: [] as string[],
    tags: [] as string[],
  });
  const [snippetSearch, setSnippetSearch] = useState('');

  useEffect(() => {
    const unsubOntology = listenToUserOntologyNodes(userId, setOntologyNodes);
    const unsubModels = listenToUserSimulationModels(userId, setSimulationModels);
    const unsubRuns = listenToUserSimulationRuns(userId, setSimulationRuns);
    const unsubEvidence = listenToUserEvidenceItems(userId, setEvidenceItems);
    const unsubSnippets = listenToUserCodeSnippets(userId, setCodeSnippets);
    return () => {
      unsubOntology();
      unsubModels();
      unsubRuns();
      unsubEvidence();
      unsubSnippets();
    };
  }, [userId]);

  const ontologyLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    ontologyNodes.forEach((node) => {
      lookup[node.id] = node.label;
    });
    return lookup;
  }, [ontologyNodes]);

  const paperLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    papers.forEach((paper) => {
      lookup[paper.id] = paper.title;
    });
    return lookup;
  }, [papers]);

  const filteredSnippets = useMemo(() => {
    if (!snippetSearch.trim()) return codeSnippets;
    const query = snippetSearch.toLowerCase();
    return codeSnippets.filter(
      (snippet) =>
        snippet.title.toLowerCase().includes(query) ||
        snippet.language.toLowerCase().includes(query) ||
        snippet.code.toLowerCase().includes(query),
    );
  }, [codeSnippets, snippetSearch]);

  const filteredRuns = useMemo(() => {
    return simulationRuns.filter((run) => {
      if (runFilters.modelId && run.modelId !== runFilters.modelId) return false;
      if (runFilters.tagId && !run.tags.includes(runFilters.tagId)) return false;
      return true;
    });
  }, [simulationRuns, runFilters]);

  const handleCreateOntologyNode = async () => {
    if (!ontologyForm.label.trim()) return;
    await createOntologyNode(userId, {
      label: ontologyForm.label.trim(),
      type: ontologyForm.type,
      parentId: ontologyForm.parentId || null,
      path: [],
      synonyms: ontologyForm.synonyms
        .split(',')
        .map((synonym) => synonym.trim())
        .filter(Boolean),
      externalRefs: [],
    });
    setOntologyForm({ label: '', type: ontologyForm.type, parentId: '', synonyms: '' });
  };

  const handleSeedOntology = async () => {
    if (ontologyNodes.length > 0) {
      addToast('Ontology already has nodes. Clear before reseeding.', 'error');
      return;
    }
    const seed = defaultOntologySeed();
    const keyToId = new Map<string, string>();
    const keyToPath = new Map<string, string[]>();
    for (const node of seed) {
      const parentId = node.parentKey ? keyToId.get(node.parentKey) ?? null : null;
      const parentPath = node.parentKey ? keyToPath.get(node.parentKey) ?? [] : [];
      const path = [...parentPath, node.label];
      const id = await createOntologyNode(userId, {
        label: node.label,
        type: node.type,
        parentId,
        path,
        synonyms: node.synonyms ?? [],
        externalRefs: [],
      });
      keyToId.set(node.seedKey, id);
      keyToPath.set(node.seedKey, path);
    }
    addToast('Default ontology seeded.', 'success');
  };

  const handleCreateModel = async () => {
    if (!modelForm.name.trim()) return;
    await createSimulationModel(userId, {
      name: modelForm.name.trim(),
      description: modelForm.description.trim(),
      framework: modelForm.framework,
      files: [],
      linkedPapers: [],
      assumptionsMd: '',
      validationPapers: [],
      parametersSchema: {},
      defaultParams: {},
    });
    setModelForm({ name: '', description: '', framework: modelForm.framework });
  };

  const handleLogUpload = async (file: File) => {
    setLogFile(file);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = validateSimulationRunLog(parsed);
      setLogData(result);
      if (!result.success) {
        addToast('Simulation log is invalid. Check errors.', 'error');
      }
    } catch (error) {
      console.error(error);
      setLogData({ success: false, errors: ['Unable to parse JSON file.'] });
    }
  };

  const handleImportRun = async () => {
    if (!logData || !logData.success) {
      addToast('Please upload a valid simulation log.', 'error');
      return;
    }
    if (!runImportForm.modelId) {
      addToast('Select a model for this run.', 'error');
      return;
    }
    setIsImporting(true);
    try {
      const log = logData.data;
      const runId = await createSimulationRun(userId, {
        modelId: runImportForm.modelId,
        runLabel: runImportForm.runLabel || log.runLabel || log.modelRef,
        timestampStart: log.timestamps.start,
        timestampEnd: log.timestamps.end,
        params: log.params,
        randomSeed: log.randomSeed,
        environment: log.environment,
        outputs: [],
        metrics: log.metrics,
        linkedPapers: runImportForm.linkedPapers,
        notesMd: '',
        tags: runImportForm.tags,
      });

      const uploads = await Promise.all(
        artifactFiles.map(async (file) => {
          const storageKey = `users/${userId}/simulations/${runId}/artifacts/${file.name}`;
          const fileRef = ref(storage, storageKey);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          return {
            fileName: file.name,
            storageKey,
            url,
            contentType: file.type,
          };
        }),
      );

      if (uploads.length > 0) {
        await updateSimulationRun(userId, runId, { outputs: uploads });
      }
      setRunImportForm({ modelId: '', runLabel: '', linkedPapers: [], tags: [] });
      setLogFile(null);
      setLogData(null);
      setArtifactFiles([]);
      addToast('Simulation run imported.', 'success');
    } catch (error) {
      console.error(error);
      addToast('Failed to import simulation run.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateEvidence = async () => {
    if (!evidenceForm.paperId) {
      addToast('Select a paper.', 'error');
      return;
    }

    const numeric = (value: string) => (value.trim() ? Number(value) : undefined);
    const valueField = (value: string, unit: string) => {
      if (!value.trim()) return undefined;
      if (!isSupportedUnit(unit)) {
        throw new Error(`Unsupported unit: ${unit}`);
      }
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        throw new Error(`Invalid numeric value: ${value}`);
      }
      return { value: parsed, unit };
    };

    try {
      const fields = {
        value: undefined,
        condition: evidenceForm.condition || undefined,
        region: evidenceForm.region || undefined,
        species: evidenceForm.species || undefined,
        technique: evidenceForm.technique || undefined,
        temperatureC: valueField(evidenceForm.temperature, evidenceForm.temperatureUnit),
        tauMs: valueField(evidenceForm.tauMs, evidenceForm.tauUnit),
        vHalfMv: valueField(evidenceForm.vHalf, evidenceForm.vHalfUnit),
        gmaxNs: valueField(evidenceForm.gmax, evidenceForm.gmaxUnit),
        tauPreMs: valueField(evidenceForm.tauPre, evidenceForm.tauPreUnit),
        tauPostMs: valueField(evidenceForm.tauPost, evidenceForm.tauPostUnit),
        learningRate: evidenceForm.learningRate
          ? (() => {
              const parsed = Number(evidenceForm.learningRate);
              if (Number.isNaN(parsed)) {
                throw new Error('Invalid learning rate');
              }
              return { value: parsed, unit: 'unitless' };
            })()
          : undefined,
        firingRateHz: valueField(evidenceForm.firingRate, evidenceForm.firingRateUnit),
        membraneTauMs: valueField(evidenceForm.membraneTau, evidenceForm.membraneTauUnit),
        synapticWeight: valueField(evidenceForm.synapticWeight, evidenceForm.synapticWeightUnit),
        notes: evidenceForm.notes || undefined,
      };

      const primaryValue =
        fields.firingRateHz ??
        fields.gmaxNs ??
        fields.tauMs ??
        fields.membraneTauMs ??
        fields.synapticWeight ??
        fields.learningRate;
      fields.value = primaryValue;

      await createEvidenceItem(userId, {
        paperId: evidenceForm.paperId,
        entityType: evidenceForm.entityType,
        fields,
        extractedFrom: {
          page: numeric(evidenceForm.sourcePage),
          quote: evidenceForm.sourceQuote || undefined,
        },
        tags: evidenceForm.tags,
      });

      setEvidenceForm({
        paperId: '',
        entityType: evidenceForm.entityType,
        condition: '',
        region: '',
        species: '',
        technique: '',
        tauMs: '',
        tauUnit: 'ms',
        vHalf: '',
        vHalfUnit: 'mV',
        gmax: '',
        gmaxUnit: 'nS',
        temperature: '',
        temperatureUnit: '°C',
        tauPre: '',
        tauPreUnit: 'ms',
        tauPost: '',
        tauPostUnit: 'ms',
        learningRate: '',
        firingRate: '',
        firingRateUnit: 'Hz',
        membraneTau: '',
        membraneTauUnit: 'ms',
        synapticWeight: '',
        synapticWeightUnit: 'nS',
        notes: '',
        sourceQuote: '',
        sourcePage: '',
        tags: [],
      });
      addToast('Evidence item saved.', 'success');
    } catch (error) {
      console.error(error);
      addToast('Failed to save evidence item.', 'error');
    }
  };

  const handleExportObsidian = () => {
    const files = buildObsidianBundle({
      papers,
      evidenceItems,
      simulationRuns,
      codeSnippets,
      ontologyLookup,
    });
    files.forEach((file) => downloadTextFile(file.path, file.content));
    addToast('Obsidian export generated.', 'success');
  };

  const handleExportEvidenceCsv = () => {
    const csv = buildEvidenceItemsCsv(papers, evidenceItems);
    downloadTextFile('evidence-items.csv', csv);
  };

  const handleCreateSnippet = async () => {
    if (!snippetForm.title.trim() || !snippetForm.code.trim()) return;
    await createCodeSnippet(userId, {
      title: snippetForm.title.trim(),
      code: snippetForm.code,
      language: snippetForm.language,
      tags: snippetForm.tags,
      linkedPapers: snippetForm.linkedPapers,
      linkedModels: snippetForm.linkedModels,
    });
    setSnippetForm({
      title: '',
      language: snippetForm.language,
      code: '',
      linkedPapers: [],
      linkedModels: [],
      tags: [],
    });
  };

  const renderOntologyTree = (nodes: OntologyNode[], parentId: string | null, depth = 0) => {
    return nodes
      .filter((node) => (node.parentId ?? null) === parentId)
      .map((node) => (
        <div key={node.id} className="space-y-1" style={{ paddingLeft: depth * 16 }}>
          <div className="border-2 border-black p-2 bg-white">
            <div className="font-bold text-sm">{node.label}</div>
            <div className="text-xs text-gray-500">
              {node.type} {node.synonyms.length ? `• ${node.synonyms.join(', ')}` : ''}
            </div>
          </div>
          {renderOntologyTree(nodes, node.id, depth + 1)}
        </div>
      ));
  };

  return (
    <div className="min-h-screen bg-nb-gray flex flex-col">
      <header className="bg-white border-b-4 border-black p-5 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2">Neuro Hub</div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Neuro Research Hub</h1>
        </div>
        <button onClick={onBack} className="nb-button">
          Back to Library
        </button>
      </header>

      <div className="bg-white border-b-4 border-black p-4 flex gap-2 flex-wrap">
        {[
          { id: 'ontology', label: 'Ontology' },
          { id: 'simulations', label: 'Simulation Hub' },
          { id: 'evidence', label: 'Evidence' },
          { id: 'exports', label: 'Exports' },
          { id: 'snippets', label: 'Snippets' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`nb-button ${activeTab === tab.id ? 'bg-nb-yellow' : 'bg-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="p-6 space-y-6">
        {activeTab === 'ontology' && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase">Ontology Tree</h2>
                <button onClick={handleSeedOntology} className="nb-button bg-nb-lime">
                  Seed Default Taxonomy
                </button>
              </div>
              <div className="space-y-3">{renderOntologyTree(ontologyNodes, null)}</div>
            </div>
            <div className="nb-card p-4 bg-white space-y-3">
              <h3 className="font-black uppercase">Add Ontology Node</h3>
              <input
                className="nb-input w-full"
                placeholder="Label"
                value={ontologyForm.label}
                onChange={(event) => setOntologyForm({ ...ontologyForm, label: event.target.value })}
              />
              <select
                className="nb-input w-full"
                value={ontologyForm.type}
                onChange={(event) =>
                  setOntologyForm({ ...ontologyForm, type: event.target.value as OntologyNodeType })
                }
              >
                {ontologyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                className="nb-input w-full"
                value={ontologyForm.parentId}
                onChange={(event) =>
                  setOntologyForm({ ...ontologyForm, parentId: event.target.value })
                }
              >
                <option value="">No parent</option>
                {ontologyNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.label}
                  </option>
                ))}
              </select>
              <input
                className="nb-input w-full"
                placeholder="Synonyms (comma-separated)"
                value={ontologyForm.synonyms}
                onChange={(event) => setOntologyForm({ ...ontologyForm, synonyms: event.target.value })}
              />
              <button onClick={handleCreateOntologyNode} className="nb-button bg-nb-cyan">
                <Plus size={16} /> Add Node
              </button>
            </div>
          </div>
        )}

        {activeTab === 'simulations' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="nb-card p-4 bg-white space-y-3">
                <h3 className="font-black uppercase">Simulation Models</h3>
                <input
                  className="nb-input w-full"
                  placeholder="Model name"
                  value={modelForm.name}
                  onChange={(event) => setModelForm({ ...modelForm, name: event.target.value })}
                />
                <textarea
                  className="nb-input w-full"
                  placeholder="Description"
                  value={modelForm.description}
                  onChange={(event) => setModelForm({ ...modelForm, description: event.target.value })}
                />
                <select
                  className="nb-input w-full"
                  value={modelForm.framework}
                  onChange={(event) =>
                    setModelForm({ ...modelForm, framework: event.target.value as SimulationModel['framework'] })
                  }
                >
                  <option value="brian2">Brian2</option>
                  <option value="nengo">Nengo</option>
                  <option value="other">Other</option>
                </select>
                <button onClick={handleCreateModel} className="nb-button bg-nb-yellow">
                  <Plus size={16} /> Add Model
                </button>
                <ul className="space-y-2">
                  {simulationModels.map((model) => (
                    <li key={model.id} className="border-2 border-black p-2 text-sm">
                      <div className="font-bold">{model.name}</div>
                      <div className="text-xs text-gray-500">{model.framework}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="nb-card p-4 bg-white space-y-3">
                <h3 className="font-black uppercase">Import Simulation Run</h3>
                <select
                  className="nb-input w-full"
                  value={runImportForm.modelId}
                  onChange={(event) =>
                    setRunImportForm({ ...runImportForm, modelId: event.target.value })
                  }
                >
                  <option value="">Select model</option>
                  {simulationModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <input
                  className="nb-input w-full"
                  placeholder="Run label (optional)"
                  value={runImportForm.runLabel}
                  onChange={(event) =>
                    setRunImportForm({ ...runImportForm, runLabel: event.target.value })
                  }
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase block">Simulation Log (JSON)</label>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleLogUpload(file);
                    }}
                  />
                </div>
                {logData && !logData.success && (
                  <div className="text-xs text-red-600">
                    {logData.errors?.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase block">Artifacts</label>
                  <input
                    type="file"
                    multiple
                    onChange={(event) => setArtifactFiles(Array.from(event.target.files ?? []))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase block">Linked Papers</label>
                  <div className="max-h-32 overflow-y-auto border-2 border-black p-2">
                    {papers.map((paper) => (
                      <label key={paper.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={runImportForm.linkedPapers.includes(paper.id)}
                          onChange={() => {
                            const next = runImportForm.linkedPapers.includes(paper.id)
                              ? runImportForm.linkedPapers.filter((id) => id !== paper.id)
                              : [...runImportForm.linkedPapers, paper.id];
                            setRunImportForm({ ...runImportForm, linkedPapers: next });
                          }}
                        />
                        {paper.title}
                      </label>
                    ))}
                  </div>
                </div>
                <OntologyTagPicker
                  nodes={ontologyNodes}
                  selectedIds={runImportForm.tags}
                  onChange={(next) => setRunImportForm({ ...runImportForm, tags: next })}
                  label="Ontology Tags"
                />
                <button
                  onClick={handleImportRun}
                  className="nb-button bg-nb-cyan"
                  disabled={isImporting}
                >
                  <FileUp size={16} /> {isImporting ? 'Importing...' : 'Import Run'}
                </button>
                {logFile && (
                  <div className="text-xs text-gray-500">Loaded log: {logFile.name}</div>
                )}
              </div>
            </div>
            <div className="nb-card p-4 bg-white space-y-3">
              <h3 className="font-black uppercase">Simulation Runs</h3>
              <div className="grid md:grid-cols-2 gap-2">
                <select
                  className="nb-input"
                  value={runFilters.modelId}
                  onChange={(event) => setRunFilters({ ...runFilters, modelId: event.target.value })}
                >
                  <option value="">All models</option>
                  {simulationModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <select
                  className="nb-input"
                  value={runFilters.tagId}
                  onChange={(event) => setRunFilters({ ...runFilters, tagId: event.target.value })}
                >
                  <option value="">All ontology tags</option>
                  {ontologyNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label}
                    </option>
                  ))}
                </select>
              </div>
              <ul className="space-y-2">
                {filteredRuns.map((run) => (
                  <li key={run.id} className="border-2 border-black p-2 text-sm">
                    <div className="font-bold">{run.runLabel}</div>
                    <div className="text-xs text-gray-500">
                      Model: {simulationModels.find((model) => model.id === run.modelId)?.name ?? run.modelId}
                    </div>
                    <div className="text-xs text-gray-500">
                      Linked papers: {run.linkedPapers.map((id) => paperLookup[id] ?? id).join(', ') || 'None'}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="nb-card p-4 bg-white space-y-3">
                <h3 className="font-black uppercase">Evidence Items</h3>
                <ul className="space-y-2">
                  {evidenceItems.map((item) => (
                    <li key={item.id} className="border-2 border-black p-2 text-sm">
                      <div className="font-bold">{paperLookup[item.paperId] ?? item.paperId}</div>
                      <div className="text-xs text-gray-500">
                        {item.entityType} · {item.fields.value?.value ?? ''}{' '}
                        {item.fields.value?.unit ?? ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="nb-card p-4 bg-white space-y-3">
                <h3 className="font-black uppercase">Add Evidence</h3>
                <select
                  className="nb-input w-full"
                  value={evidenceForm.paperId}
                  onChange={(event) => setEvidenceForm({ ...evidenceForm, paperId: event.target.value })}
                >
                  <option value="">Select paper</option>
                  {papers.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.title}
                    </option>
                  ))}
                </select>
                <select
                  className="nb-input w-full"
                  value={evidenceForm.entityType}
                  onChange={(event) =>
                    setEvidenceForm({ ...evidenceForm, entityType: event.target.value as EvidenceEntityType })
                  }
                >
                  {evidenceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="nb-input"
                    placeholder="Region"
                    value={evidenceForm.region}
                    onChange={(event) => setEvidenceForm({ ...evidenceForm, region: event.target.value })}
                  />
                  <input
                    className="nb-input"
                    placeholder="Species"
                    value={evidenceForm.species}
                    onChange={(event) => setEvidenceForm({ ...evidenceForm, species: event.target.value })}
                  />
                  <input
                    className="nb-input"
                    placeholder="Technique"
                    value={evidenceForm.technique}
                    onChange={(event) => setEvidenceForm({ ...evidenceForm, technique: event.target.value })}
                  />
                  <input
                    className="nb-input"
                    placeholder="Condition"
                    value={evidenceForm.condition}
                    onChange={(event) => setEvidenceForm({ ...evidenceForm, condition: event.target.value })}
                  />
                </div>

                {evidenceForm.entityType === 'ionChannelKinetics' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <input
                        className="nb-input"
                        placeholder="Tau"
                        value={evidenceForm.tauMs}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, tauMs: event.target.value })}
                      />
                      <select
                        className="nb-input"
                        value={evidenceForm.tauUnit}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, tauUnit: event.target.value })}
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <input
                        className="nb-input"
                        placeholder="Vhalf"
                        value={evidenceForm.vHalf}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, vHalf: event.target.value })}
                      />
                      <select
                        className="nb-input"
                        value={evidenceForm.vHalfUnit}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, vHalfUnit: event.target.value })}
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <input
                        className="nb-input"
                        placeholder="gmax"
                        value={evidenceForm.gmax}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, gmax: event.target.value })}
                      />
                      <select
                        className="nb-input"
                        value={evidenceForm.gmaxUnit}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, gmaxUnit: event.target.value })}
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <input
                        className="nb-input"
                        placeholder="Temperature"
                        value={evidenceForm.temperature}
                        onChange={(event) =>
                          setEvidenceForm({ ...evidenceForm, temperature: event.target.value })
                        }
                      />
                      <select
                        className="nb-input"
                        value={evidenceForm.temperatureUnit}
                        onChange={(event) =>
                          setEvidenceForm({ ...evidenceForm, temperatureUnit: event.target.value })
                        }
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {evidenceForm.entityType === 'plasticityRule' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <input
                        className="nb-input"
                        placeholder="Tau pre"
                        value={evidenceForm.tauPre}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, tauPre: event.target.value })}
                      />
                      <select
                        className="nb-input"
                        value={evidenceForm.tauPreUnit}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, tauPreUnit: event.target.value })}
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <input
                        className="nb-input"
                        placeholder="Tau post"
                        value={evidenceForm.tauPost}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, tauPost: event.target.value })}
                      />
                      <select
                        className="nb-input"
                        value={evidenceForm.tauPostUnit}
                        onChange={(event) => setEvidenceForm({ ...evidenceForm, tauPostUnit: event.target.value })}
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      className="nb-input"
                      placeholder="Learning rate"
                      value={evidenceForm.learningRate}
                      onChange={(event) => setEvidenceForm({ ...evidenceForm, learningRate: event.target.value })}
                    />
                  </div>
                )}

                {evidenceForm.entityType === 'firingRate' && (
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                    <input
                      className="nb-input"
                      placeholder="Rate"
                      value={evidenceForm.firingRate}
                      onChange={(event) => setEvidenceForm({ ...evidenceForm, firingRate: event.target.value })}
                    />
                    <select
                      className="nb-input"
                      value={evidenceForm.firingRateUnit}
                      onChange={(event) => setEvidenceForm({ ...evidenceForm, firingRateUnit: event.target.value })}
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {evidenceForm.entityType === 'membraneConstant' && (
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                    <input
                      className="nb-input"
                      placeholder="Membrane tau"
                      value={evidenceForm.membraneTau}
                      onChange={(event) => setEvidenceForm({ ...evidenceForm, membraneTau: event.target.value })}
                    />
                    <select
                      className="nb-input"
                      value={evidenceForm.membraneTauUnit}
                      onChange={(event) =>
                        setEvidenceForm({ ...evidenceForm, membraneTauUnit: event.target.value })
                      }
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {evidenceForm.entityType === 'synapticWeight' && (
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                    <input
                      className="nb-input"
                      placeholder="Weight"
                      value={evidenceForm.synapticWeight}
                      onChange={(event) =>
                        setEvidenceForm({ ...evidenceForm, synapticWeight: event.target.value })
                      }
                    />
                    <select
                      className="nb-input"
                      value={evidenceForm.synapticWeightUnit}
                      onChange={(event) =>
                        setEvidenceForm({ ...evidenceForm, synapticWeightUnit: event.target.value })
                      }
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <textarea
                  className="nb-input w-full"
                  placeholder="Notes"
                  value={evidenceForm.notes}
                  onChange={(event) => setEvidenceForm({ ...evidenceForm, notes: event.target.value })}
                />
                <textarea
                  className="nb-input w-full"
                  placeholder="Source quote"
                  value={evidenceForm.sourceQuote}
                  onChange={(event) =>
                    setEvidenceForm({ ...evidenceForm, sourceQuote: event.target.value })
                  }
                />
                <input
                  className="nb-input w-full"
                  placeholder="Source page"
                  value={evidenceForm.sourcePage}
                  onChange={(event) =>
                    setEvidenceForm({ ...evidenceForm, sourcePage: event.target.value })
                  }
                />
                <OntologyTagPicker
                  nodes={ontologyNodes}
                  selectedIds={evidenceForm.tags}
                  onChange={(next) => setEvidenceForm({ ...evidenceForm, tags: next })}
                  label="Ontology Tags"
                />
                <button onClick={handleCreateEvidence} className="nb-button bg-nb-purple">
                  Save Evidence
                </button>
              </div>
            </div>
            <button onClick={handleExportEvidenceCsv} className="nb-button bg-nb-yellow">
              <Download size={16} /> Export Evidence CSV
            </button>
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="nb-card p-4 bg-white space-y-3">
            <h3 className="font-black uppercase">Obsidian Export</h3>
            <p className="text-sm text-gray-600">
              Generates Markdown files per paper plus highlights. Save the downloads into your Obsidian vault.
            </p>
            <button onClick={handleExportObsidian} className="nb-button bg-nb-lime">
              <Download size={16} /> Export Obsidian Markdown
            </button>
          </div>
        )}

        {activeTab === 'snippets' && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="nb-card p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black uppercase">Code Snippets</h3>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2" size={14} />
                  <input
                    className="nb-input pl-8"
                    placeholder="Search snippets"
                    value={snippetSearch}
                    onChange={(event) => setSnippetSearch(event.target.value)}
                  />
                </div>
              </div>
              <ul className="space-y-2">
                {filteredSnippets.map((snippet) => (
                  <li key={snippet.id} className="border-2 border-black p-2 text-sm">
                    <div className="font-bold">{snippet.title}</div>
                    <div className="text-xs text-gray-500">{snippet.language}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="nb-card p-4 bg-white space-y-3">
              <h3 className="font-black uppercase">Add Snippet</h3>
              <input
                className="nb-input w-full"
                placeholder="Title"
                value={snippetForm.title}
                onChange={(event) => setSnippetForm({ ...snippetForm, title: event.target.value })}
              />
              <input
                className="nb-input w-full"
                placeholder="Language"
                value={snippetForm.language}
                onChange={(event) => setSnippetForm({ ...snippetForm, language: event.target.value })}
              />
              <textarea
                className="nb-input w-full min-h-[140px]"
                placeholder="Code"
                value={snippetForm.code}
                onChange={(event) => setSnippetForm({ ...snippetForm, code: event.target.value })}
              />
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase block">Linked Papers</label>
                <div className="max-h-32 overflow-y-auto border-2 border-black p-2">
                  {papers.map((paper) => (
                    <label key={paper.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={snippetForm.linkedPapers.includes(paper.id)}
                        onChange={() => {
                          const next = snippetForm.linkedPapers.includes(paper.id)
                            ? snippetForm.linkedPapers.filter((id) => id !== paper.id)
                            : [...snippetForm.linkedPapers, paper.id];
                          setSnippetForm({ ...snippetForm, linkedPapers: next });
                        }}
                      />
                      {paper.title}
                    </label>
                  ))}
                </div>
              </div>
              <OntologyTagPicker
                nodes={ontologyNodes}
                selectedIds={snippetForm.tags}
                onChange={(next) => setSnippetForm({ ...snippetForm, tags: next })}
                label="Ontology Tags"
              />
              <button onClick={handleCreateSnippet} className="nb-button bg-nb-cyan">
                <Plus size={16} /> Save Snippet
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
