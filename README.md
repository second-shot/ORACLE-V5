# ORA-CALL

ORA-CALL is a focused React + Vite app for transforming raw input into structured Oracle outputs, reviewing decisions, and tracking operational drafts.

## App Profile

### Core Value
- Turn unstructured input into usable output through a visible pipeline.
- Keep decisions auditable with archive history, routing signals, and control-panel logs.
- Maintain a sharp Oracle-branded interface with lightweight navigation.

### User Surfaces
| Surface | Route | Purpose |
|---|---|---|
| Entry | `/` | Landing and flow entry point |
| Run | `/run` | Input capture, pipeline execution, and output surfacing |
| Home | `/home` | Oracle home context |
| Missions | `/missions` | Mission-oriented view |
| Control Panel | `/panel` | Draft generation, approval workflow, and logs |
| Output Detail | `/output/:id` | Direct inspection of a specific output |

## Architecture at a Glance

```mermaid
graph LR
  A[User Input\nText / File] --> B[Run UI\n/src/pages/Run.jsx]
  B --> C[Oracle Pipeline\n/src/lib/oracleEngine.js]
  C --> D[Text Intelligence\n/src/lib/oracleText.js]
  C --> E[Object Schema\n/src/lib/oracleSchema.js]
  C --> F[Archive + History\n/src/lib/oracleArchive.js]
  F --> G[localStorage\nora-call-* keys]
  C --> H[Surface Cards + Output View]
  I[Control Panel\n/src/components/ControlPanel.jsx] --> C
  I --> J[Panel Store\n/src/lib/controlPanelStore.js]
  J --> G
```

```mermaid
sequenceDiagram
  participant U as User
  participant R as Run Screen
  participant P as runOraclePipeline
  participant A as Archive Store
  participant O as Output Views

  U->>R: Submit text or .txt file
  R->>P: runOraclePipeline(raw)
  P->>P: normalise → compress → classify → score → route
  P->>A: storeInArchive(object)
  A-->>R: Persisted object + history context
  R-->>O: Surface card and deep-link output
```

## Repository Structure

| Path | Role |
|---|---|
| `src/` | React app (pages, components, styling, pipeline libs) |
| `oracle/docs/` | System-level direction, standards, architecture |
| `oracle/mia/` | Agent identity, rules, prompts, mission framework |
| `oracle_agent_api/` | Backend API scaffold |
| `oracle_workspace/` | Workspace state buckets (`drafts/approved/rejected/logs`) |
| `canon/` | Historical canon material |

## Local Development

From `/tmp/workspace/second-shot/ORACLE-V5`:

1. `npm ci`
2. `npm run dev`
3. `npm run build`
4. `npm run preview`

## Design Intent

The project standard is simple: minimal noise, explicit structure, and visible operational flow.
