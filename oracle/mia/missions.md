# Mia Missions

## Mission Format
Each mission must include:
- name
- purpose
- priority
- status
- owner
- output
- definition of done

---

## Active

## MIA-002 — Standards Coverage Audit
- Priority: P1
- Status: active
- Owner: Mia
- Purpose: verify which standards exist and which are still unwritten; reconcile `canon/` with `oracle/docs/`
- Output: audit note in `oracle/mia/reports/`
- Definition of done:
  - standards coverage reviewed against oracle/docs/standards.md
  - canon/ files mapped — superseded, migrate, or archive
  - gaps listed
  - recommendations proposed

## MIA-003 — Support Structure Audit
- Priority: P1
- Status: active
- Owner: Mia
- Purpose: identify missing templates, automations, and process files; assess oracle_workspace/ fate
- Output: report in `oracle/mia/reports/`
- Definition of done:
  - missing support files listed
  - oracle_workspace/ decision logged
  - weak points documented
  - next actions proposed

## MIA-005 — First Strategic Report
- Priority: P1
- Status: active
- Owner: Mia
- Purpose: give Oracle a leadership-level state-of-system report based on MIA-001, MIA-002, and MIA-003 findings
- Output: report in `oracle/mia/reports/`
- Definition of done:
  - current state summarized
  - top gaps named
  - risks listed with likelihood and impact
  - top 3 next actions proposed

---

## Backlog

## MIA-004 — Strengthen Oracle Memory
- Priority: P2
- Status: backlog
- Owner: Mia
- Purpose: make sure meaningful decisions are captured consistently across oracle/docs/memory.md and oracle/mia/memory.md
- Output: updated memory files
- Definition of done:
  - key decisions logged
  - lessons recorded
  - memory format used consistently

## MIA-006 — Reconcile Operator Agent with Oracle Layer
- Priority: P2
- Status: backlog
- Owner: Mia
- Purpose: map the relationship between `agents/oracle_operator_agent.py` (reads canon/) and Mia (reads oracle/docs/). Propose a shared ground truth.
- Output: decision document using decision-template.md
- Definition of done:
  - both agent layers described
  - conflict points named
  - path to shared ground truth proposed
  - decision logged

## MIA-007 — Decide Fate of oracle_workspace/
- Priority: P2
- Status: backlog
- Owner: Mia
- Purpose: the four workspace folders (approved, drafts, logs, rejected) exist but nothing writes to them. Either wire them to a real workflow or formally deprecate them.
- Output: logged decision using decision-template.md
- Definition of done:
  - current state documented
  - options evaluated
  - decision made and logged
  - backlog updated

---

## Done

## MIA-001 — State of Oracle Audit
- Priority: P1
- Status: done
- Owner: Mia
- Completed: 2026-05-01
- Output: `oracle/mia/reports/2026-05-01-state-of-oracle.md`
- Checklist passed: ✓
- Memory updated: ✓ (oracle/docs/memory.md M-004 through M-007, oracle/mia/memory.md)
- Backlog updated: ✓
- Next action named: ✓ (Activate MIA-002, MIA-003, MIA-005 — GitHub support layer)
