import { useMemo } from "react";
import { Link } from "react-router-dom";

const ARCHIVE_KEY = "oracle-v5-archive";

const STATIC_MISSIONS = [
  { id: "MIA-001", title: "State of Oracle Audit", status: "done" },
  { id: "MIA-002", title: "Standards Coverage Audit", status: "active" },
  { id: "MIA-003", title: "Support Structure Audit", status: "active" },
  { id: "MIA-004", title: "Strengthen Oracle Memory", status: "backlog" },
  { id: "MIA-005", title: "First Strategic Report", status: "active" },
  { id: "MIA-006", title: "Reconcile Operator Agent", status: "backlog" },
];

function loadArchiveObjects() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatRelTime(ms) {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function Home() {
  const archive = useMemo(() => loadArchiveObjects(), []);
  const recent = archive.slice(0, 5);
  const activeMissions = STATIC_MISSIONS.filter((m) => m.status === "active");

  return (
    <main className="home-shell">
      <section className="home-hero" aria-label="System status">
        <p className="home-eyebrow">Living Home</p>
        <h1 className="home-heading">Oracle</h1>
        <p className="home-sub">Current system state, active missions, recent outputs.</p>
      </section>

      {/* Stats */}
      <section className="home-stats" aria-label="System stats">
        <div className="home-stat">
          <span className="home-stat__value">{archive.length}</span>
          <span className="home-stat__label">Archived objects</span>
        </div>
        <div className="home-stat">
          <span className="home-stat__value">{activeMissions.length}</span>
          <span className="home-stat__label">Active missions</span>
        </div>
        <div className="home-stat">
          <span className="home-stat__value">
            {STATIC_MISSIONS.filter((m) => m.status === "done").length}
          </span>
          <span className="home-stat__label">Completed</span>
        </div>
      </section>

      {/* Active missions */}
      <section className="home-section" aria-label="Active missions">
        <h2 className="home-section__title">Active Missions</h2>
        {activeMissions.length === 0 ? (
          <p className="home-empty">No active missions.</p>
        ) : (
          <ul className="home-mission-list" role="list">
            {activeMissions.map((m) => (
              <li key={m.id} className="home-mission-item">
                <span className="home-mission-id">{m.id}</span>
                <span className="home-mission-title">{m.title}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/missions" className="home-link">
          All missions →
        </Link>
      </section>

      {/* Recent outputs */}
      <section className="home-section" aria-label="Recent outputs">
        <h2 className="home-section__title">Recent Outputs</h2>
        {recent.length === 0 ? (
          <p className="home-empty">
            No outputs yet.{" "}
            <Link to="/run" className="home-link">
              Run Oracle →
            </Link>
          </p>
        ) : (
          <ul className="home-output-list" role="list">
            {recent.map((obj) => (
              <li key={obj.id} className="home-output-item">
                <Link to={`/output/${obj.id}`} className="home-output-link">
                  <span className="home-output-text">
                    {obj.output?.diagnosis ?? obj.raw?.slice(0, 80) ?? obj.id}
                  </span>
                  <span className="home-output-time">
                    {formatRelTime(obj.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {recent.length > 0 && (
          <Link to="/run" className="home-link">
            New input →
          </Link>
        )}
      </section>
    </main>
  );
}
