# ORACLE V5 — Master Canon

> Consolidated from all Space canon files. Last updated: April 2026.
> This document is the single source of truth for ORACLE V5 architecture, design, and build decisions.

---

## 1. Identity

**ORACLE V5** is a computer-first cognitive, creative, archival, and commercial operating system for artists, creators, resellers, curators, and operators.

**Core function:** Take raw multimodal input — thoughts, works, media, inventory, ideas, files, references, projects, and opportunities — and convert it into structured objects, score them, route them through the correct workflow, generate useful outputs, preserve them as layered memory, and surface them again in the right context.

**Core loop:**
```
capture → normalise → compress → classify → score → route → generate → validate → store → surface
```

### Non-Negotiables

- Do not reduce Oracle to a chatbot
- Do not turn it into generic SaaS dashboard language
- Do not invent fake features or fake certainty
- Do not flatten artistic nuance
- Do not create decorative UI without real function
- Do not drift away from architecture discipline
- Always separate canon from speculation
- Prefer portable architecture over platform lock-in
- Optimise for clarity, continuity, execution, memory, archive quality, pricing realism, and finished outputs

---

## 2. Core Architecture

**Layers:**

| Layer | Role |
|---|---|
| Frontend shell | Command surface, living home, decision board, archive atlas, artist pod, operator console, proposal studio |
| Backend | Object model, routing engine, scoring logic, state management |
| Archive layer | Six-layer memory system with retrieval, linking, and resurfacing |
| Pricing engine | Route-specific pricing with scoring factors and output logic |
| Agent orchestration | Bounded specialist agents with logs, limits, and approval gates |

**Architecture principles:**
- Portable over platform-locked
- Object model is universal — domain paths are modular overlays
- Every action leaves a log
- Every important output is inspectable
- High-value or irreversible actions require explicit approval

---

## 3. Universal Object Model

Every input becomes a structured object. Core object types:

- **Artist** — identity profile, domain path, archive, commercial history
- **Work** — medium, dimensions, year, series, status, archive layer
- **Draft** — unfinished work linked to process archive
- **Project** — grouped works or actions with a shared objective
- **Listing** — sale-ready object with route, price, and status
- **Proposal** — structured output for collector, gallery, client, or platform
- **Memory** — stored context linked to works, ideas, or events
- **Opportunity** — inbound or outbound commercial signal
- **Agent** — bounded specialist with defined role, limits, and log
- **Archive item** — any object stored in a named archive layer
- **Route state** — current position of an object in the routing pipeline

**Universal schema fields (all objects):**
- `id` — unique identifier
- `type` — object type
- `status` — current state
- `created_at` — timestamp
- `updated_at` — timestamp
- `owner` — artist or operator
- `archive_layer` — which layer it belongs to
- `route_state` — where it sits in the pipeline
- `linked_objects` — related works, projects, agents, proposals
- `notes` — freeform context

---

## 4. Routing Engine

Objects move through the core loop in defined states. No object skips a stage without an explicit override.

**Pipeline states:**
1. `captured` — raw input received, not yet processed
2. `normalised` — input cleaned and structured
3. `compressed` — redundant data removed, core signal extracted
4. `classified` — object type and domain assigned
5. `scored` — value, urgency, and route potential calculated
6. `routed` — assigned to the correct workflow path
7. `generating` — output being produced
8. `validated` — output reviewed and approved
9. `stored` — written to the correct archive layer
10. `surfaced` — resurfaced in a future relevant context

**Routing rules:**
- Every object has one active route state at any time
- Routing decisions are logged with reasoning
- Manual overrides are permitted but flagged
- Objects can be re-routed if context changes

---

## 5. UI System

**Core surfaces:**

| Surface | Purpose |
|---|---|
| Command surface | Primary input layer — capture, route, action |
| Living home | Current state of all active objects and priorities |
| Decision board | Pending actions, ranked by urgency and value |
| Archive atlas | Navigable view of all archive layers |
| Artist pod | Domain-specific workspace per artist identity |
| Operator console | Multi-artist or multi-project management view |
| Proposal studio | Build and output proposals, listings, and packages |

**UI rules:**
- Every panel has a real function — no decorative surfaces
- States are explicit and visible
- Modes change function, not just appearance
- Emotional tone is calm, precise, and purposeful — not gamified
- Each artist sees the same structure with domain-appropriate labels, priority panels, and default routes

---

## 6. Artist Modular Paths

One core system. Different domain layers. No separate products.

**Shared core for every artist:**
- Identity profile
- Work archive
- Project builder
- Pricing and market routing
- Proposal generation
- Bounded agents
- Archive resurfacing
- Commercial split logic

**Domain overlays:**

| Path | Domain-specific additions |
|---|---|
| Painter | Artwork cataloguing, series clustering, medium/dimensions/year, pricing ladder, collector and exhibition proposals, archive by era/palette/motif |
| Singer / Musician | Song archive, release grouping, sonic identity map, rollout plans, visual concept links, sync licensing and release proposals |
| Filmmaker / Director | Treatments, reference mapping, body-of-work archive, pitch decks, campaign and client packaging |
| Fashion stylist | Look archive, garment and styling system, editorial concepts, rental/resale/client packaging, aesthetic lineage |
| Designer / Visual artist | Asset classification, project grouping, edition/product/commission paths, proposal outputs |
| Hybrid artist | Combines modules without breaking the core object model — one artist can hold multiple mediums and routes |

**Constraint:** The modular path changes the workflow layer, not the soul of the system.

---

## 7. Pricing and Marketplace Routing

**Rule:** No fake universal price. Price is always route-specific.

**Core routes:**

| Route | Best use case |
|---|---|
| Vinted / Facebook Marketplace | Fast liquidity |
| Depop / Grailed / Vestiaire | Style premium |
| eBay | Broad market truth |
| Etsy | Crafted niche object |
| Shopify direct | Controlled brand margin |
| Private / collector-direct | High-touch work |
| Gallery / consignment | Prestige or long-hold strategy |
| Commission-only | Service-based engagement |
| Edition licensing | Reproducible work |

**Oracle scoring factors:**
- Realistic top price
- Realistic clearing price
- Speed to sale
- Fees
- Shipping burden
- Effort to prepare
- Audience fit
- Prestige fit
- Condition
- Demand signal
- Local vs global value
- Hold vs sell logic

**Required output for every pricing decision:**
- Recommended route
- Target price
- Floor price
- Reasoning
- Preparation needed
- Action recommendation: sell now / hold / enrich / bundle / relist / consign / convert into larger project

**Constraint:** Highest price is not always best outcome. Oracle optimises for real return, not fantasy value.

---

## 8. Agent System

**Rule:** Agents are tools, not gods. They assist, propose, rank, draft, and route. They do not act with hidden autonomy.

**Core agents:**

| Agent | Role |
|---|---|
| Archive Agent | Organise, classify, link, and surface archive objects |
| Identity Agent | Maintain and update artist identity profile |
| Pricing Agent | Score objects, recommend routes, return pricing outputs |
| Listing Agent | Draft and prepare sale listings |
| Project Agent | Group objects, track progress, flag stalled projects |
| Proposal Agent | Build structured proposals for collectors, clients, galleries |
| Release Agent | Plan and sequence release rollouts |
| Research Agent | Surface external signals, market data, references |
| Outreach Agent | Draft and manage external communications |
| Operator Agent | Multi-artist or multi-project orchestration |

**What agents can do:**
- Organise and classify
- Compare and rank
- Draft and propose next actions
- Ask for missing information
- Generate structured outputs

**What agents cannot do:**
- Perform hidden high-risk actions
- Overwrite canon without approval
- Silently change commercial terms
- Execute irreversible actions without review
- Invent false certainty

**Required rules:**
- Every agent has one clear role
- Every agent has defined limits
- Every agent leaves logs
- Every important output is inspectable
- High-value or irreversible actions require approval

**Agent output format:**
- Recommendation
- Reasoning
- Missing information
- Next step

---

## 9. Archive and Memory Layers

**Rule:** The archive is not a graveyard. Memory is not a transcript dump.

**Six archive layers:**

| Layer | Contents |
|---|---|
| Live Archive | Active material with current relevance |
| Cold Archive | Older material kept for record, context, and future reference |
| Shadow Archive | Forgotten, unfinished, or undervalued material with possible future value |
| Market Archive | Works, objects, and projects that are sale-ready or commercially usable |
| Identity Archive | Key works and materials that define the artist or operator |
| Process Archive | Sketches, drafts, references, experiments, and work-in-progress context |

**Memory functions:**
- Store structured objects
- Link related works and ideas
- Resurface similar material
- Detect hidden value
- Prevent repeated thinking
- Preserve evolution over time

**Example resurfacing queries:**
- Show similar works
- Show dormant ideas linked to this project
- Show unfinished work that fits this context
- Show pieces with market potential
- Show references matching this tone

**Constraint:** Archive must support retrieval, routing, and future action — not just storage.

---

## 10. Commercial Splits and Revenue

**Rule:** Every commercial action must be traceable. No vague split logic. No hidden fee logic.

**Core split structure:**
- Artist percentage
- Operator percentage
- Service/platform percentage
- Collaborator percentage
- Project-specific override
- Royalty/edition logic where relevant

**Every commercial object stores:**
- Linked work or project
- Route source
- Gross price
- Fees
- Net amount
- Split ratios
- Payout amounts
- Payout status
- Payment received status
- Date
- Notes

**Core sale types:**

| Type | Fee tier |
|---|---|
| Direct sale | Low — self-managed utility flow |
| Assisted sale | Medium — light support involved |
| Managed sale | Higher — full-service packaging and sales support |
| Commission work | Project-specific negotiated deal |
| Consignment | Gallery or platform holds and sells |
| Edition royalty sale | Recurring payout per edition sold |
| Project packaging fee | One-time fee for scoping and building a project package |

**Oracle output for every commercial action:**
- Recommended split structure
- Expected payout per party
- Fee impact
- Payment and payout status
- Linked commercial history

**Constraint:** Commercial logic must be simple, explicit, and auditable.

---

## 11. First Real Build Slice

**Purpose:** Prove the system is real.

**Success condition:**
> A user can enter raw material, see it become a structured object, watch it route into the correct path, and receive one usable output.

**Build first:**
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

## 12. Fake Depth — What to Avoid

**Fake depth looks like:**
- A beautiful UI with no real routing
- Chat-first design pretending to be a system
- Too many panels with no decision logic
- Random agents without clear roles
- Archive as dead storage
- Pricing without route logic
- Broad features with no object model
- Too many modes that do not change function
- Automation without review
- Fake memory based on transcript piles

**Real depth looks like:**
- Strong object model
- Clear routing logic
- Real state transitions
- Inspectable outputs
- Archive that resurfaces value
- Commercial logic tied to real routes
- Modular artist paths on one shared core
- Bounded agents with logs and limits

**Rule:** If a feature does not strengthen structure, routing, memory, pricing, or finished outputs — it is fake depth.

---

## 13. Computer Mode Task Rules

Only run Computer mode tasks after canon and roadmap are approved.

**Rules:**
- One task — one output — one success condition
- No broad invention
- No vague planning

**Approved first tasks (post-canon):**
1. Turn the approved roadmap into a structured implementation plan: phase / objective / modules / dependencies / risks / done condition
2. Create a comparison memo: Electron vs Tauri vs web app local companion — focused only on Oracle's needs
3. Turn the approved object model into a schema outline for all core types
4. Turn the UI canon into a screen map: surface name / purpose / key interactions / required states
5. Turn the pricing canon into a route matrix: marketplace / audience / speed / price potential / fees / effort / best use case

**Constraint:** Computer mode executes an already-approved slice — it does not define the product.

---

## 14. Canon Management Rules

- The Space files, pinned answers, and thread structure hold the real spine
- Do not use memory or vague personalisation as the canon store
- Always separate canon from speculation
- Label all assumptions
- Preserve continuity with prior Oracle canon in every thread
- One thread per pillar — do not mix architecture, pricing, and agent logic in one thread

---

*End of ORACLE V5 Master Canon — April 2026*
