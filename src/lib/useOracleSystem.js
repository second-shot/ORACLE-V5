import { useState, useEffect, useRef } from "react";
import { runOraclePipeline } from "./oracleEngine.js";
import { findRelated, loadArchive, saveObjects } from "./oracleArchive.js";

export function useOracleSystem() {
  // Read archive from localStorage on mount
  const [objects, setObjects] = useState(() => loadArchive());
  const isMounted = useRef(false);

  // Write objects to localStorage on every state change (skip initial mount)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    saveObjects(objects);
  }, [objects]);

  function addObject(raw) {
    if (!raw) return null;
    const { object } = runOraclePipeline(raw);
    const match = findRelated(object);
    const enriched = { ...object, memoryMatch: match };
    setObjects((prev) => [enriched, ...prev]);
    return enriched;
  }

  return { objects, addObject };
}
