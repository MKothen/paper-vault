# 📚 PaperVault
A serverless, visual research paper organizer hosted on GitHub Pages.

## Features
- **Kanban Board:** Organize papers by status (To Read, Reading, Done).
- **Auto-Fill:** Paste a DOI to fetch Title, Link, and Abstract automatically via Semantic Scholar API.
- **Cloud Sync:** Uses Google Firebase for authentication and database storage.
- **Export:** Download your library as JSON or BibTeX for Zotero/LaTeX.

## How to Run Locally
1. Clone the repo.
2. Run `npm install`.
3. Add your Firebase keys to `src/firebase.ts`.
4. Run `npm run dev`.

## How to Deploy
Run `npm run deploy` to build and push to GitHub Pages.
