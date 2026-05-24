import { STORAGE_KEYS } from "./storageKeys.js";

// Archive — localStorage persistence with findRelated() memory scoring
// V2.1 spec: memory_score = (intent match → +2) + (per signal overlap → +1)
// Minimum threshold: memory_score >= 3
// Returns single highest-scoring match, tie-broken by createdAt descending
// Cap: 100 objects (FIFO eviction)

const ARCHIVE_KEY = STORAGE_KEYS.archive;
const ARCHIVE_CAP = 100;

// ── Input history ─────────────────────────────────────────────────────────────
// Persists last 10 raw input strings for quick re-submission.

const HISTORY_KEY = STORAGE_KEYS.inputHistory;
const HISTORY_CAP = 10;

export function loadInputHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushInputHistory(rawInput, current) {
  // Deduplicate: remove any existing identical entry, then prepend
  const filtered = current.filter((h) => h !== rawInput);
  const updated = [rawInput, ...filtered].slice(0, HISTORY_CAP);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Silent fail — storage unavailable
  }
  return updated;
}

function loadArchive() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveArchive(objects) {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(objects));
  } catch {
    // localStorage quota exceeded — evict oldest and retry
    const trimmed = objects.slice(0, ARCHIVE_CAP - 10);
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(trimmed));
    } catch {
      // Silent fail — archive unavailable
    }
  }
}

export function storeInArchive(object) {
  const archive = loadArchive();
  const updated = [object, ...archive].slice(0, ARCHIVE_CAP);
  saveArchive(updated);
  return object;
}

function getActiveSignals(classification) {
  if (!classification?.signals) return [];
  const s = classification.signals;
  const active = [];
  if (s.resale) active.push("resale");
  if (s.build) active.push("build");
  if (s.creative) active.push("creative");
  if (s.planning) active.push("planning");
  if (s.overwhelmed) active.push("urgency");
  if (s.hasQuestion) active.push("question");
  if (s.fastSale) active.push("fast-sale");
  return active;
}

function scoreMatch(candidate, subject) {
  const intentMatch = candidate.classification?.intent === subject.classification?.intent;
  const candidateSignals = getActiveSignals(candidate.classification);
  const subjectSignals = getActiveSignals(subject.classification);

  const signalOverlap = candidateSignals.filter((s) =>
    subjectSignals.includes(s)
  ).length;

  return (intentMatch ? 2 : 0) + signalOverlap;
}

function buildMatchLabel(candidate, subject) {
  const intentMatch = candidate.classification?.intent === subject.classification?.intent;
  const candidateSignals = getActiveSignals(candidate.classification);
  const subjectSignals = getActiveSignals(subject.classification);
  const overlapping = candidateSignals.filter((s) => subjectSignals.includes(s));

  const relationLabel = intentMatch ? "Similar intent" : "Signal overlap";
  const intent = candidate.classification?.intent ?? "unknown";
  const dominant = overlapping[0] ?? intent;

  return `${relationLabel}: ${intent} / ${dominant}`;
}

export function findRelated(object) {
  const archive = loadArchive();

  // Exclude the object itself (just stored)
  const candidates = archive.filter((c) => c.id !== object.id);
  if (candidates.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreMatch(candidate, object);
    if (
      score > bestScore ||
      (score === bestScore &&
        best &&
        candidate.createdAt > best.createdAt)
    ) {
      bestScore = score;
      best = candidate;
    }
  }

  // Minimum threshold: score >= 3
  if (!best || bestScore < 3) return null;

  return {
    objectId: best.id,
    score: bestScore,
    label: buildMatchLabel(best, object),
  };
}
