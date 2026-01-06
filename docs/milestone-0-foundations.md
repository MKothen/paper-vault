# Milestone 0 — Foundations

Short design note outlining the baseline architecture adjustments for the “Research OS” direction while keeping the current PaperVault app stable and deployable.

## Goals
- Introduce a typed domain layer with runtime validation for persisted entities.
- Add a Firestore data-access layer to decouple data fetching/mutations from UI.
- Establish a feature flag system for experimental modules (Copilot, semantic search).
- Add safety nets: global error boundary and consistent toast notifications for sync/indexing failures.
- Land Vitest as the test harness with initial unit coverage on models/utilities.

## Data Model
- **Paper (domain)**: validated with Zod; includes core fields (`id`, `userId`, `title`, `status`, `color`, `tags`, `pdfUrl`, `createdAt`) plus optional research metadata (DOI, citation counts, SRS fields, structured notes, reading lists, hashes/thumbnails).
- **Feature flags**: `copilot`, `semanticSearch`, `offlineCache` (local-only defaults; overridable via env/localStorage).
- Firestore converter layer parses documents into domain-safe `Paper` objects and normalizes defaults for arrays/optional strings.

## UI/UX Flows
- **Error boundary**: wraps the app; shows a friendly fallback with retry + diagnostics.
- **Toast provider**: centralizes success/error/warning/info toasts; used for sync/indexing/upload errors across the app.
- **Feature flag panel**: lightweight toggle surface in the header to flip Copilot/Semantic Search flags (persisted locally).

## Edge Cases & Handling
- Firestore snapshot errors -> toast + console diagnostic.
- Invalid Firestore payloads -> filtered out with validation error logged; rest of the snapshot continues.
- Upload/indexing failures -> surfaced via toasts; operations remain cancellable.
- Missing env feature flags or malformed JSON -> ignored with defaults applied.

## Acceptance Criteria
- Domain Zod schemas exist for papers (with create/update variants) and are used by the repository layer.
- Repository functions (`listenToUserPapers`, `createPaper`, `updatePaper`, `removePaper`) back the main app flows.
- Feature flag provider + panel present; flags persist locally and can be read in components.
- Error boundary active in root render tree; toast provider renders global toasts.
- Vitest configured and running with unit tests for paper validation and feature flag parsing/merging.
- GitHub Pages deploy path (`/paper-vault/`) remains unchanged.

## Manual QA Checklist
- Launch `npm run dev` and confirm app loads without Firebase config (should show auth gate without crashing).
- Sign in, add a paper via DOI autofill; verify toast feedback on success/failure.
- Drag-drop a PDF; confirm upload progress toasts and list updates without reload.
- Toggle Copilot/Semantic Search flags from the header; refresh page and verify persistence.
- Force an error (e.g., disable network during sync) and confirm error toast + app remains usable.
