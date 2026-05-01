import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { runOraclePipeline } from "../lib/oracleEngine.js";
import {
  loadDrafts,
  addDraft,
  updateDraftStatus,
  loadLogs,
  appendLog,
  clearLogs,
} from "../lib/controlPanelStore.js";

const TABS = ["task", "drafts", "logs"];

function timestamp(ms) {
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LogLevelBadge({ level }) {
  return <span className={`cp-log__level cp-log__level--${level}`}>{level}</span>;
}

function DraftCard({ draft, onDecide }) {
  const [open, setOpen] = useState(false);
  const isPending = draft.status === "pending";

  return (
    <motion.article
      className={`cp-draft cp-draft--${draft.status}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cp-draft__header">
        <span className="cp-draft__task">{draft.task}</span>
        <span className={`cp-draft__status cp-draft__status--${draft.status}`}>
          {draft.status}
        </span>
      </div>

      <p className="cp-draft__diagnosis">{draft.diagnosis}</p>

      {draft.nextAction ? (
        <p className="cp-draft__action">{draft.nextAction}</p>
      ) : null}

      <div className="cp-draft__meta">
        <span className="cp-draft__meta-badge">{draft.intent}</span>
        <span className="cp-draft__meta-badge">{draft.routeState}</span>
        <span className="cp-draft__meta-time">{timestamp(draft.createdAt)}</span>
      </div>

      {isPending && (
        <div className="cp-draft__actions">
          <button
            className="cp-btn cp-btn--approve"
            onClick={() => onDecide(draft.id, "approved")}
          >
            Approve
          </button>
          <button
            className="cp-btn cp-btn--reject"
            onClick={() => onDecide(draft.id, "rejected")}
          >
            Reject
          </button>
        </div>
      )}

      <button
        className="cp-draft__inspect-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Pipeline {open ? "⌃" : "⌄"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="cp-draft__pipeline"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="cp-draft__pipeline-trace">
              {draft.pipelineLog.map((e) => e.status).join(" → ")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export function ControlPanel() {
  const [activeTab, setActiveTab] = useState("task");
  const [task, setTask] = useState("");
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState(() => loadDrafts());
  const [logs, setLogs] = useState(() => loadLogs());
  const [filterStatus, setFilterStatus] = useState("all");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [task]);

  const log = useCallback((level, message, meta) => {
    setLogs(appendLog(level, message, meta));
  }, []);

  function handleGenerate(e) {
    e.preventDefault();
    const raw = task.trim();
    if (!raw || generating) return;

    setGenerating(true);
    log("info", `Generating draft for: "${raw}"`);

    try {
      const { object } = runOraclePipeline(raw);
      const draft = addDraft(raw, object);
      setDrafts(loadDrafts());
      log("success", `Draft created`, { draftId: draft.id, intent: draft.intent });
      setTask("");
      setActiveTab("drafts");
    } catch (err) {
      log("error", `Draft generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  function handleDecide(id, status) {
    const updated = updateDraftStatus(id, status);
    setDrafts(updated);
    const draft = updated.find((d) => d.id === id);
    log(status === "approved" ? "success" : "warn", `Draft ${status}`, {
      draftId: id,
      task: draft?.task,
    });
  }

  function handleClearLogs() {
    setLogs(clearLogs());
  }

  const pendingCount = drafts.filter((d) => d.status === "pending").length;

  const visibleDrafts =
    filterStatus === "all"
      ? drafts
      : drafts.filter((d) => d.status === filterStatus);

  return (
    <section className="cp-shell">
      {/* ── Tabs ── */}
      <nav className="cp-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`cp-tab ${activeTab === tab ? "cp-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "drafts" ? (
              <>
                Drafts
                {pendingCount > 0 && (
                  <span className="cp-tab__badge">{pendingCount}</span>
                )}
              </>
            ) : (
              tab.charAt(0).toUpperCase() + tab.slice(1)
            )}
          </button>
        ))}
      </nav>

      {/* ── Task tab ── */}
      {activeTab === "task" && (
        <div className="cp-pane" role="tabpanel">
          <p className="cp-pane__label">New Task</p>
          <form onSubmit={handleGenerate} className="cp-form">
            <label htmlFor="cp-task-input" className="sr-only">
              Describe your task
            </label>
            <textarea
              id="cp-task-input"
              ref={textareaRef}
              className="oracle-textarea"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate(e);
                }
              }}
              placeholder="Describe a task to generate a draft…"
              rows={3}
              autoFocus
            />
            <button
              type="submit"
              className="cp-btn cp-btn--primary"
              disabled={!task.trim() || generating}
            >
              {generating ? "Generating…" : "Generate Draft"}
            </button>
          </form>
        </div>
      )}

      {/* ── Drafts tab ── */}
      {activeTab === "drafts" && (
        <div className="cp-pane" role="tabpanel">
          <div className="cp-pane__toolbar">
            <p className="cp-pane__label">
              Drafts
              {pendingCount > 0 && (
                <span className="cp-pane__count"> — {pendingCount} pending</span>
              )}
            </p>
            <div className="cp-filter">
              {["all", "pending", "approved", "rejected"].map((s) => (
                <button
                  key={s}
                  className={`cp-filter__btn ${filterStatus === s ? "cp-filter__btn--active" : ""}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {visibleDrafts.length === 0 ? (
            <p className="cp-empty">
              {filterStatus === "all"
                ? "No drafts yet. Go to Task to generate one."
                : `No ${filterStatus} drafts.`}
            </p>
          ) : (
            <div className="cp-draft-list">
              <AnimatePresence>
                {visibleDrafts.map((d) => (
                  <DraftCard key={d.id} draft={d} onDecide={handleDecide} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── Logs tab ── */}
      {activeTab === "logs" && (
        <div className="cp-pane" role="tabpanel">
          <div className="cp-pane__toolbar">
            <p className="cp-pane__label">Logs</p>
            {logs.length > 0 && (
              <button className="cp-btn cp-btn--ghost" onClick={handleClearLogs}>
                Clear
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <p className="cp-empty">No log entries yet.</p>
          ) : (
            <ol className="cp-log-list" aria-label="Activity log">
              {logs.map((entry) => (
                <li key={entry.id} className="cp-log">
                  <LogLevelBadge level={entry.level} />
                  <span className="cp-log__msg">{entry.message}</span>
                  <span className="cp-log__time">{timestamp(entry.at)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
