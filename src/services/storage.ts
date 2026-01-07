import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  startAfter, 
  orderBy,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppError, NotFoundError } from '../domain/errors';

export interface Repository<T> {
    getById(id: string): Promise<T | null>;
    getAll(constraints?: QueryConstraint[]): Promise<T[]>;
    create(id: string, data: T): Promise<void>;
    update(id: string, data: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
}

export class FirestoreRepository<T extends DocumentData> implements Repository<T> {
    constructor(private collectionName: string) {}

    private getCollection() {
        return collection(db, this.collectionName);
    }

    async getById(id: string): Promise<T | null> {
        try {
            const docRef = doc(this.getCollection(), id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data() as T;
            }
            return null;
        } catch (error) {
            throw new AppError(`Failed to fetch ${this.collectionName} with ID ${id}`, 'DB_READ_ERROR');
        }
    }

    async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
        try {
            const q = query(this.getCollection(), ...constraints);
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as T);
        } catch (error) {
            throw new AppError(`Failed to fetch ${this.collectionName}`, 'DB_READ_ERROR');
        }
    }

    async create(id: string, data: T): Promise<void> {
        try {
            await setDoc(doc(this.getCollection(), id), data);
        } catch (error) {
            throw new AppError(`Failed to create ${this.collectionName}`, 'DB_WRITE_ERROR');
        }
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        try {
            const docRef = doc(this.getCollection(), id);
            await updateDoc(docRef, data);
        } catch (error) {
            throw new AppError(`Failed to update ${this.collectionName} with ID ${id}`, 'DB_WRITE_ERROR');
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await deleteDoc(doc(this.getCollection(), id));
        } catch (error) {
            throw new AppError(`Failed to delete ${this.collectionName} with ID ${id}`, 'DB_DELETE_ERROR');
        }
    }
}
