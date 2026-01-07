import type { Concept, ConceptType } from '../domain';

const makeConcept = (type: ConceptType, name: string, aliases: string[] = []): Omit<Concept, 'id' | 'createdAt' | 'updatedAt'> => ({
  type,
  name,
  aliases,
});

export const defaultConceptSeed = (): Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>[] => [
  // Methods
  makeConcept('Method', 'Brian2'),
  makeConcept('Method', 'Nengo'),
  makeConcept('Method', 'NEURON'),
  makeConcept('Method', 'BMTK'),
  makeConcept('Method', 'PyTorch'),
  makeConcept('Method', 'JAX'),
  makeConcept('Method', 'TensorFlow'),

  // Models
  makeConcept('Model', 'LIF', ['Leaky Integrate-and-Fire']),
  makeConcept('Model', 'Izhikevich'),
  makeConcept('Model', 'Hodgkin–Huxley', ['HH']),
  makeConcept('Model', 'GLM'),
  makeConcept('Model', 'RNN'),
  makeConcept('Model', 'SNN', ['Spiking Neural Network']),
  makeConcept('Model', 'Reservoir Computing'),
  makeConcept('Model', 'Predictive Coding'),
  makeConcept('Model', 'Reinforcement Learning', ['RL']),

  // Data types
  makeConcept('DatasetFormat', 'BIDS'),
  makeConcept('DatasetFormat', 'NWB'),
  makeConcept('DatasetFormat', 'HDF5'),
  makeConcept('DatasetFormat', 'MAT'),
  makeConcept('DatasetFormat', 'CSV'),

  // Metrics
  makeConcept('Metric', 'Accuracy'),
  makeConcept('Metric', 'AUC'),
  makeConcept('Metric', 'r'),
  makeConcept('Metric', 'R²'),
  makeConcept('Metric', 'Log-likelihood'),
  makeConcept('Metric', 'Perplexity'),
  makeConcept('Metric', 'RMSE'),
  makeConcept('Metric', 'Explained Variance'),
  makeConcept('Metric', 'Mutual Information'),

  // Paradigms
  makeConcept('Paradigm', 'Decision making'),
  makeConcept('Paradigm', 'Spatial navigation'),
  makeConcept('Paradigm', 'Working memory'),
  makeConcept('Paradigm', 'Motor control'),

  // Brain regions / cell types / molecules / theories
  makeConcept('BrainRegion', 'Hippocampus'),
  makeConcept('BrainRegion', 'Prefrontal cortex'),
  makeConcept('BrainRegion', 'Visual cortex'),
  makeConcept('CellType', 'Pyramidal neuron'),
  makeConcept('CellType', 'Interneuron'),
  makeConcept('Molecule', 'Dopamine'),
  makeConcept('Molecule', 'Glutamate'),
  makeConcept('Theory', 'Predictive coding'),
  makeConcept('Theory', 'Efficient coding'),
];
