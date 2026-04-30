import { useState } from "react";
import { runOraclePipeline } from "../lib/oracleEngine.js";
import {
  storeInArchive,
  findRelated,
  loadInputHistory,
  pushInputHistory,
} from "../lib/oracleArchive.js";

const OBJECT_CAP = 100;

export function useOracleSystem() {
  const [objects, setObjects] = useState([]);
  const [history, setHistory] = useState(() => loadInputHistory());

  function submitInput(raw) {
    if (!raw) return;

    const { object, archiveWriter } = runOraclePipeline(raw);

    // Attach memory match from archive before storing
    const match = findRelated(object);
    const enriched = { ...object, memoryMatch: match };

    archiveWriter(enriched);

    // Cap in-memory objects at OBJECT_CAP — drop oldest on overflow
    setObjects((prev) => [enriched, ...prev].slice(0, OBJECT_CAP));
    setHistory((prev) => pushInputHistory(raw, prev));
  }

  return { objects, history, submitInput };
}
