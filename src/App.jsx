import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SurfaceCard } from "./components/SurfaceCard.jsx";
import { InputHistory } from "./components/InputHistory.jsx";
import { ControlPanel } from "./components/ControlPanel.jsx";
import { runOraclePipeline } from "./lib/oracleEngine.js";
import {
  storeInArchive,
  findRelated,
  loadInputHistory,
  pushInputHistory,
} from "./lib/oracleArchive.js";

export default function App() {
  const [view, setView] = useState("oracle"); // "oracle" | "panel"
  const [input, setInput] = useState("");
  const [objects, setObjects] = useState([]);
  const [history, setHistory] = useState(() => loadInputHistory());
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  function submitInput(raw) {
    if (!raw) return;

    const { object, archiveWriter } = runOraclePipeline(raw);

    // Attach memory match from archive before storing
    const match = findRelated(object);
    const enriched = { ...object, memoryMatch: match };

    archiveWriter(enriched);
    setObjects((prev) => [enriched, ...prev]);
    setHistory((prev) => pushInputHistory(raw, prev));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    submitInput(raw);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <main className="oracle-shell">
      <header className="oracle-header">
        <span className="oracle-wordmark">ORACLE</span>
        <span className="oracle-version">V5</span>
        <nav className="oracle-nav" aria-label="View switcher">
          <button
            className={`oracle-nav__btn ${view === "oracle" ? "oracle-nav__btn--active" : ""}`}
            onClick={() => setView("oracle")}
            aria-current={view === "oracle" ? "page" : undefined}
          >
            Oracle
          </button>
          <button
            className={`oracle-nav__btn ${view === "panel" ? "oracle-nav__btn--active" : ""}`}
            onClick={() => setView("panel")}
            aria-current={view === "panel" ? "page" : undefined}
          >
            Control Panel
          </button>
        </nav>
      </header>

      {view === "panel" && <ControlPanel />}

      {view === "oracle" && (
        <>
          <section className="oracle-input-zone">
            <form onSubmit={handleSubmit} className="oracle-form">
              <label htmlFor="oracle-input" className="sr-only">
                Enter raw input
              </label>
              <textarea
                id="oracle-input"
                ref={textareaRef}
                className="oracle-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter raw input…"
                rows={1}
                autoFocus
              />
              <button
                type="submit"
                className="oracle-submit"
                disabled={!input.trim()}
                aria-label="Run Oracle"
              >
                Run
              </button>
            </form>
            <InputHistory history={history} onSelect={submitInput} />
          </section>

          <section className="oracle-output-zone" aria-live="polite" aria-label="Oracle outputs">
            <AnimatePresence>
              {objects.map((obj) => (
                <SurfaceCard key={obj.id} object={obj} />
              ))}
            </AnimatePresence>
          </section>
        </>
      )}
    </main>
  );
}
