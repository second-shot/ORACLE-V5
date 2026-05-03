import { Link } from "react-router-dom";

const MISSIONS = [
  {
    id: "MIA-001",
    title: "State of Oracle Audit",
    desc: "First live mission. Read every file in the repo. Mapped what exists, what is missing, what is weak, and what is inconsistent. Named the top three priorities.",
    status: "done",
    completedAt: "2026-05-01",
    output: "oracle/mia/reports/2026-05-01-state-of-oracle.md",
    priority: null,
  },
  {
    id: "MIA-002",
    title: "Standards Coverage Audit",
    desc: "Verify which standards exist and which are still unwritten. Map all 16 canon/ files against oracle/docs/ — classify as superseded, migrate, or archive.",
    status: "active",
    priority: "P1",
    output: "oracle/mia/reports/",
  },
  {
    id: "MIA-003",
    title: "Support Structure Audit",
    desc: "Identify missing templates, automations, and process files. Assess the relationship between oracle_workspace/ and oracle/mia/reports/.",
    status: "active",
    priority: "P1",
    output: "oracle/mia/reports/",
  },
  {
    id: "MIA-004",
    title: "Strengthen Oracle Memory",
    desc: "Make sure meaningful decisions are captured consistently across oracle/docs/memory.md and oracle/mia/memory.md.",
    status: "backlog",
    priority: "P2",
    output: null,
  },
  {
    id: "MIA-005",
    title: "First Strategic Report",
    desc: "Give Oracle a leadership-level state-of-system report based on findings from MIA-001, MIA-002, and MIA-003.",
    status: "active",
    priority: "P1",
    output: "oracle/mia/reports/",
  },
  {
    id: "MIA-006",
    title: "Reconcile Operator Agent with Oracle Layer",
    desc: "Map the relationship between agents/oracle_operator_agent.py and Mia. Two agent layers with no shared ground truth. Propose a path to convergence.",
    status: "backlog",
    priority: "P2",
    output: "decision document",
  },
  {
    id: "MIA-007",
    title: "Define Oracle Website Front Door",
    desc: "Landing page, upload input, command surface, living home, one clear routed output. Unified React entry point replacing the split frontend.",
    status: "active",
    priority: "P1",
    output: "src/ (React app)",
  },
];

const STATUS_ORDER = { active: 0, backlog: 1, done: 2 };

function statusLabel(status) {
  if (status === "active") return "Active";
  if (status === "backlog") return "Backlog";
  if (status === "done") return "Done";
  return status;
}

export default function Missions() {
  const active = MISSIONS.filter((m) => m.status === "active");
  const backlog = MISSIONS.filter((m) => m.status === "backlog");
  const done = MISSIONS.filter((m) => m.status === "done");

  return (
    <main className="missions-shell">
      <section className="missions-hero" aria-label="Missions overview">
        <p className="home-eyebrow">Live Work</p>
        <h1 className="home-heading">Missions</h1>
        <p className="home-sub">
          Every mission has a purpose, an output, and a definition of done.
          Nothing is complete without all four: output, backlog update, memory
          update, named next action.
        </p>
      </section>

      {/* Stats */}
      <section className="home-stats" aria-label="Mission counts">
        <div className="home-stat">
          <span className="home-stat__value">{active.length}</span>
          <span className="home-stat__label">Active</span>
        </div>
        <div className="home-stat">
          <span className="home-stat__value">{backlog.length}</span>
          <span className="home-stat__label">Backlog</span>
        </div>
        <div className="home-stat">
          <span className="home-stat__value">{done.length}</span>
          <span className="home-stat__label">Done</span>
        </div>
        <div className="home-stat">
          <span className="home-stat__value">{MISSIONS.length}</span>
          <span className="home-stat__label">Total</span>
        </div>
      </section>

      {/* Grouped mission rows */}
      {[
        { label: "Active", items: active },
        { label: "Backlog", items: backlog },
        { label: "Done", items: done },
      ].map(({ label, items }) =>
        items.length === 0 ? null : (
          <section key={label} className="missions-group">
            <h2 className="missions-group__title">{label}</h2>
            <ul className="missions-list" role="list">
              {items.map((m) => (
                <li key={m.id} className={`missions-row missions-row--${m.status}`}>
                  <span className="missions-row__id">{m.id}</span>
                  <div className="missions-row__body">
                    <span className="missions-row__title">{m.title}</span>
                    <p className="missions-row__desc">{m.desc}</p>
                    <div className="missions-row__meta">
                      <span className={`missions-badge missions-badge--${m.status}`}>
                        {statusLabel(m.status)}
                        {m.completedAt ? ` · ${m.completedAt}` : ""}
                      </span>
                      {m.priority && (
                        <span className="missions-meta-note">{m.priority}</span>
                      )}
                      {m.output && (
                        <span className="missions-meta-note">
                          Output: {m.output}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      )}
    </main>
  );
}
