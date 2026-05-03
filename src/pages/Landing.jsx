import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="landing">
      <section className="landing-hero" aria-label="Introduction">
        <p className="landing-eyebrow">V5 · Active</p>
        <h1 className="landing-heading">
          Oracle is the system.<br />
          <em>Mia</em> is the operator.
        </h1>
        <p className="landing-sub">
          A living framework for standards, missions, memory, and coherent growth.
          Not a tool. An operating environment.
        </p>
        <div className="landing-actions">
          <Link to="/run" className="landing-btn landing-btn--primary">
            Enter Oracle
          </Link>
          <Link to="/home" className="landing-btn landing-btn--ghost">
            Living Home
          </Link>
        </div>
        <p className="landing-ground">
          Oracle turns raw input into structured actions, proposals, and archived decisions.
        </p>
      </section>
    </main>
  );
}
