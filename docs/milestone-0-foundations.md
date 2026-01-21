# Milestone 0 — Foundations

This note captures the intent and acceptance criteria for the foundational upgrade that unblocks the project-centric Research OS roadmap.

## Goals
- Add a small domain layer with runtime validation for user-facing entities (papers, projects scaffold, feature flags).
- Introduce a data-access layer that centralizes Firestore access and normalizes documents.
- Add defensive UI wiring: global error boundary and centralized toast notifications for sync/index failures.
- Seed a feature flag system so experimental modules (Copilot, semantic search, projects) can be toggled safely.
- Establish automated tests for the new domain/utilities without breaking the existing app surface.

## Scope
- Domain models for `Paper`, `Project` (scaffold), and `FeatureFlag` using Zod validation with safe parsing.
- Firestore repository helpers for papers with subscription, create, update, and delete flows.
- React providers for feature flags and toasts, plus an application-level error boundary.
- Minimal QAable wiring inside the existing `App` to consume the repository + providers.
- Unit tests for validation utilities and feature flag behavior via the Node test runner (offline-friendly).

## Acceptance criteria
- Papers load and persist through the repository layer; failures surface as toasts instead of silent crashes.
- Error boundary catches render failures and offers recovery without a blank screen.
- Feature flags persist to `localStorage` and are readable/toggleable in-app.
- Tests run via `npm test` and cover schema validation + feature flag persistence.
- GitHub Pages deploy path remains `/paper-vault/` (unchanged).

## Manual QA checklist
- [ ] Login succeeds and the library view renders without console errors.
- [ ] Upload a PDF: toast shows progress and completion; paper appears in the list.
- [ ] Toggle a feature flag in the header; reload and confirm the toggle is remembered.
- [ ] Force an error (e.g., disconnect Firebase credentials) and verify a toast plus the error boundary fallback appear instead of a crash.
- [ ] Open the reader and ensure annotations still load and save.

## Follow-ups
- Replace the Node test runner fallback with full Vitest once registry access is available.
- Expand repositories for projects/evidence and add Firestore security rule templates.
- Move remaining Firestore calls in legacy components into the repository layer.
