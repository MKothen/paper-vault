import { z } from 'zod';
import type { Highlight, PostIt, StructuredNotes } from '../types';

const timestampToNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  // Firestore Timestamp compatibility without importing the type
  if (value && typeof value === 'object' && 'toMillis' in (value as Record<string, unknown>)) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch (error) {
      console.warn('Failed to convert timestamp-like value', error);
    }
  }
  return undefined;
};

const timestampNumber = z
  .preprocess((value) => timestampToNumber(value), z.number().int())
  .catch(() => Date.now());

const highlightSchema: z.ZodType<Highlight> = z.object({
  id: z.string(),
  page: z.number().int(),
  rects: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
  ),
  color: z.string(),
  text: z.string(),
  category: z.enum(['methodology', 'results', 'related-work', 'discussion', 'limitation', 'general']),
  linkedPapers: z.array(z.string()).optional(),
  note: z.string().optional(),
  createdAt: timestampNumber.optional(),
});

const postItSchema: z.ZodType<PostIt> = z.object({
  id: z.string(),
  page: z.number().int(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  color: z.object({
    name: z.string(),
    class: z.string(),
    hex: z.string(),
  }),
  linkedPapers: z.array(z.string()).optional(),
  createdAt: timestampNumber.optional(),
});

const structuredNotesSchema: z.ZodType<StructuredNotes> = z.object({
  researchQuestion: z.string().optional(),
  methods: z.string().optional(),
  results: z.string().optional(),
  conclusions: z.string().optional(),
  limitations: z.string().optional(),
  futureWork: z.string().optional(),
});

export const PaperSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string(),
    title: z.string().min(1),
    link: z.string().optional().default(''),
    tags: z.array(z.string()).default([]),
    color: z.string().default('bg-nb-yellow'),
    status: z.enum(['to-read', 'reading', 'read']).default('to-read'),
    abstract: z.string().optional().default(''),
    authors: z.string().optional().default(''),
    year: z.string().optional().default(new Date().getFullYear().toString()),
    venue: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    pdfUrl: z.string().optional().default(''),
    createdAt: timestampNumber.default(() => Date.now()),
    addedDate: timestampNumber.default(() => Date.now()),
    modifiedDate: timestampNumber.optional(),
    rating: z.number().min(0).max(5).optional(),
    methods: z.array(z.string()).optional().default([]),
    organisms: z.array(z.string()).optional().default([]),
    hypotheses: z.array(z.string()).optional().default([]),
    citationCount: z.number().optional(),
    doi: z.string().optional(),
    lastReadAt: timestampNumber.optional(),
    totalReadingTime: z.number().optional(),
    readingStreak: z.number().optional(),
    hierarchicalTags: z
      .array(
        z.object({
          path: z.string(),
          level: z.number().int(),
          parent: z.string().optional(),
        })
      )
      .optional(),
    citedBy: z.array(z.string()).optional(),
    references: z.array(z.string()).optional(),
    thumbnailUrl: z.string().optional(),
    structuredNotes: structuredNotesSchema.optional().default({}),
    readingList: z.string().optional(),
    scheduledDate: z.string().optional(),
    projectIds: z.array(z.string()).optional().default([]),
    srsRepetitions: z.number().optional(),
    srsInterval: z.number().optional(),
    srsEase: z.number().optional(),
    srsDue: timestampNumber.optional(),
    journal: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    publisher: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    language: z.string().optional(),
    issn: z.string().optional(),
    pmid: z.string().optional(),
    arxivId: z.string().optional(),
    semanticScholarId: z.string().optional(),
    citationStyle: z.string().optional(),
    pdfHash: z.string().optional(),
    fileSize: z.number().optional(),
    pageCount: z.number().optional(),
    addedByPlan: z.boolean().optional().default(false),
    highlights: z.array(highlightSchema).optional(),
    postits: z.array(postItSchema).optional(),
  })
  .passthrough();

export const PaperCreateSchema = PaperSchema.omit({ id: true }).extend({
  id: z.string().optional(),
});

export type PaperModel = z.infer<typeof PaperSchema>;
export type PaperCreate = z.infer<typeof PaperCreateSchema>;
export type PaperCreateInput = PaperCreate;

export const paperUpdateSchema = PaperSchema.partial();
export type PaperUpdateInput = z.infer<typeof paperUpdateSchema>;

export const defaultPaperFields: Pick<
  PaperModel,
  | 'link'
  | 'tags'
  | 'color'
  | 'status'
  | 'abstract'
  | 'authors'
  | 'venue'
  | 'notes'
  | 'pdfUrl'
  | 'rating'
  | 'methods'
  | 'organisms'
  | 'hypotheses'
  | 'structuredNotes'
  | 'addedDate'
  | 'createdAt'
  | 'projectIds'
> = {
  link: '',
  tags: [],
  color: 'bg-nb-yellow',
  status: 'to-read',
  abstract: '',
  authors: '',
  venue: '',
  notes: '',
  pdfUrl: '',
  rating: 0,
  methods: [],
  organisms: [],
  hypotheses: [],
  structuredNotes: {},
  createdAt: Date.now(),
  addedDate: Date.now(),
  projectIds: [],
};

export const normalizePaper = (data: unknown, id?: string): PaperModel => {
  const parsed = PaperSchema.safeParse({
    ...(typeof data === 'object' ? data : {}),
    id,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join(', ');
    throw new Error(`Invalid paper data${id ? ` for ${id}` : ''}: ${issues}`);
  }

  return parsed.data;
};

export const buildPaperForCreate = (input: Partial<PaperCreate>): PaperCreate => {
  const parsed = PaperCreateSchema.safeParse({
    ...defaultPaperFields,
    ...input,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join(', ');
    throw new Error(`Cannot create paper: ${issues}`);
  }

  return parsed.data;
};

export const mergePaperUpdate = (current: PaperModel, patch: Partial<PaperModel>): PaperModel => {
  const parsed = PaperSchema.safeParse({
    ...current,
    ...patch,
    modifiedDate: Date.now(),
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join(', ');
    throw new Error(`Cannot update paper ${current.id ?? ''}: ${issues}`);
  }

  return parsed.data;
};
