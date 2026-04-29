import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function InputHistory({ history, onSelect }) {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="input-history">
      <button
        className="input-history__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="input-history-list"
      >
        <span className="input-history__toggle-label">
          Recent {open ? "⌃" : "⌄"}
        </span>
        {!open && (
          <span className="input-history__peek">
            {history[0].length > 60
              ? history[0].slice(0, 60) + "…"
              : history[0]}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="input-history-list"
            className="input-history__list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {history.map((entry, i) => (
              <li key={i} className="input-history__item">
                <button
                  className="input-history__entry"
                  onClick={() => {
                    setOpen(false);
                    onSelect(entry);
                  }}
                  title={entry}
                >
                  {entry}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
