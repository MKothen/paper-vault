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
  
  // New fields
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
  id: number;
  page: number;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
  color: string;
  text: string;
  category?: 'methodology' | 'results' | 'related-work' | 'discussion' | 'limitation' | 'general';
  linkedPapers?: string[]; // Paper IDs
  note?: string;
}

export interface PostIt {
  id: number;
  page: number;
  x: number;
  y: number;
  text: string;
  color: { name: string; class: string; hex: string };
  linkedPapers?: string[];
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
