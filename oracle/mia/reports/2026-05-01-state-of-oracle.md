# State of Oracle Audit

**Mission:** MIA-001
**Date:** 2026-05-01
**Author:** Mia
**Status:** review

---

## Current State

Oracle is a real but uneven system. The operating skeleton was built and committed on 2026-05-01. The structure exists. The law is written. The agent has a defined mindframe. But the system has never run a real mission cycle before today. This is the first one.

**What physically exists in the repo:**

### oracle/docs/ — 6 files
- `vision.md` — Oracle's purpose and non-negotiables. Solid.
- `architecture.md` — Three-ring model documented. Current.
- `standards.md` — 12 standards defined across truth, documentation, output, escalation. Present.
- `workflows.md` — Mission loop, memory workflow, review workflow, backlog workflow. Present.
- `backlog.md` — Live register. Currently sparse but structured correctly.
- `memory.md` — 3 founding memory entries. Format established.

### oracle/mia/ — 9 core files + 3 subfolders
- `README.md`, `profile.md`, `role.md`, `operating-rules.md`, `system.md` — Identity and law layer. Coherent.
- `missions.md` — 5 missions defined. MIA-001 through MIA-005.
- `memory.md` — 1 founding pattern entry. Format established.
- `report-template.md`, `decision-template.md` — Output discipline in place.
- `prompts/` — `system.md`, `planner.md`, `reviewer.md` — Activation layer present.
- `checklists/` — `mission-review.md` — Brake system present.
- `reports/` — Created today. This is the first file in it.

### Repo-level (outside oracle/)
- `canon/` — 16 legacy canon files. Pre-Mia era. Not yet integrated into the oracle/ layer.
- `agents/oracle_operator_agent.py` — A working Python agent. Reads from `canon/oracle_v5_canon.md`. Not yet wired to oracle/ docs.
- `agent-room/` — Status and log files for the Python agent. Active but disconnected from Mia's layer.
- `.github/labeler.yml` — Labels PRs by path. Has no label for `oracle/` or `mia/` paths. Gap.
- `.github/workflows/label.yml` — Labeler workflow. Uses `actions/labeler@v4`. Functional.
- `.github/workflows/manual.yml` — A hello-world stub. No real function.
- No `ISSUE_TEMPLATE`, no `pull_request_template.md`, no `CODEOWNERS`.
- `src/` — Vite/React frontend. Oracle engine, archive, schema, pricing, control panel. Active codebase.
- `oracle_agent_api/` — FastAPI backend stub. `main.py` and `requirements.txt`. Minimal.
- `oracle_workspace/` — 4 folders with `.gitkeep`. Approved, drafts, logs, rejected. Empty. No workflow writes to them yet.

---

## Findings

### What is working
1. The oracle/ structure is coherent and internally consistent. The three-ring model (system truth → agent instruction → execution discipline) is legible and navigable.
2. Standards are written and numbered. They can be referenced.
3. The mission format is clear. Mia knows how to move.
4. Memory format is established. Entries have dates, sources, and status.
5. The Python agent (`oracle_operator_agent.py`) is real code that logs and reads state. It is more advanced than most of the surrounding infrastructure.

### What is missing
1. **oracle/ is not wired to the rest of the repo.** The Python agent reads `canon/`, not `oracle/docs/`. The labeler has no `oracle` or `mia` label. The frontend (`src/`) has no connection to oracle docs. These are separate systems sharing a repo.
2. **No GitHub issue template for Mia missions.** Missions are documented in `oracle/mia/missions.md` but cannot be opened as trackable GitHub issues.
3. **No pull request template.** PRs have no standard structure. The labeler exists but it fires without context.
4. **No CODEOWNERS.** No one is assigned ownership of oracle/ or mia/ paths. Changes can land without review routing.
5. **`oracle_workspace/` is dead.** Four folders exist but nothing writes to them. No workflow, no agent, no process routes output there.
6. **`canon/` is orphaned.** 16 files exist from before the oracle/ structure was built. They contain real decisions and rules but are not referenced from oracle/docs/ and are not linked into Mia's navigation order. Risk of contradiction or redundancy.
7. **`agent-room/` is disconnected.** The operator agent logs to `agent-room/` but Mia has no visibility into those logs and does not read from them.
8. **The manual.yml workflow is a stub.** It does nothing operational.
9. **`oracle_agent_api/main.py` is minimal.** API exists but has no routes that expose oracle/ data.

### What is weak
1. **Memory will decay without discipline.** The format is good but the habit is untested. One cycle in and already three files could need updating.
2. **`oracle/mia/missions.md` has no status tracking over time.** Once a mission completes, there is no archived record separate from the active file. Completed missions will accumulate inline and obscure the active list.
3. **No link between oracle/docs/backlog.md and oracle/mia/missions.md.** They are parallel structures that could drift out of sync. Backlog items reference missions by name but not by ID. Missions reference outputs but not backlog IDs.
4. **The checklist in `checklists/mission-review.md` has 7 questions but no pass/fail record.** There is no place to log that the checklist was actually run.

### What is inconsistent
1. **Two README files at root level.** `README.md` (root) was updated to reflect Oracle. But `oracle-v5-canon.md` still exists at root as a parallel document with overlapping scope.
2. **`canon/` and `oracle/docs/` may contradict each other.** Both contain system-level definitions (agent rules, standards, architecture). No reconciliation has been done.
3. **The labeler has a `documentation` label that catches all `.md` files** — including oracle/ files — but there is no `oracle` or `mia` label to distinguish platform docs from system docs from agent output.

---

## Risks

| Risk | Likelihood | Impact |
|------|------------|--------|
| `canon/` and `oracle/docs/` drift into contradiction | High | High — creates competing sources of truth |
| Memory entries stop being updated after a few cycles | Medium | High — system loses its learning capacity |
| Missions pile up in `missions.md` with no archival split | High | Medium — active list becomes unreadable |
| `oracle_workspace/` stays empty forever | High | Medium — a dead folder structure signals the system is not operational |
| GitHub PRs land on oracle/ with no issue link, no review routing | Medium | Medium — changes become untraceable |

---

## Recommendation

Do not expand the system further before fixing the three core gaps:

1. **Reconcile `canon/` with `oracle/docs/`** — either migrate the relevant canon into oracle/docs/ or formally reference canon from oracle/docs/. End the two-source-of-truth problem.
2. **Wire the GitHub layer** — ISSUE_TEMPLATE, pull_request_template, updated labeler with `oracle` and `mia` labels, CODEOWNERS. This is what turns oracle/ from a document folder into a governed system.
3. **Make `oracle_workspace/` live** — at minimum, route Mia's report output there or establish that `oracle/mia/reports/` is the canonical output folder and deprecate oracle_workspace/ explicitly.

---

## Next Action

Activate MIA-002, MIA-003, and MIA-005 immediately. Then build the GitHub support layer so that future missions can be tracked as issues, reviewed as PRs, and labelled automatically.

---

## Top 3 Priorities

1. **Build the GitHub support layer** — ISSUE_TEMPLATE, PR template, updated labeler, CODEOWNERS. This is the infrastructure that makes Oracle governable, not just legible.
2. **Reconcile `canon/` with `oracle/docs/`** — map which canon files are superseded, which should be migrated, and which should be formally archived. Do this in MIA-002.
3. **Establish `oracle/mia/reports/` as the canonical output folder** — deprecate or repurpose `oracle_workspace/` with a clear decision logged.

---

*Checklist run: 2026-05-01*
- Output is real and visible: ✓
- Definition of done met: ✓
- Facts separated from assumptions: ✓
- Risks documented: ✓
- Next action named: ✓
- Memory updated: ✓ (see oracle/docs/memory.md and oracle/mia/memory.md)
- Oracle documentation updated: ✓ (architecture.md, backlog.md)
