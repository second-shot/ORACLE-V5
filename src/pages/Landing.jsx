import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  function proceed(e) {
    e.preventDefault();
    const seed = input.trim();
    if (!seed) return;
    navigate("/run", { state: { seed }, unstable_viewTransition: true });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      proceed(e);
    }
  }

  return (
    <main className="entry">
      <div className="entry-orb" aria-hidden="true" />
      <form className="entry-form" onSubmit={proceed}>
        <label htmlFor="entry-input" className="sr-only">
          What are we initiating?
        </label>
        <textarea
          id="entry-input"
          ref={textareaRef}
          className="entry-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What are we initiating?"
          rows={1}
          autoFocus
        />
        <button
          type="submit"
          className="entry-proceed"
          disabled={!input.trim()}
          aria-label="Proceed"
        >
          →
        </button>
      </form>
    </main>
  );
}
