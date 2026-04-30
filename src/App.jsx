import { useState, useRef, useEffect } from "react";
import { MemoryStack } from "./components/MemoryStack.jsx";
import { InputHistory } from "./components/InputHistory.jsx";
import { runOraclePipeline } from "./lib/oracleEngine.js";
import {
  storeInArchive,
  findRelated,
  loadInputHistory,
  pushInputHistory,
} from "./lib/oracleArchive.js";

export default function App() {
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
      </header>

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

      <section className="oracle-output-zone" aria-live="polite">
        <MemoryStack objects={objects} />
      </section>
    </main>
  );
}
