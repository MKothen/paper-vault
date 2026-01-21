import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

export type StorageUploadResult = {
  url: string;
  storageKey: string;
};

export interface StorageProvider {
  uploadPdf: (userId: string, file: File) => Promise<StorageUploadResult | null>;
  getDownloadUrl: (storageKey: string) => Promise<string | null>;
}

class FirebaseStorageProvider implements StorageProvider {
  async uploadPdf(userId: string, file: File) {
    const storageKey = `papers/${userId}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, storageKey);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return { url, storageKey };
  }

  async getDownloadUrl(storageKey: string) {
    const fileRef = ref(storage, storageKey);
    return getDownloadURL(fileRef);
  }
}

class LocalOnlyStorageProvider implements StorageProvider {
  private cache = new Map<string, string>();

  async uploadPdf(_userId: string, file: File) {
    const storageKey = `local:${Date.now()}_${file.name}`;
    const url = URL.createObjectURL(file);
    this.cache.set(storageKey, url);
    return { url, storageKey };
  }

  async getDownloadUrl(storageKey: string) {
    return this.cache.get(storageKey) ?? null;
  }
}

class DisabledStorageProvider implements StorageProvider {
  async uploadPdf() {
    return null;
  }

  async getDownloadUrl() {
    return null;
  }
}

export const createStorageProvider = () => {
  const provider = (import.meta.env.VITE_STORAGE_PROVIDER || 'firebase').toLowerCase();
  if (provider === 'local') return new LocalOnlyStorageProvider();
  if (provider === 'disabled') return new DisabledStorageProvider();
  return new FirebaseStorageProvider();
};
