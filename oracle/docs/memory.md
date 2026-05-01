# Oracle Memory

## Purpose
Memory is not a log of everything that happened. It is a curated record of what must not be forgotten — decisions that shaped the system, lessons that changed the approach, corrections that overwrite previous assumptions.

If a lesson is not here, it will be rediscovered at cost.

---

## Entry Format

Each entry includes:
- **Date** — when it was recorded
- **Source** — mission, decision, or human instruction that produced it
- **Entry** — the durable fact or lesson
- **Status** — `active` / `superseded` / `voided`

---

## Memory Entries

### M-001
- **Date:** 2026-05-01
- **Source:** Infrastructure build — Oracle/Mia architecture definition
- **Entry:** Oracle is the operating system. Mia is the agent inside it. Mia does not float independently. She navigates a structured house. The three-ring structure (system truth → agent instruction → execution discipline) is the canonical architecture.
- **Status:** active

### M-002
- **Date:** 2026-05-01
- **Source:** Infrastructure build — Oracle/Mia architecture definition
- **Entry:** System files belong under `oracle/docs`. Agent files belong under `oracle/mia`. Mixing them creates confusion in structure, responsibility, and naming.
- **Status:** active

### M-003
- **Date:** 2026-05-01
- **Source:** Infrastructure build — Oracle/Mia architecture definition
- **Entry:** Mia's navigation order is fixed: vision → architecture → standards → backlog → relevant mission → relevant instruction → output via template → review via checklist → update memory if system changed. Deviation must be logged and justified.
- **Status:** active

### M-004
- **Date:** 2026-05-01
- **Source:** MIA-001 — State of Oracle Audit
- **Entry:** The repo contains two parallel sources of system truth: `canon/` (pre-Mia, 16 files) and `oracle/docs/` (current). These have never been reconciled. Until they are, any agent reading only one source has an incomplete picture. This is the highest structural risk in the system.
- **Status:** active

### M-005
- **Date:** 2026-05-01
- **Source:** MIA-001 — State of Oracle Audit (corrected 2026-05-01)
- **Entry:** `oracle/mia/reports/` is the canonical output folder for all Mia mission reports. Reports are named `YYYY-MM-DD-mission-name.md`. `oracle_workspace/` is actively used by `oracle_agent_api/main.py` as a draft/approve/reject staging area — it is not dead. The MIA-001 audit incorrectly assessed it as empty. It requires no remediation, only documentation.
- **Status:** active

### M-006
- **Date:** 2026-05-01
- **Source:** MIA-001 — State of Oracle Audit
- **Entry:** The Python operator agent (`agents/oracle_operator_agent.py`) reads from `canon/oracle_v5_canon.md`, not from `oracle/docs/`. Mia and the operator agent are currently two separate intelligence layers with no shared ground truth. Reconciling them is a future mission priority.
- **Status:** active

### M-007
- **Date:** 2026-05-01
- **Source:** MIA-001 — State of Oracle Audit
- **Entry:** No mission is done unless it leaves behind: an output file, a backlog update, a memory update if the system changed, and a named next action. This is Mia's rule of completion. It applies from 2026-05-01 forward.
- **Status:** active

---

## Adding to Memory

Only add an entry if the lesson:
1. Will remain relevant across future missions
2. Changes how Mia should behave in a non-trivial way
3. Corrects a previous assumption that was in active use

Format:

```
### M-[next number]
- **Date:** YYYY-MM-DD
- **Source:** [mission ID or description]
- **Entry:** [the durable fact or lesson, plainly stated]
- **Status:** active
```

---

*Last updated: 2026-05-01*
