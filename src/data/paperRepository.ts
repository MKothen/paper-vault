import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import {
  buildPaperForCreate,
  mergePaperUpdate,
  normalizePaper,
} from '../domain/paper';
import type { PaperCreate, PaperModel } from '../domain/paper';

const papersCollection = collection(db, 'papers');

type SubscriptionCallback = (papers: PaperModel[]) => void;
type ErrorHandler = (message: string) => void;

export const subscribeToUserPapers = (
  userId: string,
  onData: SubscriptionCallback,
  onError?: ErrorHandler
): Unsubscribe => {
  const q = query(papersCollection, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      try {
        const items = snapshot.docs.map((docSnap) => normalizePaper(docSnap.data(), docSnap.id));
        onData(items);
      } catch (error) {
        console.error('Failed to normalize papers', error);
        if (onError) onError('Paper sync failed. Some documents have invalid shape.');
      }
    },
    (error) => {
      console.error('Paper subscription error', error);
      if (onError) onError('Realtime sync failed. Please retry or reload.');
    }
  );
};

export const createPaperRecord = async (input: Partial<PaperCreate>): Promise<string> => {
  const payload = buildPaperForCreate(input);
  const docRef = await addDoc(papersCollection, payload);
  return docRef.id;
};

export const updatePaperRecord = async (
  current: PaperModel,
  updates: Partial<PaperModel>
): Promise<void> => {
  if (!current.id) throw new Error('Cannot update a paper without an id');
  const docRef = doc(db, 'papers', current.id);
  const merged = mergePaperUpdate(current, updates);
  const { id, ...writePayload } = merged;
  await updateDoc(docRef, writePayload);
};

export const deletePaperRecord = async (id: string): Promise<void> => {
  const docRef = doc(db, 'papers', id);
  await deleteDoc(docRef);
};
