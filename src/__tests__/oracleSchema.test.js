import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  PIPELINE_STATES,
  INTENT_STATES,
  DECISION_STATES,
  ROUTE_STATES,
  ARCHIVE_LAYERS,
  createBaseObject,
} from "../lib/oracleSchema.js";

describe("oracleSchema constants", () => {
  it("PIPELINE_STATES has expected values in order", () => {
    expect(PIPELINE_STATES).toEqual([
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
    ]);
  });

  it("INTENT_STATES includes all expected intents", () => {
    expect(INTENT_STATES).toContain("build");
    expect(INTENT_STATES).toContain("resale");
    expect(INTENT_STATES).toContain("creative");
    expect(INTENT_STATES).toContain("planning");
    expect(INTENT_STATES).toContain("question");
    expect(INTENT_STATES).toContain("unclear");
  });

  it("DECISION_STATES includes all expected states", () => {
    expect(DECISION_STATES).toEqual(["clarify", "suggest", "execute", "hold"]);
  });

  it("ROUTE_STATES includes all expected states", () => {
    expect(ROUTE_STATES).toContain("idle");
    expect(ROUTE_STATES).toContain("pricing");
    expect(ROUTE_STATES).toContain("execute");
    expect(ROUTE_STATES).toContain("clarify");
  });

  it("ARCHIVE_LAYERS includes all expected layers", () => {
    expect(ARCHIVE_LAYERS).toEqual(["live", "cold", "shadow", "market", "identity", "process"]);
  });
});

describe("createBaseObject", () => {
  beforeEach(() => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid-1234");
  });

  it("returns an object with the provided raw input", () => {
    const obj = createBaseObject("hello world");
    expect(obj.raw).toBe("hello world");
  });

  it("assigns a unique id via crypto.randomUUID", () => {
    const obj = createBaseObject("test");
    expect(obj.id).toBe("test-uuid-1234");
  });

  it("sets initial status to 'captured'", () => {
    const obj = createBaseObject("test");
    expect(obj.status).toBe("captured");
  });

  it("sets initial type to 'input'", () => {
    const obj = createBaseObject("test");
    expect(obj.type).toBe("input");
  });

  it("sets owner to 'oracle-user'", () => {
    const obj = createBaseObject("test");
    expect(obj.owner).toBe("oracle-user");
  });

  it("sets default archiveLayer to 'live'", () => {
    const obj = createBaseObject("test");
    expect(obj.archiveLayer).toBe("live");
  });

  it("sets default routeState to 'intake'", () => {
    const obj = createBaseObject("test");
    expect(obj.routeState).toBe("intake");
  });

  it("initialises linkedObjects and notes as empty arrays", () => {
    const obj = createBaseObject("test");
    expect(obj.linkedObjects).toEqual([]);
    expect(obj.notes).toEqual([]);
  });

  it("initialises pipelineLog and routeLog as empty arrays", () => {
    const obj = createBaseObject("test");
    expect(obj.pipelineLog).toEqual([]);
    expect(obj.routeLog).toEqual([]);
  });

  it("sets nullable fields to null", () => {
    const obj = createBaseObject("test");
    expect(obj.normalised).toBeNull();
    expect(obj.compressed).toBeNull();
    expect(obj.classification).toBeNull();
    expect(obj.score).toBeNull();
    expect(obj.route).toBeNull();
    expect(obj.output).toBeNull();
  });

  it("sets createdAt and updatedAt to the current time", () => {
    const before = Date.now();
    const obj = createBaseObject("test");
    const after = Date.now();
    expect(obj.createdAt).toBeGreaterThanOrEqual(before);
    expect(obj.createdAt).toBeLessThanOrEqual(after);
    expect(obj.updatedAt).toBeGreaterThanOrEqual(before);
    expect(obj.updatedAt).toBeLessThanOrEqual(after);
  });
});
