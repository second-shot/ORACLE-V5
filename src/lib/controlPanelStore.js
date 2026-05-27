import { STORAGE_KEYS } from "./storageKeys.js";

// ── Control Panel Store ──────────────────────────────────────────────────────
// Persists drafts and logs in localStorage.

const DRAFTS_KEY = STORAGE_KEYS.controlPanelDrafts;
const LOGS_KEY   = STORAGE_KEYS.controlPanelLogs;
const DRAFTS_CAP = 200;
const LOGS_CAP   = 500;

// ── Drafts ───────────────────────────────────────────────────────────────────

export function loadDrafts() {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts) {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, DRAFTS_CAP)));
  } catch {
    // Silent fail
  }
}

export function addDraft(task, oracleObject) {
  const draft = {
    id: crypto.randomUUID(),
    task,
    diagnosis: oracleObject.output?.diagnosis ?? task,
    nextAction: oracleObject.output?.nextAction ?? "",
    intent: oracleObject.classification?.intent ?? "—",
    routeState: oracleObject.route?.routeState ?? "—",
    pipelineLog: oracleObject.pipelineLog ?? [],
    status: "pending",
    createdAt: Date.now(),
    decidedAt: null,
  };
  const drafts = [draft, ...loadDrafts()];
  saveDrafts(drafts);
  return draft;
}

export function updateDraftStatus(id, status) {
  const drafts = loadDrafts().map((d) =>
    d.id === id ? { ...d, status, decidedAt: Date.now() } : d
  );
  saveDrafts(drafts);
  return drafts;
}

// ── Logs ─────────────────────────────────────────────────────────────────────

export function loadLogs() {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, LOGS_CAP)));
  } catch {
    // Silent fail
  }
}

export function appendLog(level, message, meta = {}) {
  const entry = {
    id: crypto.randomUUID(),
    level,   // "info" | "success" | "warn" | "error"
    message,
    meta,
    at: Date.now(),
  };
  const logs = [entry, ...loadLogs()];
  saveLogs(logs);
  return logs;
}

export function clearLogs() {
  try {
    localStorage.removeItem(LOGS_KEY);
  } catch {
    // Silent fail
  }
  return [];
}
