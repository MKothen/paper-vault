# Tier 1 — Neuro Research Hub

## Overview
Tier 1 introduces the Neuro Research Hub with ontology tagging, simulation run logging, structured evidence extraction, Obsidian export, and a code snippet library.

## Firestore schema (additive)
All documents live under `users/{uid}` to preserve per-user isolation.

- `ontologyNodes/{nodeId}`
  - `label`, `type`, `parentId`, `path`, `synonyms`, `externalRefs`, `createdAt`, `updatedAt`
- `simulationModels/{modelId}`
  - `name`, `description`, `framework`, `linkedPapers`, `assumptionsMd`, `validationPapers`, `parametersSchema`, `defaultParams`
- `simulationRuns/{runId}`
  - `modelId`, `runLabel`, `timestampStart`, `timestampEnd`, `params`, `randomSeed`, `environment`, `outputs`, `metrics`, `linkedPapers`, `tags`, `notesMd`
- `evidenceItems/{evidenceId}`
  - `paperId`, `entityType`, `fields`, `extractedFrom`, `tags`
- `codeSnippets/{snippetId}`
  - `title`, `code`, `language`, `tags`, `linkedPapers`, `linkedModels`
- `quoteBank/{quoteId}`
  - `paperId`, `quote`, `context`, `page`, `tags`
- `methodsSnippets/{snippetId}`
  - `title`, `bodyMd`, `linkedPapers`

## UI flows
- **Ontology:** seed the default taxonomy, add nodes, search, and tag papers/evidence.
- **Simulation Hub:** create models, upload a run log JSON, attach artifacts, and link runs to papers.
- **Evidence:** choose an entity type, enter structured values + units, and export CSV.
- **Exports:** generate Obsidian Markdown files per paper with deterministic ordering.
- **Snippets:** store Python snippets linked to papers and ontology tags.

## Local simulation logger template
```python
import json
import platform
import time

run_log = {
    "schemaVersion": 1,
    "modelRef": "ca1_hcn_model",
    "runLabel": "baseline_hcn",
    "params": {"duration_ms": 1000, "dt_ms": 0.1},
    "timestamps": {"start": int(time.time() * 1000)},
    "metrics": {"runtimeSeconds": 12.5, "peakMemoryMB": 512},
    "randomSeed": 1234,
    "environment": {
        "pythonVersion": platform.python_version(),
        "packageVersions": {"brian2": "2.6"},
    },
    "artifacts": [
        {"fileName": "voltage_trace.png", "type": "image"},
        {"fileName": "spikes.csv", "type": "table"},
    ],
}

run_log["timestamps"]["end"] = int(time.time() * 1000)

with open("run_log.json", "w") as f:
    json.dump(run_log, f, indent=2)
```

## Environment variables
No new environment variables are required for Tier 1 beyond the existing Firebase configuration.

## Screenshots
- Ontology tree view — _add screenshot here_
- Simulation run import — _add screenshot here_
- Evidence extraction form — _add screenshot here_
- Obsidian export panel — _add screenshot here_
- Snippet library — _add screenshot here_
