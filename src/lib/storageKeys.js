export const STORAGE_KEYS = {
  archive: "ora-call-archive",
  inputHistory: "ora-call-input-history",
  controlPanelDrafts: "ora-call-cp-drafts",
  controlPanelLogs: "ora-call-cp-logs",
};

const LEGACY_STORAGE_KEYS = {
  archive: "oracle-v5-archive",
  inputHistory: "oracle-v5-input-history",
  controlPanelDrafts: "oracle-v5-cp-drafts",
  controlPanelLogs: "oracle-v5-cp-logs",
};

function migrateStorageKey(newKey, oldKey) {
  const currentValue = localStorage.getItem(newKey);
  if (currentValue !== null) return;

  const legacyValue = localStorage.getItem(oldKey);
  if (legacyValue === null) return;

  localStorage.setItem(newKey, legacyValue);
  localStorage.removeItem(oldKey);
}

export function migrateLegacyStorage() {
  try {
    migrateStorageKey(STORAGE_KEYS.archive, LEGACY_STORAGE_KEYS.archive);
    migrateStorageKey(STORAGE_KEYS.inputHistory, LEGACY_STORAGE_KEYS.inputHistory);
    migrateStorageKey(STORAGE_KEYS.controlPanelDrafts, LEGACY_STORAGE_KEYS.controlPanelDrafts);
    migrateStorageKey(STORAGE_KEYS.controlPanelLogs, LEGACY_STORAGE_KEYS.controlPanelLogs);
  } catch {
    // Silent fail when storage is unavailable.
  }
}
