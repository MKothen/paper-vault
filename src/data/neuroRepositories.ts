import type { Unsubscribe, QueryConstraint } from 'firebase/firestore';
import {
  CodeSnippetSchema,
  EvidenceItemSchema,
  MethodsSnippetSchema,
  OntologyNodeSchema,
  QuoteItemSchema,
  SimulationModelSchema,
  SimulationRunSchema,
} from '../domain';
import {
  createUserDocument,
  deleteUserDocument,
  listenToUserCollection,
  updateUserDocument,
} from './userRepository';
import type {
  CodeSnippet,
  EvidenceItem,
  MethodsSnippet,
  OntologyNode,
  QuoteItem,
  SimulationModel,
  SimulationRun,
} from '../domain';

const COLLECTIONS = {
  ontologyNodes: 'ontologyNodes',
  simulationModels: 'simulationModels',
  simulationRuns: 'simulationRuns',
  evidenceItems: 'evidenceItems',
  codeSnippets: 'codeSnippets',
  quoteBank: 'quoteBank',
  methodsSnippets: 'methodsSnippets',
};

export const listenToUserOntologyNodes = (
  userId: string,
  onData: (items: OntologyNode[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.ontologyNodes, OntologyNodeSchema, onData, onError, constraints);

export const createOntologyNode = (
  userId: string,
  data: Omit<OntologyNode, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<OntologyNode>(userId, COLLECTIONS.ontologyNodes, data as Omit<OntologyNode, 'id'>);

export const updateOntologyNode = (userId: string, id: string, updates: Partial<OntologyNode>) =>
  updateUserDocument<OntologyNode>(userId, COLLECTIONS.ontologyNodes, id, updates);

export const deleteOntologyNode = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.ontologyNodes, id);

export const listenToUserSimulationModels = (
  userId: string,
  onData: (items: SimulationModel[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.simulationModels, SimulationModelSchema, onData, onError, constraints);

export const createSimulationModel = (
  userId: string,
  data: Omit<SimulationModel, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<SimulationModel>(userId, COLLECTIONS.simulationModels, data as Omit<SimulationModel, 'id'>);

export const updateSimulationModel = (userId: string, id: string, updates: Partial<SimulationModel>) =>
  updateUserDocument<SimulationModel>(userId, COLLECTIONS.simulationModels, id, updates);

export const deleteSimulationModel = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.simulationModels, id);

export const listenToUserSimulationRuns = (
  userId: string,
  onData: (items: SimulationRun[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.simulationRuns, SimulationRunSchema, onData, onError, constraints);

export const createSimulationRun = (
  userId: string,
  data: Omit<SimulationRun, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<SimulationRun>(userId, COLLECTIONS.simulationRuns, data as Omit<SimulationRun, 'id'>);

export const updateSimulationRun = (userId: string, id: string, updates: Partial<SimulationRun>) =>
  updateUserDocument<SimulationRun>(userId, COLLECTIONS.simulationRuns, id, updates);

export const deleteSimulationRun = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.simulationRuns, id);

export const listenToUserEvidenceItems = (
  userId: string,
  onData: (items: EvidenceItem[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.evidenceItems, EvidenceItemSchema, onData, onError, constraints);

export const createEvidenceItem = (
  userId: string,
  data: Omit<EvidenceItem, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<EvidenceItem>(userId, COLLECTIONS.evidenceItems, data as Omit<EvidenceItem, 'id'>);

export const updateEvidenceItem = (userId: string, id: string, updates: Partial<EvidenceItem>) =>
  updateUserDocument<EvidenceItem>(userId, COLLECTIONS.evidenceItems, id, updates);

export const deleteEvidenceItem = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.evidenceItems, id);

export const listenToUserCodeSnippets = (
  userId: string,
  onData: (items: CodeSnippet[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.codeSnippets, CodeSnippetSchema, onData, onError, constraints);

export const createCodeSnippet = (
  userId: string,
  data: Omit<CodeSnippet, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<CodeSnippet>(userId, COLLECTIONS.codeSnippets, data as Omit<CodeSnippet, 'id'>);

export const updateCodeSnippet = (userId: string, id: string, updates: Partial<CodeSnippet>) =>
  updateUserDocument<CodeSnippet>(userId, COLLECTIONS.codeSnippets, id, updates);

export const deleteCodeSnippet = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.codeSnippets, id);

export const listenToUserQuoteBank = (
  userId: string,
  onData: (items: QuoteItem[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.quoteBank, QuoteItemSchema, onData, onError, constraints);

export const createQuoteItem = (
  userId: string,
  data: Omit<QuoteItem, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<QuoteItem>(userId, COLLECTIONS.quoteBank, data as Omit<QuoteItem, 'id'>);

export const listenToUserMethodsSnippets = (
  userId: string,
  onData: (items: MethodsSnippet[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.methodsSnippets, MethodsSnippetSchema, onData, onError, constraints);

export const createMethodsSnippet = (
  userId: string,
  data: Omit<MethodsSnippet, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<MethodsSnippet>(userId, COLLECTIONS.methodsSnippets, data as Omit<MethodsSnippet, 'id'>);
