import { describe, it, expect, beforeEach, vi } from "vitest";
import { runOraclePipeline } from "../lib/oracleEngine.js";

// ── localStorage stub (oracleArchive uses it) ─────────────────────────────────

beforeEach(() => {
  let store = {};
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: vi.fn((key) => store[key] ?? null),
      setItem: vi.fn((key, value) => { store[key] = value; }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
    },
    writable: true,
    configurable: true,
  });
});

// ── runOraclePipeline ─────────────────────────────────────────────────────────

describe("runOraclePipeline", () => {
  it("returns an object and an archiveWriter function", () => {
    const result = runOraclePipeline("I want to sell my bike today");
    expect(result).toHaveProperty("object");
    expect(typeof result.archiveWriter).toBe("function");
  });

  it("object has a unique id string", () => {
    const { object } = runOraclePipeline("sell my laptop now");
    expect(typeof object.id).toBe("string");
    expect(object.id.length).toBeGreaterThan(0);
  });

  it("preserves the raw input on the object", () => {
    const raw = "I need to sell my jewellery this week";
    const { object } = runOraclePipeline(raw);
    expect(object.raw).toBe(raw);
  });

  it("normalises whitespace in the input", () => {
    const { object } = runOraclePipeline("  sell  my  bike  ");
    expect(object.normalised).toBe("sell my bike");
  });

  it("sets final status to 'surfaced'", () => {
    const { object } = runOraclePipeline("I need to sell my bike today");
    expect(object.status).toBe("surfaced");
  });

  it("pipeline log contains all 10 stages", () => {
    const { object } = runOraclePipeline("I need to sell my bike today");
    const statuses = object.pipelineLog.map((e) => e.status);
    expect(statuses).toContain("captured");
    expect(statuses).toContain("normalised");
    expect(statuses).toContain("compressed");
    expect(statuses).toContain("classified");
    expect(statuses).toContain("scored");
    expect(statuses).toContain("routed");
    expect(statuses).toContain("generating");
    expect(statuses).toContain("validated");
    expect(statuses).toContain("stored");
    expect(statuses).toContain("surfaced");
  });

  it("classification is populated with intent and signals", () => {
    const { object } = runOraclePipeline("I need to sell my bike now asap");
    expect(object.classification).not.toBeNull();
    expect(object.classification.intent).toBe("resale");
    expect(object.classification.signals).toBeDefined();
  });

  it("score has all four dimensions within [1, 5]", () => {
    const { object } = runOraclePipeline("I need to sell my old mountain bike fast today");
    const { urgency, value, effort, clarity } = object.score;
    for (const v of [urgency, value, effort, clarity]) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it("route has routeState, archiveLayer, and reasoning", () => {
    const { object } = runOraclePipeline("I need to sell my bike fast today");
    expect(object.route).toHaveProperty("routeState");
    expect(object.route).toHaveProperty("archiveLayer");
    expect(object.route).toHaveProperty("reasoning");
  });

  it("output is not null after the pipeline", () => {
    const { object } = runOraclePipeline("I need to sell my bike today");
    expect(object.output).not.toBeNull();
  });

  it("produces oracle-pricing output for high-urgency resale input", () => {
    const { object } = runOraclePipeline(
      "I need to sell my bike asap need it gone this week"
    );
    expect(object.output.kind).toBe("oracle-pricing");
  });

  it("produces oracle-decision output for a planning input", () => {
    const { object } = runOraclePipeline(
      "I need to plan and organise my tasks for the upcoming client launch"
    );
    expect(object.output.kind).toBe("oracle-decision");
  });

  it("produces oracle-decision with clarify route for vague input", () => {
    const { object } = runOraclePipeline("help");
    expect(object.route.routeState).toBe("clarify");
    expect(object.output.kind).toBe("oracle-decision");
  });

  it("routeLog contains at least one entry", () => {
    const { object } = runOraclePipeline("I need to build a system for client proposals");
    expect(object.routeLog.length).toBeGreaterThan(0);
    expect(object.routeLog[0]).toHaveProperty("routeState");
  });

  it("two pipeline runs produce different ids", () => {
    const { object: a } = runOraclePipeline("sell my bike today");
    const { object: b } = runOraclePipeline("sell my bike today");
    expect(a.id).not.toBe(b.id);
  });

  it("archiveWriter is the storeInArchive function (callable)", () => {
    const { archiveWriter, object } = runOraclePipeline("I want to sell my phone");
    expect(() => archiveWriter(object)).not.toThrow();
  });
});
