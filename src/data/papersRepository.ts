import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  PaperCreateInput,
  PaperModel,
  PaperUpdateInput,
  buildPaperForCreate,
  normalizePaper,
  paperUpdateSchema,
} from '../domain'

const papersCollection = collection(db, 'papers')

type PapersListener = (papers: PaperModel[]) => void

export function listenToUserPapers(
  userId: string,
  onData: PapersListener,
  onError?: (error: Error) => void,
) {
  const q = query(papersCollection, where('userId', '==', userId))
  return onSnapshot(
    q,
    (snapshot) => {
      const parsed: PaperModel[] = []
      snapshot.forEach((docSnap) => {
        const normalized = normalizePaper({
          id: docSnap.id,
          ...docSnap.data(),
        })
        if (normalized) {
          parsed.push(normalized)
        } else {
          console.warn('Skipping invalid paper document', docSnap.id)
        }
      })
      onData(parsed)
    },
    (error) => {
      console.error('Paper sync error', error)
      onError?.(error)
    },
  )
}

export async function createPaper(userId: string, input: Omit<PaperCreateInput, 'userId'>) {
  const payload = buildPaperForCreate({ ...input, userId })
  const docRef = await addDoc(papersCollection, payload)
  return docRef.id
}

export async function updatePaper(paperId: string, updates: PaperUpdateInput) {
  const parsed = paperUpdateSchema.parse({
    ...updates,
    modifiedDate: updates.modifiedDate ?? Date.now(),
  })
  const paperRef = doc(papersCollection, paperId)
  await updateDoc(paperRef, parsed)
}

export async function removePaper(paperId: string) {
  const paperRef = doc(papersCollection, paperId)
  await deleteDoc(paperRef)
}
