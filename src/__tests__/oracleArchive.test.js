import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { storeInArchive, findRelated } from "../lib/oracleArchive.js";

// ── localStorage mock ─────────────────────────────────────────────────────────

function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _getStore: () => store,
  };
}

let localStorageMock;

beforeEach(() => {
  localStorageMock = makeLocalStorageMock();
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── helpers ───────────────────────────────────────────────────────────────────

function makeArchiveObject(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    classification: {
      intent: "resale",
      signals: {
        resale: true,
        build: false,
        creative: false,
        planning: false,
        overwhelmed: false,
        hasQuestion: false,
        fastSale: false,
      },
    },
    ...overrides,
  };
}

// ── storeInArchive ────────────────────────────────────────────────────────────

describe("storeInArchive", () => {
  it("stores the object and returns it", () => {
    const obj = makeArchiveObject();
    const result = storeInArchive(obj);
    expect(result).toEqual(obj);
  });

  it("persists to localStorage", () => {
    const obj = makeArchiveObject();
    storeInArchive(obj);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("prepends new object to the archive (newest first)", () => {
    const first = makeArchiveObject({ id: "first" });
    storeInArchive(first);

    const second = makeArchiveObject({ id: "second" });
    storeInArchive(second);

    const stored = JSON.parse(localStorageMock._getStore()["oracle-v5-archive"]);
    expect(stored[0].id).toBe("second");
    expect(stored[1].id).toBe("first");
  });

  it("returns the object even when localStorage.setItem throws", () => {
    localStorageMock.setItem.mockImplementation(() => { throw new Error("quota"); });
    const obj = makeArchiveObject();
    const result = storeInArchive(obj);
    expect(result).toEqual(obj);
  });

  it("evicts oldest entries beyond the 100-object cap", () => {
    // Pre-fill archive with 100 objects
    const existing = Array.from({ length: 100 }, (_, i) =>
      makeArchiveObject({ id: `old-${i}`, createdAt: i })
    );
    localStorageMock.setItem("oracle-v5-archive", JSON.stringify(existing));
    localStorageMock.getItem.mockImplementation(
      (key) => localStorageMock._getStore()[key] ?? null
    );

    const newObj = makeArchiveObject({ id: "new" });
    storeInArchive(newObj);

    const stored = JSON.parse(localStorageMock._getStore()["oracle-v5-archive"]);
    expect(stored.length).toBeLessThanOrEqual(100);
    expect(stored[0].id).toBe("new");
  });

  it("handles corrupt localStorage JSON gracefully", () => {
    localStorageMock.getItem.mockReturnValue("not-valid-json");
    const obj = makeArchiveObject();
    expect(() => storeInArchive(obj)).not.toThrow();
  });
});

// ── findRelated ───────────────────────────────────────────────────────────────

describe("findRelated", () => {
  it("returns null when the archive is empty", () => {
    const subject = makeArchiveObject();
    expect(findRelated(subject)).toBeNull();
  });

  it("returns null when the only candidate is the subject itself", () => {
    const obj = makeArchiveObject({ id: "same-id" });
    localStorageMock.getItem.mockReturnValue(JSON.stringify([obj]));
    expect(findRelated(obj)).toBeNull();
  });

  it("returns null when the best score is below threshold (< 3)", () => {
    // Candidate has different intent and no signal overlap → score 0
    const candidate = makeArchiveObject({
      id: "c1",
      classification: {
        intent: "build",
        signals: { resale: false, build: true, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false },
      },
    });
    localStorageMock.getItem.mockReturnValue(JSON.stringify([candidate]));

    const subject = makeArchiveObject({
      id: "s1",
      classification: {
        intent: "creative",
        signals: { resale: false, build: false, creative: true, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false },
      },
    });
    expect(findRelated(subject)).toBeNull();
  });

  it("returns a match when intent matches (+2) and signals overlap (+1) giving score 3", () => {
    const candidate = makeArchiveObject({
      id: "c1",
      classification: {
        intent: "resale",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false },
      },
    });
    localStorageMock.getItem.mockReturnValue(JSON.stringify([candidate]));

    const subject = makeArchiveObject({
      id: "s1",
      classification: {
        intent: "resale",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false },
      },
    });
    const result = findRelated(subject);
    expect(result).not.toBeNull();
    expect(result.objectId).toBe("c1");
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("returns the highest-scoring candidate", () => {
    const lowMatch = makeArchiveObject({
      id: "low",
      classification: {
        intent: "resale",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false },
      },
    });
    const highMatch = makeArchiveObject({
      id: "high",
      classification: {
        intent: "resale",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: true, hasQuestion: false, fastSale: true },
      },
    });
    localStorageMock.getItem.mockReturnValue(JSON.stringify([lowMatch, highMatch]));

    const subject = makeArchiveObject({
      id: "s1",
      classification: {
        intent: "resale",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: true, hasQuestion: false, fastSale: true },
      },
    });
    const result = findRelated(subject);
    expect(result.objectId).toBe("high");
  });

  it("tie-breaks by newest createdAt when scores are equal", () => {
    const older = makeArchiveObject({
      id: "older",
      createdAt: 1000,
      classification: {
        intent: "resale",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false },
      },
    });
    const newer = makeArchiveObject({
      id: "newer",
      createdAt: 2000,
      classification: {
        intent: "resale",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false },
      },
    });
    localStorageMock.getItem.mockReturnValue(JSON.stringify([older, newer]));

    const subject = makeArchiveObject({
      id: "s1",
      classification: {
        intent: "resale",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false },
      },
    });
    const result = findRelated(subject);
    expect(result.objectId).toBe("newer");
  });

  it("returns match with objectId, score, and label", () => {
    const candidate = makeArchiveObject({ id: "c1" });
    localStorageMock.getItem.mockReturnValue(JSON.stringify([candidate]));

    const subject = makeArchiveObject({ id: "s1" });
    const result = findRelated(subject);
    expect(result).toHaveProperty("objectId");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("label");
  });

  it("label contains intent information", () => {
    const candidate = makeArchiveObject({ id: "c1" });
    localStorageMock.getItem.mockReturnValue(JSON.stringify([candidate]));

    const subject = makeArchiveObject({ id: "s1" });
    const result = findRelated(subject);
    expect(result.label).toContain("resale");
  });

  it("handles corrupt archive JSON in findRelated gracefully", () => {
    localStorageMock.getItem.mockReturnValue("not-valid-json");
    const subject = makeArchiveObject({ id: "s1" });
    expect(() => findRelated(subject)).not.toThrow();
    expect(findRelated(subject)).toBeNull();
  });
});
