// Archive — localStorage persistence with findRelated() memory scoring
// Scoring breakdown per candidate:
//   +2  intent match
//   +1  per shared signal (resale, build, creative, …)
//   +1  per shared keyword from normalised text, capped at +3
// Minimum threshold: score >= 3
// Returns single highest-scoring match, tie-broken by createdAt descending
// Cap: 100 objects (FIFO eviction)

const ARCHIVE_KEY = "oracle-v5-archive";
const ARCHIVE_CAP = 100;

// ── Input history ─────────────────────────────────────────────────────────────
// Persists last 10 raw input strings for quick re-submission.

const HISTORY_KEY = "oracle-v5-input-history";
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

function getKeywords(object) {
  const text = object.normalised ?? object.raw ?? "";
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);
}

function scoreMatch(candidate, subject, subjectSignals, subjectKeywords) {
  const intentMatch = candidate.classification?.intent === subject.classification?.intent;
  const candidateSignals = getActiveSignals(candidate.classification);

  const signalOverlap = candidateSignals.filter((s) => subjectSignals.has(s)).length;

  const candidateKeywords = getKeywords(candidate);
  const keywordOverlap = candidateKeywords.filter((k) => subjectKeywords.has(k)).length;

  return (intentMatch ? 2 : 0) + signalOverlap + Math.min(keywordOverlap, 3);
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

export function findRelated(object, archive = null) {
  const candidates = (archive ?? loadArchive()).filter((c) => c.id !== object.id);
  if (candidates.length === 0) return null;

  const subjectSignals = new Set(getActiveSignals(object.classification));
  const subjectKeywords = new Set(getKeywords(object));

  let best = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreMatch(candidate, object, subjectSignals, subjectKeywords);
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
