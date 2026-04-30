import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PricingOutput } from "./PricingOutput.jsx";

function formatPipelineTrace(log) {
  if (!log || log.length === 0) return "—";
  return log.map((entry) => entry.status).join(" → ");
}

function formatSignals(classification) {
  if (!classification?.signals) return "—";
  const s = classification.signals;
  const active = [];
  if (s.resale) active.push("resale");
  if (s.build) active.push("build");
  if (s.creative) active.push("creative");
  if (s.planning) active.push("planning");
  if (s.overwhelmed) active.push("urgency");
  if (s.hasQuestion) active.push("question");
  if (s.lowClarity) active.push("low-clarity");
  return active.length > 0 ? active.join(" · ") : "none detected";
}

function ScorePip({ label, value }) {
  return (
    <span className="score-pip">
      <span className="score-pip__label">{label}</span>
      <span className="score-pip__value">{value ?? "—"}</span>
    </span>
  );
}

export function SurfaceCard({ object }) {
  const [open, setOpen] = useState(false);

  if (!object?.output) return null;

  const { output, classification, score, route, pipelineLog } = object;
  const intent = classification?.intent ?? "—";
  const routeState = route?.routeState ?? "—";
  const archiveLayer = route?.archiveLayer ?? "—";
  const routeReason = route?.reasoning ?? "—";

  const routeLabel = `${routeState.charAt(0).toUpperCase() + routeState.slice(1)} · ${intent.charAt(0).toUpperCase() + intent.slice(1)}`;

  return (
    <motion.article
      className="surface-card"
      initial={false}
      layout
    >
      {/* ── Collapsed layer (always visible) ── */}
      <div className="surface-card__body">
        <p className="surface-card__title">{output.diagnosis}</p>

        <div className="surface-card__decision">
          <span className="surface-card__route-label">{routeLabel}</span>

          {output.kind === "oracle-pricing" ? (
            <PricingOutput output={output} />
          ) : (
            <p className="surface-card__action">{output.nextAction}</p>
          )}
        </div>
      </div>

      {/* ── Inspector toggle ── */}
      <button
        className="surface-card__inspect-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`inspector-${object.id}`}
      >
        Inspect {open ? "⌃" : "⌄"}
      </button>

      {/* ── Expanded inspector ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id={`inspector-${object.id}`}
            className="surface-card__inspector"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inspector__inner">
              <div className="inspector__meta">
                <span className="inspector__field">
                  <span className="inspector__key">Intent</span>
                  <span className="inspector__val">{intent}</span>
                </span>
                <span className="inspector__field">
                  <span className="inspector__key">Route</span>
                  <span className="inspector__val">{routeState}</span>
                </span>
                <span className="inspector__field">
                  <span className="inspector__key">Archive</span>
                  <span className="inspector__val">{archiveLayer}</span>
                </span>
              </div>

              <div className="inspector__section">
                <span className="inspector__section-label">Scores</span>
                <div className="inspector__scores">
                  <ScorePip label="Urgency" value={score?.urgency} />
                  <ScorePip label="Value" value={score?.value} />
                  <ScorePip label="Effort" value={score?.effort} />
                  <ScorePip label="Clarity" value={score?.clarity} />
                </div>
              </div>

              <div className="inspector__section">
                <span className="inspector__section-label">Signals</span>
                <p className="inspector__text">{formatSignals(classification)}</p>
              </div>

              <div className="inspector__section">
                <span className="inspector__section-label">Route reason</span>
                <p className="inspector__text">{routeReason}</p>
              </div>

              <div className="inspector__section">
                <span className="inspector__section-label">Pipeline</span>
                <p className="inspector__text inspector__text--trace">
                  {formatPipelineTrace(pipelineLog)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
