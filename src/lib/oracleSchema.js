export const PIPELINE_STATES = [
  "captured",
  "normalised",
  "compressed",
  "classified",
  "scored",
  "routed",
  "generating",
  "validated",
  "stored",
  "surfaced",
];

export const INTENT_STATES = [
  "build",
  "resale",
  "creative",
  "planning",
  "question",
  "unclear",
];

export const DECISION_STATES = ["clarify", "suggest", "execute", "hold"];

export const ROUTE_STATES = [
  "idle",
  "intake",
  "pricing",
  "proposal",
  "archive",
  "memory",
  "clarify",
  "suggest",
  "execute",
  "hold",
];

export const ARCHIVE_LAYERS = [
  "live",
  "cold",
  "shadow",
  "market",
  "identity",
  "process",
];

export function createBaseObject(rawInput) {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    type: "input",
    status: "captured",
    createdAt: now,
    updatedAt: now,
    owner: "oracle-user",
    archiveLayer: "live",
    routeState: "intake",
    linkedObjects: [],
    notes: [],
    raw: rawInput,
    normalised: null,
    compressed: null,
    classification: null,
    score: null,
    route: null,
    output: null,
    pipelineLog: [],
    routeLog: [],
  };
}
