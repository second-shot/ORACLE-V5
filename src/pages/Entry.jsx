import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Entry() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate("/run", { state: { initial: trimmed } });
  }

  return (
    <main className="entry" aria-label="Entry state">
      <div className="entry__ambient entry__ambient--a" aria-hidden="true" />
      <div className="entry__ambient entry__ambient--b" aria-hidden="true" />

      <section className="entry__panel">
        <div className="entry__orb" aria-hidden="true" />
        <p className="entry__eyebrow">Oracle</p>
        <h1 className="entry__title">Enter the threshold.</h1>
        <p className="entry__copy">
          One input. One presence. Then straight into execution.
        </p>

        <form className="entry__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="entry-input">
            Oracle entry input
          </label>
          <input
            id="entry-input"
            className="entry__input"
            type="text"
            placeholder="What are we initiating?"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <button className="entry__cta" type="submit" disabled={!value.trim()}>
            Proceed
          </button>
        </form>
      </section>
    </main>
  );
}
