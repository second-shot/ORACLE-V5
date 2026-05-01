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
