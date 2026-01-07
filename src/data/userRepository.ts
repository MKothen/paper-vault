import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type QueryConstraint,
} from 'firebase/firestore';
import { z } from 'zod';
import { db } from '../firebase';

export type UserCollectionListener<T> = (items: T[]) => void;

const parseWithSchema = <T>(schema: z.ZodType<T>, data: unknown, id: string): T | null => {
  const parsed = schema.safeParse({
    ...(typeof data === 'object' ? data : {}),
    id,
  });
  if (!parsed.success) {
    console.warn('Skipping invalid document', id, parsed.error.format());
    return null;
  }
  return parsed.data;
};

export const userCollectionRef = (userId: string, collectionName: string) =>
  collection(db, 'users', userId, collectionName);

export const listenToUserCollection = <T>(
  userId: string,
  collectionName: string,
  schema: z.ZodType<T>,
  onData: UserCollectionListener<T>,
  onError?: (error: Error) => void,
  constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')],
) => {
  const q = query(userCollectionRef(userId, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        const parsed = parseWithSchema(schema, docSnap.data(), docSnap.id);
        if (parsed) items.push(parsed);
      });
      onData(items);
    },
    (error) => {
      console.error('User collection sync error', error);
      onError?.(error);
    },
  );
};

export const getUserCollection = async <T>(
  userId: string,
  collectionName: string,
  schema: z.ZodType<T>,
  constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')],
): Promise<T[]> => {
  const q = query(userCollectionRef(userId, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  const items: T[] = [];
  snapshot.forEach((docSnap) => {
    const parsed = parseWithSchema(schema, docSnap.data(), docSnap.id);
    if (parsed) items.push(parsed);
  });
  return items;
};

export const createUserDocument = async <T extends { id: string }>(
  userId: string,
  collectionName: string,
  data: Omit<T, 'id'>,
): Promise<string> => {
  const docRef = await addDoc(userCollectionRef(userId, collectionName), {
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
};

export const updateUserDocument = async <T>(
  userId: string,
  collectionName: string,
  id: string,
  updates: Partial<T>,
): Promise<void> => {
  const docRef = doc(userCollectionRef(userId, collectionName), id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteUserDocument = async (
  userId: string,
  collectionName: string,
  id: string,
): Promise<void> => {
  const docRef = doc(userCollectionRef(userId, collectionName), id);
  await deleteDoc(docRef);
};
