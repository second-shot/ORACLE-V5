import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SurfaceCard } from "../components/SurfaceCard.jsx";
import { InputHistory } from "../components/InputHistory.jsx";
import { runOraclePipeline } from "../lib/oracleEngine.js";
import {
  findRelated,
  loadInputHistory,
  pushInputHistory,
} from "../lib/oracleArchive.js";

export default function Run() {
  const [input, setInput] = useState("");
  const [objects, setObjects] = useState([]);
  const [history, setHistory] = useState(() => loadInputHistory());
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill input with seed passed from the Entry screen, then clear it from
  // navigation state so a back/forward visit doesn't re-populate stale text.
  useEffect(() => {
    const seed = location.state?.seed;
    if (seed) {
      setInput(seed);
      navigate("/run", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const submitInput = useCallback((raw) => {
    if (!raw) return;
    const { object, archiveWriter } = runOraclePipeline(raw);
    const match = findRelated(object);
    const enriched = { ...object, memoryMatch: match };
    archiveWriter(enriched);
    setObjects((prev) => [enriched, ...prev]);
    setHistory((prev) => pushInputHistory(raw, prev));
  }, []);

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

  function handleFileRead(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (text && text.trim()) {
        submitInput(text.trim());
      }
    };
    reader.readAsText(file);
  }

  function handleFileChange(e) {
    handleFileRead(e.target.files?.[0]);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFileRead(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  function goToOutput(id) {
    navigate(`/output/${id}`);
  }

  return (
    <main className="oracle-shell">
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

        {/* File upload */}
        <div
          className={`run-drop-zone${dragOver ? " run-drop-zone--active" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          aria-label="File drop zone"
        >
          <span className="run-drop-zone__label">
            Drop a .txt file, or{" "}
            <button
              type="button"
              className="run-drop-zone__browse"
              onClick={() => fileInputRef.current?.click()}
            >
              browse
            </button>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            className="sr-only"
            aria-label="Upload text file"
            onChange={handleFileChange}
          />
        </div>

        <InputHistory history={history} onSelect={submitInput} />
      </section>

      <section
        className="oracle-output-zone"
        aria-live="polite"
        aria-label="Oracle outputs"
      >
        <AnimatePresence>
          {objects.map((obj) => (
            <div key={obj.id} className="run-output-item">
              <SurfaceCard object={obj} />
              <button
                className="run-permalink"
                onClick={() => goToOutput(obj.id)}
                aria-label={`Open output ${obj.id}`}
              >
                Open ↗
              </button>
            </div>
          ))}
        </AnimatePresence>
      </section>
    </main>
  );
}
