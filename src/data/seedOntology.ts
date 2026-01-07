import type { OntologyNodeType } from '../domain';

type SeedOntologyNode = {
  seedKey: string;
  label: string;
  type: OntologyNodeType;
  parentKey?: string;
  synonyms?: string[];
};

const makeNode = (
  seedKey: string,
  label: string,
  type: OntologyNodeType,
  parentKey?: string,
  synonyms: string[] = [],
): SeedOntologyNode => ({
  seedKey,
  label,
  type,
  parentKey,
  synonyms,
});

export const defaultOntologySeed = (): SeedOntologyNode[] => [
  makeNode('brainRegion.hippocampus', 'Hippocampus', 'brainRegion'),
  makeNode('brainRegion.ca1', 'CA1', 'brainRegion', 'brainRegion.hippocampus'),
  makeNode('brainRegion.ca1.pyramidal', 'Pyramidal Layer', 'brainRegion', 'brainRegion.ca1', [
    'CA1 pyramidal',
    'CA1 PCs',
  ]),
  makeNode('brainRegion.ca3', 'CA3', 'brainRegion', 'brainRegion.hippocampus'),
  makeNode('brainRegion.dg', 'Dentate Gyrus', 'brainRegion', 'brainRegion.hippocampus'),
  makeNode('ionChannel.hcn', 'HCN', 'ionChannel', undefined, ['Ih', 'HCN1', 'HCN2']),
  makeNode('ionChannel.nmda', 'NMDA', 'ionChannel', undefined, ['NMDAR']),
  makeNode('ionChannel.ampa', 'AMPA', 'ionChannel', undefined, ['AMPAR']),
  makeNode('ionChannel.gabaa', 'GABA_A', 'ionChannel', undefined, ['GABAA']),
  makeNode('plasticity.ltp', 'LTP', 'plasticity', undefined, ['Long-term potentiation']),
  makeNode('plasticity.ltd', 'LTD', 'plasticity', undefined, ['Long-term depression']),
  makeNode('plasticity.stdp', 'STDP', 'plasticity', undefined, ['Spike-timing dependent plasticity']),
  makeNode('plasticity.btsp', 'BTSP', 'plasticity', undefined, ['Behavioral time scale plasticity']),
  makeNode('circuit.ff', 'Feedforward inhibition', 'circuitMotif'),
  makeNode('circuit.rec', 'Recurrent excitation', 'circuitMotif'),
  makeNode('model.biophysical', 'Biophysical', 'modelType'),
  makeNode('model.abstract', 'Abstract', 'modelType'),
  makeNode('model.spiking', 'Spiking network', 'modelType'),
  makeNode('model.rate', 'Rate-based', 'modelType'),
  makeNode('technique.ephys', 'Electrophysiology', 'technique', undefined, ['ephys']),
  makeNode('technique.patch', 'Patch clamp', 'technique', 'technique.ephys'),
  makeNode('drug.tetrodotoxin', 'Tetrodotoxin', 'drug', undefined, ['TTX']),
  makeNode('species.mouse', 'Mouse', 'species', undefined, ['Mus musculus']),
  makeNode('species.rat', 'Rat', 'species', undefined, ['Rattus norvegicus']),
  makeNode('preparation.slice', 'Acute slice', 'preparation'),
];

export type { SeedOntologyNode };
