# PaperVault Research OS Schema

## User-scoped collections

All new research OS entities live under:

```
/users/{uid}/...
```

### Projects (`/users/{uid}/projects/{projectId}`)
- **name** (string)
- **description** (string, optional)
- **conceptIds** (string[])
- **paperIds** (string[])
- **status** (string, optional)
- **milestones** (string[])
- **collaborators** (string[])
- **createdAt** (number, ms)
- **updatedAt** (number, ms)
- **archived** (boolean)

### Concepts (`/users/{uid}/concepts/{conceptId}`)
- **type** (BrainRegion | CellType | Method | Paradigm | Molecule | Model | Theory | DatasetFormat | Metric)
- **name** (string)
- **parentId** (string, optional)
- **aliases** (string[])
- **createdAt** (number, ms)
- **updatedAt** (number, ms)

### Protocols (`/users/{uid}/protocols/{protocolId}`)
- **projectId** (string)
- **title** (string)
- **version** (string)
- **bodyMd** (string)
- **checklist** (array of `{ id, text, done }`)
- **attachments** (string[])
- **createdAt** (number, ms)
- **updatedAt** (number, ms)

### Runs (`/users/{uid}/runs/{runId}`)
- **projectId** (string)
- **date** (ISO string)
- **aim** (string, optional)
- **modelConceptIds** (string[])
- **methodConceptIds** (string[])
- **datasetLinks** (string[])
- **codeLinks** (string[])
- **parameters** (object)
- **resultsSummaryMd** (string)
- **metrics** (array of `{ name, value, unit? }`)
- **artifacts** (string[])
- **qcMd** (string)
- **parentRunId** (string, optional)
- **sweepKey** (string, optional)
- **createdAt** (number, ms)
- **updatedAt** (number, ms)

### Dataset & Code Links (`/users/{uid}/datasetLinks/{linkId}`)
- **projectId** (string)
- **type** (Dataset | Code | Notebook)
- **title** (string)
- **url** (string)
- **description** (string, optional)
- **formatConceptIds** (string[])
- **license** (string, optional)
- **version** (string, optional)
- **createdAt** (number, ms)
- **updatedAt** (number, ms)

### Paper Extractions (`/users/{uid}/paperExtractions/{extractionId}`)
- **paperId** (string)
- **projectId** (string, optional)
- **taskParadigmConceptIds** (string[])
- **dataTypeConceptIds** (string[])
- **modelTypeConceptIds** (string[])
- **trainingObjective** (string, optional)
- **evaluationMetrics** (string[])
- **keyFindingsMd** (string)
- **limitationsMd** (string)
- **reproChecklist** (array of `{ id, label, done }`)
- **linkedRunIds** (string[])
- **linkedConceptIds** (string[])
- **createdAt** (number, ms)
- **updatedAt** (number, ms)

### Capture Inbox (`/users/{uid}/captureInbox/{itemId}`)
- **url** (string)
- **title** (string, optional)
- **source** (string, optional)
- **createdAt** (number, ms)
- **updatedAt** (number, ms)

## Legacy top-level collections

### Papers (`/papers/{paperId}`)
- **userId** (string)
- **projectIds** (string[])
- ...existing PaperVault metadata fields.

## Relationships

- **Projects ↔ Papers**: `paper.projectIds` links a paper to multiple projects.
- **Projects ↔ Concepts**: `project.conceptIds` anchor projects to key concepts.
- **Runs/Protocols/Dataset Links**: each record stores `projectId`.
- **Paper Extractions**: link to `paperId` and optional `projectId`.
