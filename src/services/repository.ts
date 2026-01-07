import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  DocumentData,
  FirestoreDataConverter,
  QueryConstraint,
  WithFieldValue
} from 'firebase/firestore';
import { db } from '../firebase';
import { z } from 'zod';

// Generic Converter Factory
export const createConverter = <T extends { id: string }>(
  schema: z.ZodType<T>
): FirestoreDataConverter<T> => ({
  toFirestore: (data: WithFieldValue<T>): DocumentData => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = data as T;
    return rest;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    // Add ID back to the object
    const result = { id: snapshot.id, ...data };
    // Validate with Zod
    const parsed = schema.safeParse(result);
    if (!parsed.success) {
      console.error(`Schema validation failed for ${snapshot.id}`, parsed.error);
      // Return raw data but typed as T (risky but keeps app from crashing)
      return result as T;
    }
    return parsed.data;
  },
});

export class BaseRepository<T extends { id: string }> {
  private collectionName: string;
  private converter: FirestoreDataConverter<T>;

  constructor(collectionName: string, schema: z.ZodType<T>) {
    this.collectionName = collectionName;
    this.converter = createConverter(schema);
  }

  protected getCollectionRef() {
    return collection(db, this.collectionName).withConverter(this.converter);
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(this.getCollectionRef(), id);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.getCollectionRef(), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(this.getCollectionRef(), {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });
    return docRef.id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.getCollectionRef(), id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now()
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.getCollectionRef(), id);
    await deleteDoc(docRef);
  }
}
