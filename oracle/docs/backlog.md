# Oracle Backlog

## Purpose
The live register of what matters now, what is next, and what is parked. Every item has a status, an owner, and a reason for being here. Mia reads this during mission observation to understand where the pressure is.

---

## Status Key

| Status | Meaning |
|--------|---------|
| `active` | Being worked now |
| `next` | Queued for immediate action after current work |
| `parked` | Valid but not being pursued now |
| `blocked` | Waiting on a named dependency |
| `done` | Complete |
| `archived` | No longer relevant — reason recorded |

---

## Active

| ID | Item | Owner | Since |
|----|------|-------|-------|
| B-005 | MIA-002 — Standards Coverage Audit | Mia | 2026-05-01 |
| B-006 | MIA-003 — Support Structure Audit | Mia | 2026-05-01 |
| B-007 | MIA-005 — First Strategic Report | Mia | 2026-05-01 |

---

## Next

| ID | Item | Notes |
|----|------|-------|
| B-008 | Reconcile canon/ with oracle/docs/ | Identified as top risk in MIA-001. Assign to MIA-002. |
| B-009 | Wire oracle_agent_api/ to oracle/ docs | API has no routes exposing oracle layer yet |
| B-010 | Decide fate of oracle_workspace/ | Either wire it to a real workflow or deprecate it with a logged decision |

---

## Parked

| ID | Item | Reason | Since |
|----|------|--------|-------|
| — | — | — | — |

---

## Blocked

| ID | Item | Blocking Dependency | Since |
|----|------|---------------------|-------|
| — | — | — | — |

---

## Done

| ID | Item | Outcome | Closed |
|----|------|---------|--------|
| B-001 | Build Oracle/Mia file infrastructure | Completed. oracle/ and oracle/mia/ fully built and pushed. | 2026-05-01 |
| B-002 | MIA-001 — State of Oracle Audit | Completed. Report at oracle/mia/reports/2026-05-01-state-of-oracle.md | 2026-05-01 |
| B-003 | MIA-002 — queue for activation | Activated as B-005 | 2026-05-01 |
| B-004 | MIA-005 — queue for activation | Activated as B-007 | 2026-05-01 |

---

*Last updated: 2026-05-01*
