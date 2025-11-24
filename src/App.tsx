// src/App.tsx
// ... (rest of imports and other app code unchanged)
// ...

function App() {
  // ... (existing state and hooks)

  // --- KEEP all existing logic above (notification, auth, handlers, etc.) ---

  // Modified Read handler for DOI-only papers
  const handleRead = (paper) => {
    if (!paper.pdfUrl || paper.pdfUrl === "") {
      // Prefer canonical DOI link
      const doiUrl = paper.link && paper.link.length > 4 ? paper.link : `https://doi.org/${paper.doi}`;
      window.open(doiUrl, '_blank');
      return;
    }
    setSelectedPaper(paper);
    setActiveView('reader');
  };

  // ... (rest of App logic)

  return (
    <div className="min-h-screen bg-nb-gray flex flex-col font-sans text-black">
      <SharedUI />
      {/* ... header ... */}
      <VirtualKanbanBoard 
        papers={filteredPapers} 
        onStatusChange={handleStatusChange}
        onRead={handleRead} // CHANGED: custom DOI/PDF handling
        onEdit={(p) => { setEditingPaper(p); setShowMetadataModal(true); }}
        onDelete={deletePaper}
      />
    </div>
  );
}

export default App;
