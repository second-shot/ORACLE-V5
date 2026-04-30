import { useMemo } from "react";
import { loadArchiveCounts } from "../lib/oracleArchive.js";

const LAYERS = ["live", "cold", "shadow", "market", "identity", "process"];

export function ArchiveAtlas({ objectCount }) {
  // Re-derive counts from localStorage whenever objectCount changes
  const counts = useMemo(() => loadArchiveCounts(), [objectCount]);

  const total = LAYERS.reduce((sum, l) => sum + counts[l], 0);
  if (total === 0) return null;

  return (
    <section className="archive-atlas" aria-label="Archive atlas">
      <span className="archive-atlas__label">Archive</span>
      <div className="archive-atlas__grid">
        {LAYERS.map((layer) => (
          <div key={layer} className="archive-atlas__cell">
            <span className="archive-atlas__layer">{layer}</span>
            <span className="archive-atlas__count">{counts[layer]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
