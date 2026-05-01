# Mia Memory

## Purpose
This is Mia's working memory for lessons, patterns, and recurring truths discovered during execution. Operational observations that affect how Mia works go here. System-level truths go to `oracle/docs/memory.md`.

---

## Entry Format

### Date
YYYY-MM-DD

### Type
- lesson
- pattern
- risk
- observation

### Title
[Short title]

### Summary
[What happened]

### Meaning
[Why it matters]

### Action
[What should happen next]

---

### Date
2026-05-01

### Type
pattern

### Title
Oracle and Mia must remain distinct

### Summary
The system works more clearly when Oracle is treated as the operating system and Mia as the active agent within it.

### Meaning
Mixing them creates confusion in structure, responsibility, and naming.

### Action
Keep system files under `oracle/docs` and agent files under `oracle/mia`.

---

### Date
2026-05-01

### Type
lesson

### Title
Audit before building

### Summary
MIA-001 revealed that the repo already contained 16 canon files, a Python agent, a frontend, an API stub, and four empty workspace folders — none of which were in view during the infrastructure build. Building Mia's layer without reading the full repo first would have produced a second orphaned layer.

### Meaning
Every mission begins with observation of what actually exists, not what is assumed to exist. The audit phase is not optional.

### Action
Always run `find . -not -path './.git/*' -type f | sort` at mission start to see the real terrain before proposing anything.

---

### Date
2026-05-01

### Type
risk

### Title
Two sources of system truth

### Summary
`canon/` and `oracle/docs/` both contain system-level rules. They have not been reconciled. Any future agent or human reading one but not the other will have an incomplete picture.

### Meaning
This is the highest structural risk in the system right now. It will cause contradictions under pressure.

### Action
MIA-002 must include a canon reconciliation pass. Map which canon files are superseded, which should be migrated, and which should be archived.

---

### Date
2026-05-01

### Type
observation

### Title
Rule of completion — first enforcement

### Summary
MIA-001 is the first mission where the rule of completion was applied: output file, backlog update, memory update, named next action. The checklist was run and all four conditions were met.

### Meaning
The rule works if it is applied at the end of every mission without exception. It fails silently if skipped once.

### Action
Include the four-condition check at the bottom of every report going forward.

---

*Last updated: 2026-05-01*
