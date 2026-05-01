# Oracle Architecture

## Purpose
This document defines how Oracle is structured and where Mia fits inside it.

*Last audited: 2026-05-01 via MIA-001*

---

## System Model

Oracle is the operating system.
Mia is the active agent working inside Oracle.

Oracle holds:
- vision
- standards
- workflows
- system memory
- backlog
- architecture

Mia holds:
- identity
- role
- operating rules
- mission execution
- agent memory
- reports
- prompt logic
- review checklists

---

## Directory Logic

### `/oracle/docs`
System-level documentation.
Anything that defines the platform, standards, or long-term structure belongs here.

### `/oracle/mia`
Agent-level documentation.
Anything that defines how Mia thinks, acts, reports, reviews, and remembers belongs here.

### `/oracle/mia/reports`
Mia's real output folder. Every completed mission produces a dated report file here.
Format: `YYYY-MM-DD-mission-name.md`
This is where proof of work lives.

---

## Full Repo Map (as of 2026-05-01)

The repo contains more than just oracle/. This is the complete picture:

| Path | Layer | Status |
|------|-------|--------|
| `oracle/docs/` | System truth | Active |
| `oracle/mia/` | Agent instruction + execution | Active |
| `canon/` | Pre-Mia system canon | Unreconciled — audit pending (MIA-002) |
| `agents/oracle_operator_agent.py` | Python operator agent | Active but reads canon/, not oracle/ |
| `agent-room/` | Operator agent logs and status | Active but disconnected from Mia |
| `src/` | Vite/React frontend | Active — Oracle UI layer |
| `oracle_agent_api/` | FastAPI backend stub | Minimal — no oracle/ routes yet |
| `oracle_workspace/` | Output staging folders | Empty — no workflow writes to them |
| `.github/` | Repo governance | Partial — labeler exists, no ISSUE_TEMPLATE or CODEOWNERS |

---

## Decision Flow

1. A need, gap, or idea appears.
2. It is logged as a task, mission, or decision candidate in `oracle/docs/backlog.md`.
3. Mia evaluates scope and impact using `oracle/mia/system.md`.
4. If local and low-impact, Mia may act within rules.
5. If structural or high-impact, Mia escalates and a decision is logged using `oracle/mia/decision-template.md`.
6. Oracle memory is updated when a meaningful change lands.
7. Mission output is written to `oracle/mia/reports/`.

---

## Ownership Boundaries

Oracle owns the system.
Mia owns execution support, clarity, continuity, and visible progress.

The Python operator agent (`agents/oracle_operator_agent.py`) is a separate execution layer. It is not Mia. It reads from `canon/` and logs to `agent-room/`. Reconciling these two agent layers is a future mission.

---

## Known Gaps (from MIA-001)

1. `canon/` and `oracle/docs/` are parallel sources of truth — not yet reconciled
2. No GitHub ISSUE_TEMPLATE, pull_request_template, or CODEOWNERS
3. `oracle_workspace/` is structurally present but operationally dead
4. The operator agent is not wired to oracle/ docs
5. `labeler.yml` has no `oracle` or `mia` label

---

## Change Rule
If work changes standards, structure, or long-term behavior, it must be recorded in Oracle memory.

---

## Current Objective
Make Oracle governable, not just legible. The structure exists. The next step is wiring it to real workflow: GitHub governance, mission tracking, and output that accumulates in one place.

---

*Last updated: 2026-05-01*
