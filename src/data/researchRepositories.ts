import type { Unsubscribe, QueryConstraint } from 'firebase/firestore';
import {
  CaptureInboxSchema,
  ConceptSchema,
  DatasetLinkSchema,
  PaperExtractionSchema,
  ProjectSchema,
  ProtocolSchema,
  RunSchema,
} from '../domain';
import {
  createUserDocument,
  deleteUserDocument,
  listenToUserCollection,
  updateUserDocument,
  getUserCollection,
} from './userRepository';
import type {
  CaptureInboxItem,
  Concept,
  DatasetLink,
  PaperExtraction,
  Project,
  Protocol,
  Run,
} from '../domain';

const COLLECTIONS = {
  projects: 'projects',
  concepts: 'concepts',
  protocols: 'protocols',
  runs: 'runs',
  datasetLinks: 'datasetLinks',
  paperExtractions: 'paperExtractions',
  inbox: 'captureInbox',
};

export const listenToUserProjects = (
  userId: string,
  onData: (items: Project[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.projects, ProjectSchema, onData, onError, constraints);

export const createProject = (userId: string, data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) =>
  createUserDocument<Project>(userId, COLLECTIONS.projects, data as Omit<Project, 'id'>);

export const updateProject = (userId: string, id: string, updates: Partial<Project>) =>
  updateUserDocument<Project>(userId, COLLECTIONS.projects, id, updates);

export const deleteProject = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.projects, id);

export const listenToUserConcepts = (
  userId: string,
  onData: (items: Concept[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.concepts, ConceptSchema, onData, onError, constraints);

export const createConcept = (userId: string, data: Omit<Concept, 'id' | 'createdAt' | 'updatedAt'>) =>
  createUserDocument<Concept>(userId, COLLECTIONS.concepts, data as Omit<Concept, 'id'>);

export const updateConcept = (userId: string, id: string, updates: Partial<Concept>) =>
  updateUserDocument<Concept>(userId, COLLECTIONS.concepts, id, updates);

export const deleteConcept = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.concepts, id);

export const listenToUserProtocols = (
  userId: string,
  onData: (items: Protocol[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.protocols, ProtocolSchema, onData, onError, constraints);

export const createProtocol = (userId: string, data: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt'>) =>
  createUserDocument<Protocol>(userId, COLLECTIONS.protocols, data as Omit<Protocol, 'id'>);

export const updateProtocol = (userId: string, id: string, updates: Partial<Protocol>) =>
  updateUserDocument<Protocol>(userId, COLLECTIONS.protocols, id, updates);

export const deleteProtocol = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.protocols, id);

export const listenToUserRuns = (
  userId: string,
  onData: (items: Run[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.runs, RunSchema, onData, onError, constraints);

export const createRun = (userId: string, data: Omit<Run, 'id' | 'createdAt' | 'updatedAt'>) =>
  createUserDocument<Run>(userId, COLLECTIONS.runs, data as Omit<Run, 'id'>);

export const updateRun = (userId: string, id: string, updates: Partial<Run>) =>
  updateUserDocument<Run>(userId, COLLECTIONS.runs, id, updates);

export const deleteRun = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.runs, id);

export const listenToUserDatasetLinks = (
  userId: string,
  onData: (items: DatasetLink[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.datasetLinks, DatasetLinkSchema, onData, onError, constraints);

export const createDatasetLink = (userId: string, data: Omit<DatasetLink, 'id' | 'createdAt' | 'updatedAt'>) =>
  createUserDocument<DatasetLink>(userId, COLLECTIONS.datasetLinks, data as Omit<DatasetLink, 'id'>);

export const updateDatasetLink = (userId: string, id: string, updates: Partial<DatasetLink>) =>
  updateUserDocument<DatasetLink>(userId, COLLECTIONS.datasetLinks, id, updates);

export const deleteDatasetLink = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.datasetLinks, id);

export const listenToUserPaperExtractions = (
  userId: string,
  onData: (items: PaperExtraction[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
): Unsubscribe =>
  listenToUserCollection(userId, COLLECTIONS.paperExtractions, PaperExtractionSchema, onData, onError, constraints);

export const createPaperExtraction = (
  userId: string,
  data: Omit<PaperExtraction, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<PaperExtraction>(userId, COLLECTIONS.paperExtractions, data as Omit<PaperExtraction, 'id'>);

export const updatePaperExtraction = (
  userId: string,
  id: string,
  updates: Partial<PaperExtraction>,
) => updateUserDocument<PaperExtraction>(userId, COLLECTIONS.paperExtractions, id, updates);

export const deletePaperExtraction = (userId: string, id: string) =>
  deleteUserDocument(userId, COLLECTIONS.paperExtractions, id);

export const createCaptureInboxItem = (
  userId: string,
  data: Omit<CaptureInboxItem, 'id' | 'createdAt' | 'updatedAt'>,
) => createUserDocument<CaptureInboxItem>(userId, COLLECTIONS.inbox, data as Omit<CaptureInboxItem, 'id'>);

export const listenToCaptureInbox = (
  userId: string,
  onData: (items: CaptureInboxItem[]) => void,
  onError?: (error: Error) => void,
  constraints?: QueryConstraint[],
) =>
  listenToUserCollection(userId, COLLECTIONS.inbox, CaptureInboxSchema, onData, onError, constraints);

export const getCaptureInbox = (userId: string, constraints?: QueryConstraint[]) =>
  getUserCollection<CaptureInboxItem>(userId, COLLECTIONS.inbox, CaptureInboxSchema, constraints);
