import { z } from 'zod';

// --- Shared Types ---

const TimestampSchema = z.number().int(); // Store as milliseconds
const IDSchema = z.string().min(1);

// --- User Profile ---
export const UserProfileSchema = z.object({
  id: IDSchema,
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    defaultCitationStyle: z.string().default('apa'),
    enableCopilot: z.boolean().default(false),
  }).default({}),
  createdAt: TimestampSchema,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// --- Project ---
// Projects are the top-level containers for research
export const ProjectSchema = z.object({
  id: IDSchema,
  ownerId: IDSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  archived: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  // Members for collaboration (future proofing)
  members: z.record(z.enum(['owner', 'editor', 'viewer'])).default({}),
});
export type Project = z.infer<typeof ProjectSchema>;

// --- Evidence ---
// Evidence is an evolved "Annotation". It represents a specific piece of information
// extracted from a source, with provenance and classification.

export const EvidenceTypeSchema = z.enum([
  'claim',      // A statement of fact or conclusion
  'result',     // A specific data point or finding
  'method',     // Description of how something was done
  'definition', // Definition of a term
  'limitation', // A stated limitation of the study
  'quote',      // A direct quote (general)
]);

export const EvidenceSchema = z.object({
  id: IDSchema,
  projectId: IDSchema, // Evidence belongs to a project (contextual)
  paperId: IDSchema,   // Source paper
  type: EvidenceTypeSchema.default('quote'),
  
  // The content
  text: z.string(), // The extracted text
  summary: z.string().optional(), // User's interpretation/summary
  
  // Provenance (Location in the source)
  provenance: z.object({
    page: z.number(),
    rects: z.array(z.object({ // Bounding boxes for highlighting
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })).optional(),
    startOffset: z.number().optional(), // Character offset if using text extraction
    endOffset: z.number().optional(),
  }),

  // Meta
  tags: z.array(z.string()).default([]),
  confidence: z.enum(['high', 'medium', 'low']).default('high'),
  isRefuted: z.boolean().default(false), // If the user disagrees or it's refuted later
  
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Evidence = z.infer<typeof EvidenceSchema>;

// --- Note ---
// Project-scoped notes (markdown)
export const NoteSchema = z.object({
  id: IDSchema,
  projectId: IDSchema,
  title: z.string(),
  content: z.string(), // Markdown
  tags: z.array(z.string()).default([]),
  linkedEvidence: z.array(IDSchema).default([]), // IDs of evidence referenced
  linkedPapers: z.array(IDSchema).default([]),   // IDs of papers referenced
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Note = z.infer<typeof NoteSchema>;

// --- Systematic Review Types (Placeholder for later) ---
export const ScreeningDecisionSchema = z.enum(['include', 'exclude', 'maybe']);
