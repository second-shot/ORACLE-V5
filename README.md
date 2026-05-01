# ORACLE V5

A computer-first cognitive, creative, archival, and commercial operating system for artists, creators, resellers, curators, and operators.

---

## What It Is

ORACLE V5 takes raw multimodal input — thoughts, works, media, inventory, ideas, files, references, projects, opportunities — and converts it into structured objects, scores them, routes them through the correct workflow, generates useful outputs, preserves them as layered memory, and surfaces them again in the right context.

**Core loop:**
```
capture → normalise → compress → classify → score → route → generate → validate → store → surface
```

**Core domains:**
- Artist identity
- Work archive
- Project generation
- Proposal building
- Pricing and marketplace routing
- Sales and split logic
- Modular artist-specific paths
- Bounded specialist agents
- Operator console
- Archive intelligence

---

## What It Is Not

- Not a chatbot
- Not a generic SaaS dashboard
- Not a note-taking app
- Not a social platform
- Not a CRM
- Not a tool that invents fake certainty or fake features
- Not a product with decorative UI and no routing logic

---

## Repo Purpose

This repository is the canonical build workspace for ORACLE V5.

It holds:
- `canon/` — all architecture, object model, routing, UI, pricing, agent, and archive canon
- `build/` — first build slice and implementation artefacts
- `README.md` — this file
- `oracle-v5-canon.md` — consolidated master canon document

Canon is the source of truth. Speculation is labelled. Nothing is invented.

---

## First Build Slice

The first version must prove the system is real. Success condition:

> A user can enter raw material, see it become a structured object, watch it route into the correct path, and receive one usable output.

**Build in Phase 1:**
1. Login and onboarding
2. Command surface
3. Object model
4. Compression, classification, score, and route
5. Living home
6. Archive skeleton
7. One pricing route output
8. One proposal or listing output

**Do not build yet:**
- Over-deep automation
- Unnecessary agent swarm logic
- Decorative complexity
- Multiple account types
- Broad integrations
- Fake intelligence layers

---

## Non-Negotiables

- Always separate canon from speculation
- Prefer portable architecture over platform lock-in
- Optimise for clarity, continuity, execution, memory, archive quality, pricing realism, and finished outputs
- If a feature does not strengthen structure, routing, memory, pricing, or finished outputs — it is fake depth

---

## Status

> April 2026 — Canon complete. First build slice defined. Initial commit.
> May 2026 — Operator Agent and Agent Room live.

---

## Agent Room — How to Run

### Run the Operator Agent

```bash
python3 agents/oracle_operator_agent.py
```

Type a command at the prompt. Type `exit` to quit.

### First command to test

```
Read ORACLE canon and return next build step
```

The agent will return:
- **Recommendation**
- **Reasoning**
- **Missing information**
- **Next step**

And write structured entries to `agent-room/agent_log.jsonl` and `agent-room/agent_status.json`.

### Open the dashboard

Serve the `agent-room/` directory locally:

```bash
cd agent-room
python3 -m http.server 8080
```

Then open: [http://localhost:8080/dashboard.html](http://localhost:8080/dashboard.html)

The dashboard reads `agent_status.json` and `agent_log.jsonl` every 5 seconds.
Run the agent in one terminal, watch the dashboard update in your browser.

### Files

| File | Purpose |
|---|---|
| `agents/oracle_operator_agent.py` | Bounded Operator Agent — run this |
| `agent-room/dashboard.html` | Live status surface — open in browser |
| `agent-room/agent_status.json` | Current agent state |
| `agent-room/agent_log.jsonl` | Append-only structured log |
| `canon/oracle_v5_canon.md` | Canon reference for this directory |
| `canon/agent_rules.md` | Agent rules reference |
