import { z } from 'zod'

const hierarchicalTagSchema = z.object({
  path: z.string(),
  level: z.number(),
  parent: z.string().optional(),
})

const structuredNotesSchema = z.object({
  researchQuestion: z.string().optional(),
  methods: z.string().optional(),
  results: z.string().optional(),
  conclusions: z.string().optional(),
  limitations: z.string().optional(),
  futureWork: z.string().optional(),
})

const paperFieldsSchema = z.object({
  userId: z.string(),
  title: z.string().min(1, 'Title is required').default('Untitled Paper'),
  link: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),
  color: z.string().min(1).default('bg-nb-yellow'),
  status: z.enum(['to-read', 'reading', 'read']).default('to-read'),
  abstract: z.string().optional().default(''),
  authors: z.string().optional().default(''),
  year: z.string().optional().default(''),
  venue: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  pdfUrl: z.string().optional().default(''),
  createdAt: z.number().default(() => Date.now()),
  addedDate: z.number().optional(),
  modifiedDate: z.number().optional(),
  rating: z.number().min(0).max(5).optional(),
  methods: z.array(z.string()).default([]),
  organisms: z.array(z.string()).default([]),
  hypotheses: z.array(z.string()).default([]),
  structuredNotes: structuredNotesSchema.optional().default({}),
  readingList: z.string().optional(),
  scheduledDate: z.string().optional(),
  doi: z.string().optional(),
  citationCount: z.number().optional(),
  semanticScholarId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  pdfHash: z.string().optional(),
  srsRepetitions: z.number().optional(),
  srsInterval: z.number().optional(),
  srsEase: z.number().optional(),
  srsDue: z.number().optional(),
  lastReadAt: z.number().optional(),
  totalReadingTime: z.number().optional(),
  readingStreak: z.number().optional(),
  hierarchicalTags: z.array(hierarchicalTagSchema).default([]),
  citedBy: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  journal: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  publisher: z.string().optional(),
  language: z.string().optional(),
  issn: z.string().optional(),
  pmid: z.string().optional(),
  arxivId: z.string().optional(),
  citationStyle: z.string().optional(),
  fileSize: z.number().optional(),
  pageCount: z.number().optional(),
})

export const paperSchema = paperFieldsSchema.extend({
  id: z.string(),
})

export const paperCreateSchema = paperFieldsSchema

export const paperUpdateSchema = paperFieldsSchema
  .omit({ userId: true })
  .partial()

export type PaperModel = z.infer<typeof paperSchema>
export type PaperCreateInput = z.input<typeof paperCreateSchema>
export type PaperUpdateInput = z.input<typeof paperUpdateSchema>

export function normalizePaper(data: unknown) {
  const parsed = paperSchema.safeParse(data)
  if (!parsed.success) return null
  const { addedDate, createdAt } = parsed.data
  return {
    ...parsed.data,
    addedDate: addedDate ?? createdAt,
  }
}

export function buildPaperForCreate(input: PaperCreateInput) {
  const parsed = paperCreateSchema.parse(input)
  const createdAt = parsed.createdAt ?? Date.now()
  return {
    ...parsed,
    createdAt,
    addedDate: parsed.addedDate ?? createdAt,
  }
}
