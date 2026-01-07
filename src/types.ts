// Core Paper type with extended metadata
export interface Paper {
  id: string;
  userId: string;
  title: string;
  link: string;
  tags: string[];
  color: string;
  status: 'to-read' | 'reading' | 'read';
  abstract: string;
  authors: string;
  year: string;
  venue: string;
  notes: string;
  pdfUrl: string;
  createdAt: number;
  
  // Existing new fields
  rating?: number; // 1-5 stars
  methods?: string[]; // Experimental methods
  organisms?: string[]; // Model organisms studied
  hypotheses?: string[]; // Research hypotheses
  citationCount?: number; // From Semantic Scholar
  doi?: string;
  lastReadAt?: number;
  totalReadingTime?: number; // in seconds
  readingStreak?: number;
  hierarchicalTags?: HierarchicalTag[];
  citedBy?: string[]; // Paper IDs that cite this
  references?: string[]; // Paper IDs this cites
  thumbnailUrl?: string; // Cached first page
  structuredNotes?: StructuredNotes;
  // NEW: Grouping Field
  readingList?: string; // e.g. "Master Thesis Prep"
  // NEW: Reading Timeline
  scheduledDate?: string; // YYYY-MM-DD format for timeline view
  projectIds?: string[];

  // Spaced Repetition System fields
  srsRepetitions?: number; // Number of successful reviews in a row
  srsInterval?: number; // Current interval in days
  srsEase?: number; // Ease factor (difficulty multiplier)
  srsDue?: number; // Next review date (ms since epoch)
  
  // New detailed metadata fields
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  keywords?: string[];
  language?: string;
  issn?: string;
  pmid?: string; // PubMed ID
  arxivId?: string;
  semanticScholarId?: string;
  citationStyle?: string; // APA, MLA, Chicago, etc.
  pdfHash?: string; // For duplicate detection
  fileSize?: number;
  pageCount?: number;
  addedDate?: number;
  modifiedDate?: number;
}

export interface HierarchicalTag {
  path: string; // e.g., "Neuroscience > Ion Channels > Voltage-gated"
  level: number;
  parent?: string;
}

export interface StructuredNotes {
  researchQuestion?: string;
  methods?: string;
  results?: string;
  conclusions?: string;
  limitations?: string;
  futureWork?: string;
}

export interface Highlight {
  id: string;
  page: number;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
  color: string;
  text: string;
  category: 'methodology' | 'results' | 'related-work' | 'discussion' | 'limitation' | 'general';
  linkedPapers?: string[]; // Paper IDs
  note?: string;
  createdAt?: number;
}

export interface PostIt {
  id: string;
  page: number;
  x: number;
  y: number;
  text: string;
  color: { name: string; class: string; hex: string };
  linkedPapers?: string[];
  createdAt?: number;
}

export interface ReadingSession {
  paperId: string;
  startTime: number;
  endTime?: number;
  duration?: number; // seconds
  pagesRead?: number;
}

export interface FilterState {
  searchTerm: string;
  tags: string[];
  yearRange: [number, number];
  venues: string[];
  authors: string[];
  status: string[];
  colors: string[];
  methods: string[];
  organisms: string[];
  rating: number | null;
  readingLists: string[];
}

export interface CitationData {
  paperId: string;
  externalIds: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
  };
  title: string;
  citationCount: number;
  references: Array<{ paperId: string; title: string }>;
  citations: Array<{ paperId: string; title: string }>;
}

export interface AuthorNode {
  id: string;
  name: string;
  paperCount: number;
  collaborators: string[]; // Author IDs
}

export interface ReadingStats {
  papersReadTotal: number;
  papersReadThisMonth: number;
  papersReadThisWeek: number;
  totalReadingTime: number; // seconds
  averageReadingTime: number; // seconds per paper
  currentStreak: number; // days
  longestStreak: number; // days
  tagFrequency: Record<string, number>;
  methodFrequency: Record<string, number>;
  organismFrequency: Record<string, number>;
  yearDistribution: Record<string, number>;
  monthlyReadings: Array<{ month: string; count: number }>;
}

export interface BibTeXEntry {
  type: string; // article, book, inproceedings, etc.
  citationKey: string;
  fields: Record<string, string>;
}

export interface RelatedPaper {
  paperId: string;
  title: string;
  similarity: number; // 0-1
  sharedTags: string[];
  sharedAuthors: string[];
}
