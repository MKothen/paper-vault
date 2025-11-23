# 📚 PaperVault
A powerful, serverless research paper management system designed for researchers. Built with React, TypeScript, Firebase, and hosted on GitHub Pages.

![PaperVault](https://img.shields.io/badge/status-active-success.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Mobile](https://img.shields.io/badge/mobile-responsive-brightgreen)

## ✨ Core Features

### 📱 Mobile-Responsive Design
- **Fully Responsive:** Optimized layouts for phones, tablets, and desktops
- **Touch-Friendly:** 44x44px minimum touch targets for all interactions
- **Adaptive Kanban:** Vertical stacking on mobile, horizontal on desktop
- **Mobile PDF Reader:** Full-screen overlay sidebar with touch gestures
- **Responsive Typography:** Scales appropriately for readability on all screens
- **No Horizontal Scroll:** Content fits perfectly on any viewport

### 📋 Organization & Management
- **Kanban Board:** Visual organization by status (To Read, Reading, Done)
- **Smart PDF Upload:** Drag-and-drop PDFs with automatic metadata extraction
- **Auto-Fill Metadata:** Paste DOI to fetch title, authors, abstract, citations via Semantic Scholar API
- **BibTeX Import/Export:** Import papers from BibTeX or export library for Zotero/LaTeX
- **Star Ratings:** Rate papers by importance (1-5 stars)
- **Hierarchical Tags:** Nested tag system (e.g., "Neuroscience > Ion Channels")
- **Color Coding:** Visual categorization with vibrant color palette
- **Duplicate Detection:** Warns when uploading similar papers

### 🔬 Research-Specific Features
- **Method Tracking:** Tag papers by experimental methods used
- **Model Organism Filter:** Quickly find papers by species studied
- **Hypothesis Tracking:** Link papers that test similar hypotheses
- **Citation Network:** Visualize citation relationships between papers
- **Citation Count Integration:** Automatic citation counts from Semantic Scholar
- **Related Work Finder:** Discover similar papers based on your library

### 📖 Advanced PDF Reader
- **Inline Annotations:** Highlight text with customizable colors
- **Categorized Highlights:** Tag highlights by type (methods, results, related work, etc.)
- **Sticky Notes:** Draggable post-it notes on PDF pages
- **Cross-Paper Linking:** Link annotations between different papers
- **Annotation Export:** Export all highlights and notes to Markdown/PDF
- **Annotation Search:** Full-text search across all highlights and notes
- **Table of Contents:** Auto-extracted PDF outline navigation
- **Pomodoro Timer:** Built-in focus timer for reading sessions
- **Dark Mode:** Eye-friendly reading in any lighting
- **Zoom & Navigation:** Precise control with keyboard shortcuts
- **Mobile-Optimized:** PDF scales automatically to fit mobile screens

### 📝 Note-Taking & Analysis
- **Structured Notes Template:** Organized sections for:
  - Research Question
  - Methods
  - Results  
  - Conclusions
  - Limitations
  - Future Work
- **Full-Text PDF Search:** Search within all PDF content
- **Literature Review Mode:** Special view for comparing multiple papers side-by-side

### 🔍 Advanced Search & Filtering
- **Multi-Filter Sidebar:** Simultaneous filtering by:
  - Tags (multi-select)
  - Year range
  - Venue/Journal
  - Authors
  - Status
  - Methods
  - Model organisms
  - Star rating
- **Fuzzy Search:** Smart text matching across titles, tags, and content
- **Saved Searches:** Quick-access to common filter combinations

### 📊 Analytics & Insights
- **Reading Dashboard:**
  - Total papers and papers read
  - Reading time statistics
  - Monthly reading trends (6-month chart)
  - Top tags frequency analysis
  - Status distribution visualization
- **Reading Streak Tracker:** Gamified consecutive reading days
- **Tag Cloud:** Visual representation of tag frequency
- **Author Network Graph:** Collaboration network visualization
- **Venue Analysis:** Track most-read journals/conferences

### 🕸️ Knowledge Graph
- **Interactive Network:** Visual representation of paper connections
- **Multiple Connection Types:**
  - Shared tags and topics
  - Citation relationships
  - Common methods
  - Same model organisms
- **Cluster View:** Auto-clustering by topic/tag groups
- **Connection Strength:** Edge thickness shows relationship strength
- **Interactive Legends:** Click tags to highlight connected papers
- **Corkboard Design:** Realistic pins and post-it aesthetic
- **Filter by Properties:** Show only specific years, tags, or statuses

### 📅 Timeline View
- **Chronological Organization:** Papers sorted by publication year
- **Visual Timeline:** Interactive year-based navigation
- **Trend Analysis:** See research evolution over time

### ⚡ Performance & UX
- **Virtual Scrolling:** Smooth performance with 1000+ papers
- **PDF Thumbnail Cache:** Fast preview generation
- **Offline Support:** PWA capabilities for offline access
- **Dark Mode:** System-wide dark theme support
- **Keyboard Shortcuts:** Power-user navigation
- **Fully Responsive:** ✨ Works seamlessly on desktop, tablet, and mobile
- **Touch-Optimized:** All interactions meet mobile accessibility standards

### ☁️ Sync & Backup
- **Cloud Sync:** Real-time Firebase synchronization
- **Google Authentication:** Secure login with Google account
- **Multi-Device:** Access from anywhere (desktop, tablet, phone)
- **Auto-Save:** Never lose your annotations or notes
- **Export Library:** Download entire library as JSON

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase account
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/MKothen/paper-vault.git
cd paper-vault

# Install dependencies
npm install

# Add Firebase configuration
# Create src/firebase.ts with your Firebase config

# Run development server
npm run dev
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Google Authentication
3. Create Firestore Database
4. Enable Firebase Storage
5. Add your config to `src/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 📱 Mobile Usage

PaperVault is fully optimized for mobile devices:

- **Library View:** Kanban columns stack vertically for easy scrolling
- **PDF Reading:** Sidebar becomes a full-screen overlay accessible via menu button
- **Touch Interactions:** All buttons are appropriately sized (44x44px minimum)
- **Responsive Forms:** Metadata editing works seamlessly on small screens
- **No Zooming Required:** All text is readable without pinch-to-zoom

For detailed mobile implementation, see [MOBILE_RESPONSIVE_UPDATES.md](./MOBILE_RESPONSIVE_UPDATES.md)

## 📖 Usage Guide

### Adding Papers

**Method 1: Smart Drop**
- Drag and drop PDF files
- Automatic title, author, and metadata extraction
- DOI detection and citation fetching

**Method 2: Manual Entry**
- Paste DOI for auto-fill
- Manual metadata entry
- BibTeX import

### Organizing Papers

1. **Kanban Board:** Drag papers between "To Read," "Reading," and "Read"
2. **Tags:** Add multiple tags for categorization
3. **Methods:** Track experimental approaches
4. **Organisms:** Label model species
5. **Rating:** Star important papers
6. **Color:** Visual grouping by research area

### Reading & Annotating

1. Click "Read" button to open PDF viewer
2. Toggle highlight mode (toolbar)
3. Select text to create highlights
4. Choose highlight category (methods, results, etc.)
5. Add sticky notes for longer thoughts
6. Fill structured notes template
7. Link annotations to other papers

### Finding Papers

1. **Search Bar:** Quick text search
2. **Filter Sidebar:** Advanced multi-filter
3. **Graph View:** Visual exploration
4. **Timeline:** Browse by publication year
5. **Analytics:** Find most-used tags

## 🔧 Development

### Project Structure

```
paper-vault/
├── src/
│   ├── components/          # React components
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── VirtualKanbanBoard.tsx
│   │   └── EnhancedMetadataModal.tsx
│   ├── utils/              # Utility functions
│   │   ├── semanticScholar.ts
│   │   └── bibtex.ts
│   ├── types.ts            # TypeScript definitions
│   ├── App.tsx             # Main application
│   ├── firebase.ts         # Firebase config
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── IMPLEMENTATION_GUIDE.md # Feature implementation guide
├── MOBILE_RESPONSIVE_UPDATES.md # Mobile design documentation
└── package.json
```

### Tech Stack

- **Frontend:** React 19.2, TypeScript 5.9
- **UI:** Tailwind CSS (with responsive breakpoints), Lucide Icons
- **PDF:** React-PDF (PDF.js)
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Auth:** Firebase Authentication
- **Charts:** Recharts
- **Graph:** React-Force-Graph-2D
- **Virtual Scroll:** React-Window
- **Build:** Vite
- **Deploy:** GitHub Pages

### Adding New Features

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed instructions on:
- Adding new metadata fields
- Extending the graph visualization
- Creating custom filters
- Implementing new views

For mobile-responsive development, see [MOBILE_RESPONSIVE_UPDATES.md](./MOBILE_RESPONSIVE_UPDATES.md)

## 🎨 Design System

PaperVault uses a vibrant neobrutalist design:
- **Colors:** Yellow, Cyan, Pink, Lime, Purple, Orange
- **Borders:** Bold 3-4px black borders
- **Shadows:** Offset box shadows
- **Typography:** Space Grotesk, bold weights
- **Interactive:** Hover translations, strong feedback
- **Responsive:** Adaptive sizing across all devices

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple screen sizes (mobile, tablet, desktop)
5. Submit a pull request

## 📝 License

MIT License - feel free to use for your research!

## 🙏 Acknowledgments

- **Semantic Scholar API:** Citation data and metadata
- **PDF.js:** PDF rendering engine
- **Firebase:** Backend infrastructure
- **React Community:** Amazing ecosystem
- **Tailwind CSS:** Responsive design utilities

## 🐛 Known Issues & Roadmap

### Current Limitations
- Semantic Scholar API rate limits (100 req/5min)
- PDF.js memory usage with large files
- LocalStorage 5-10MB limit

### Planned Features
- [ ] AI-powered paper summarization
- [ ] Collaborative annotations
- [ ] Zotero bidirectional sync
- [ ] Native mobile app (React Native)
- [ ] Browser extension for quick saves
- [ ] Export to Notion/Obsidian
- [ ] Custom metadata fields
- [ ] Paper recommendations ML
- [ ] Gesture controls for mobile (swipe, pinch-to-zoom)
- [ ] PWA install prompt

## 📧 Contact

For questions or suggestions, open an issue on GitHub!

---

**Made with ☕ for researchers by researchers**  
**📱 Now fully mobile-responsive!**
