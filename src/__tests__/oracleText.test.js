import { describe, it, expect } from "vitest";
import {
  normaliseInput,
  compressInput,
  classifyInput,
  scoreInput,
  chooseRoute,
  buildOutput,
  buildPricingOutput,
} from "../lib/oracleText.js";

// ── normaliseInput ────────────────────────────────────────────────────────────

describe("normaliseInput", () => {
  it("collapses multiple spaces into one", () => {
    expect(normaliseInput("hello   world")).toBe("hello world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normaliseInput("  hello world  ")).toBe("hello world");
  });

  it("collapses newlines and tabs", () => {
    expect(normaliseInput("hello\n\t world")).toBe("hello world");
  });

  it("returns the same string when already normalised", () => {
    expect(normaliseInput("already clean")).toBe("already clean");
  });

  it("handles an empty string", () => {
    expect(normaliseInput("")).toBe("");
  });
});

// ── compressInput ─────────────────────────────────────────────────────────────

describe("compressInput", () => {
  it("returns text unchanged when <= 180 chars", () => {
    const text = "a".repeat(180);
    expect(compressInput(text)).toBe(text);
  });

  it("truncates text longer than 180 chars and appends '...'", () => {
    const text = "a".repeat(200);
    const result = compressInput(text);
    expect(result).toHaveLength(180);
    expect(result.endsWith("...")).toBe(true);
  });

  it("slices exactly at position 177 before appending '...'", () => {
    const text = "b".repeat(200);
    const result = compressInput(text);
    expect(result).toBe("b".repeat(177) + "...");
  });

  it("returns text unchanged when exactly 180 chars", () => {
    const text = "c".repeat(180);
    expect(compressInput(text)).toBe(text);
  });
});

// ── classifyInput ─────────────────────────────────────────────────────────────

describe("classifyInput", () => {
  it("classifies resale intent from 'sell'", () => {
    const result = classifyInput("I want to sell my bike");
    expect(result.intent).toBe("resale");
    expect(result.objectType).toBe("opportunity");
    expect(result.domain).toBe("market");
  });

  it("classifies build intent from 'build'", () => {
    const result = classifyInput("I need to build a system for tracking invoices");
    expect(result.intent).toBe("build");
    expect(result.objectType).toBe("project");
    expect(result.domain).toBe("project");
  });

  it("classifies creative intent from 'idea'", () => {
    const result = classifyInput("I have an idea for a brand concept");
    expect(result.intent).toBe("creative");
    expect(result.objectType).toBe("draft");
    expect(result.domain).toBe("creative");
  });

  it("classifies planning intent from 'plan'", () => {
    const result = classifyInput("I need to plan and organise my tasks for next week");
    expect(result.intent).toBe("planning");
    expect(result.objectType).toBe("project");
    expect(result.domain).toBe("operations");
  });

  it("classifies question intent from '?'", () => {
    const result = classifyInput("Should I use Vinted or eBay for selling clothes?");
    // 'sell' wins because resale signal also fires — resale > question
    expect(["resale", "question"]).toContain(result.intent);
  });

  it("classifies question from 'how' without resale context", () => {
    const result = classifyInput("How do I improve my morning routine every day");
    expect(result.intent).toBe("question");
    expect(result.objectType).toBe("memory");
    expect(result.domain).toBe("knowledge");
  });

  it("classifies unclear for ambiguous short input", () => {
    const result = classifyInput("help me");
    expect(result.intent).toBe("unclear");
    expect(result.objectType).toBe("input");
    expect(result.domain).toBe("intake");
  });

  it("resale wins over planning when both signals fire", () => {
    const result = classifyInput("I need to plan to sell all my clothes on Vinted");
    expect(result.intent).toBe("resale");
  });

  it("returns signals object", () => {
    const result = classifyInput("I need to sell my bike fast today");
    expect(result.signals).toBeDefined();
    expect(result.signals.resale).toBe(true);
    expect(result.signals.fastSale).toBe(true);
  });

  it("detects platform keywords as resale signals", () => {
    const result = classifyInput("I want to list something on Vinted this week");
    expect(result.intent).toBe("resale");
  });

  it("suppresses lowClarity for anchored item types even in short inputs", () => {
    const result = classifyInput("sell my bike");
    expect(result.signals.lowClarity).toBe(false);
  });

  it("flags lowClarity for very short vague input", () => {
    const result = classifyInput("not sure maybe");
    expect(result.signals.lowClarity).toBe(true);
  });

  it("classifies using jewellery keyword", () => {
    const result = classifyInput("I have some jewellery to sell");
    expect(result.intent).toBe("resale");
    expect(result.signals.lowClarity).toBe(false);
  });
});

// ── scoreInput ────────────────────────────────────────────────────────────────

describe("scoreInput", () => {
  it("returns all four score dimensions", () => {
    const classification = classifyInput("I need to sell my bike fast today asap");
    const score = scoreInput("I need to sell my bike fast today asap", classification);
    expect(score).toHaveProperty("urgency");
    expect(score).toHaveProperty("value");
    expect(score).toHaveProperty("effort");
    expect(score).toHaveProperty("clarity");
  });

  it("scores urgency high when overwhelmed + fast signals", () => {
    const text = "I am overwhelmed I need to sell everything asap today";
    const classification = classifyInput(text);
    const score = scoreInput(text, classification);
    expect(score.urgency).toBeGreaterThanOrEqual(4);
  });

  it("clamps all scores between 1 and 5", () => {
    const text = "sell";
    const classification = classifyInput(text);
    const score = scoreInput(text, classification);
    for (const key of ["urgency", "value", "effort", "clarity"]) {
      expect(score[key]).toBeGreaterThanOrEqual(1);
      expect(score[key]).toBeLessThanOrEqual(5);
    }
  });

  it("gives value 3+ for resale intent", () => {
    const text = "I want to sell my laptop today for cash";
    const classification = classifyInput(text);
    const score = scoreInput(text, classification);
    expect(score.value).toBeGreaterThanOrEqual(3);
  });

  it("gives value 3+ for build intent", () => {
    const text = "I need to build a system to manage my client proposals and launch soon";
    const classification = classifyInput(text);
    const score = scoreInput(text, classification);
    expect(score.value).toBeGreaterThanOrEqual(3);
  });

  it("increases effort score when 'photograph' is present", () => {
    const textWithPhoto = "I need to photograph and list my clothes on Vinted";
    const textWithout = "I need to list my clothes on Vinted";
    const cWith = classifyInput(textWithPhoto);
    const cWithout = classifyInput(textWithout);
    const sWith = scoreInput(textWithPhoto, cWith);
    const sWithout = scoreInput(textWithout, cWithout);
    expect(sWith.effort).toBeGreaterThanOrEqual(sWithout.effort);
  });

  it("gives higher clarity for longer inputs", () => {
    const short = "sell bike";
    const long = "I want to sell my old mountain bike it has been sitting in the garage for months";
    const cShort = classifyInput(short);
    const cLong = classifyInput(long);
    const sShort = scoreInput(short, cShort);
    const sLong = scoreInput(long, cLong);
    expect(sLong.clarity).toBeGreaterThan(sShort.clarity);
  });

  it("reduces clarity when lowClarity flag is set", () => {
    const vague = "help thoughts maybe";
    const clear = "I need to sell my jewellery and get it listed this week please help";
    const cVague = classifyInput(vague);
    const cClear = classifyInput(clear);
    const sVague = scoreInput(vague, cVague);
    const sClear = scoreInput(clear, cClear);
    expect(sVague.clarity).toBeLessThan(sClear.clarity);
  });
});

// ── chooseRoute ───────────────────────────────────────────────────────────────

describe("chooseRoute", () => {
  it("returns 'clarify' for unclear intent", () => {
    const classification = { intent: "unclear", signals: {} };
    const score = { urgency: 5, value: 5, clarity: 5 };
    const route = chooseRoute(classification, score);
    expect(route.routeState).toBe("clarify");
  });

  it("returns 'clarify' when clarity is <= 2", () => {
    const classification = { intent: "resale", signals: {} };
    const score = { urgency: 5, value: 5, clarity: 2 };
    const route = chooseRoute(classification, score);
    expect(route.routeState).toBe("clarify");
  });

  it("returns 'execute' when urgency + value >= 6 and clarity >= 3", () => {
    const classification = { intent: "resale", signals: {} };
    const score = { urgency: 3, value: 3, clarity: 4 };
    const route = chooseRoute(classification, score);
    expect(route.routeState).toBe("execute");
  });

  it("returns 'hold' when urgency + value <= 2", () => {
    const classification = { intent: "build", signals: {} };
    const score = { urgency: 1, value: 1, clarity: 4 };
    const route = chooseRoute(classification, score);
    expect(route.routeState).toBe("hold");
  });

  it("returns 'suggest' for mid-range urgency + value (3–5)", () => {
    const classification = { intent: "planning", signals: {} };
    const score = { urgency: 2, value: 2, clarity: 4 };
    const route = chooseRoute(classification, score);
    expect(route.routeState).toBe("suggest");
  });

  it("sets archiveLayer to 'market' for resale on execute", () => {
    const classification = { intent: "resale", signals: {} };
    const score = { urgency: 4, value: 4, clarity: 4 };
    const route = chooseRoute(classification, score);
    expect(route.archiveLayer).toBe("market");
  });

  it("sets archiveLayer to 'process' for non-resale execute", () => {
    const classification = { intent: "build", signals: {} };
    const score = { urgency: 4, value: 4, clarity: 4 };
    const route = chooseRoute(classification, score);
    expect(route.archiveLayer).toBe("process");
  });

  it("sets archiveLayer to 'shadow' for hold", () => {
    const classification = { intent: "creative", signals: {} };
    const score = { urgency: 1, value: 1, clarity: 4 };
    const route = chooseRoute(classification, score);
    expect(route.archiveLayer).toBe("shadow");
  });

  it("returns archiveLayer 'live' for clarify route", () => {
    const classification = { intent: "unclear", signals: {} };
    const score = { urgency: 3, value: 3, clarity: 3 };
    const route = chooseRoute(classification, score);
    expect(route.archiveLayer).toBe("live");
  });

  it("includes reasoning string in the result", () => {
    const classification = { intent: "resale", signals: {} };
    const score = { urgency: 3, value: 3, clarity: 4 };
    const route = chooseRoute(classification, score);
    expect(typeof route.reasoning).toBe("string");
    expect(route.reasoning.length).toBeGreaterThan(0);
  });
});

// ── buildOutput / buildPricingOutput ──────────────────────────────────────────

function makeObject(overrides = {}) {
  return {
    id: "test-id",
    raw: "I need to sell my bike fast this week",
    normalised: "I need to sell my bike fast this week",
    compressed: "I need to sell my bike fast this week",
    classification: {
      intent: "resale",
      objectType: "opportunity",
      domain: "market",
      signals: {
        resale: true,
        build: false,
        creative: false,
        planning: false,
        overwhelmed: false,
        hasQuestion: false,
        fastSale: true,
        lowClarity: false,
      },
    },
    score: { urgency: 4, value: 4, effort: 2, clarity: 4 },
    route: { routeState: "execute", archiveLayer: "market", reasoning: "execute reason" },
    output: null,
    pipelineLog: [],
    routeLog: [],
    ...overrides,
  };
}

describe("buildOutput", () => {
  it("returns oracle-pricing for resale + execute", () => {
    const obj = makeObject();
    const output = buildOutput(obj);
    expect(output.kind).toBe("oracle-pricing");
  });

  it("returns oracle-decision for non-resale intent", () => {
    const obj = makeObject({
      normalised: "I need to build a system for my clients this week",
      classification: {
        intent: "build",
        objectType: "project",
        domain: "project",
        signals: {
          resale: false, build: true, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false, lowClarity: false,
        },
      },
      route: { routeState: "execute", archiveLayer: "process", reasoning: "build execute" },
    });
    const output = buildOutput(obj);
    expect(output.kind).toBe("oracle-decision");
  });

  it("returns oracle-decision for resale + suggest (not execute)", () => {
    const obj = makeObject({
      route: { routeState: "suggest", archiveLayer: "market", reasoning: "suggest reason" },
    });
    const output = buildOutput(obj);
    expect(output.kind).toBe("oracle-decision");
  });

  it("oracle-decision output has required fields", () => {
    const obj = makeObject({
      route: { routeState: "clarify", archiveLayer: "live", reasoning: "clarify reason" },
    });
    const output = buildOutput(obj);
    expect(output).toHaveProperty("title");
    expect(output).toHaveProperty("diagnosis");
    expect(output).toHaveProperty("decision");
    expect(output).toHaveProperty("nextAction");
    expect(output).toHaveProperty("reason");
  });
});

describe("buildPricingOutput", () => {
  it("returns oracle-pricing kind", () => {
    const obj = makeObject();
    const output = buildPricingOutput(obj);
    expect(output.kind).toBe("oracle-pricing");
  });

  it("detects 'bike' item type", () => {
    const obj = makeObject();
    const output = buildPricingOutput(obj);
    expect(output.itemType).toBe("bike");
    expect(output.primaryRoute).toBe("Facebook Marketplace");
  });

  it("detects 'jewellery' item type", () => {
    const obj = makeObject({
      normalised: "I have some jewellery to sell please help",
      classification: {
        intent: "resale", objectType: "opportunity", domain: "market",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false, lowClarity: false },
      },
    });
    const output = buildPricingOutput(obj);
    expect(output.itemType).toBe("jewellery");
    expect(output.primaryRoute).toBe("eBay");
  });

  it("detects 'clothing-volume' item type", () => {
    const obj = makeObject({
      normalised: "I have loads of clothes to sell and list on Vinted",
      classification: {
        intent: "resale", objectType: "opportunity", domain: "market",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false, lowClarity: false },
      },
    });
    const output = buildPricingOutput(obj);
    expect(output.itemType).toBe("clothing-volume");
    expect(output.primaryRoute).toBe("Vinted");
  });

  it("detects 'clothing-premium' item type from 'depop'", () => {
    const obj = makeObject({
      normalised: "I want to sell designer vintage clothing on Depop",
      classification: {
        intent: "resale", objectType: "opportunity", domain: "market",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false, lowClarity: false },
      },
    });
    const output = buildPricingOutput(obj);
    expect(output.itemType).toBe("clothing-premium");
    expect(output.primaryRoute).toBe("Depop");
  });

  it("detects 'electronics' item type from 'laptop'", () => {
    const obj = makeObject({
      normalised: "I have a laptop to sell this week",
      classification: {
        intent: "resale", objectType: "opportunity", domain: "market",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: true, lowClarity: false },
      },
    });
    const output = buildPricingOutput(obj);
    expect(output.itemType).toBe("electronics");
    expect(output.primaryRoute).toBe("eBay");
  });

  it("detects 'art' item type from 'painting'", () => {
    const obj = makeObject({
      normalised: "I want to sell my painting and some art prints",
      classification: {
        intent: "resale", objectType: "opportunity", domain: "market",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false, lowClarity: false },
      },
    });
    const output = buildPricingOutput(obj);
    expect(output.itemType).toBe("art");
    expect(output.primaryRoute).toBe("Etsy");
  });

  it("falls back to 'generic' item type when no category detected", () => {
    const obj = makeObject({
      normalised: "I have some stuff to sell and list",
      classification: {
        intent: "resale", objectType: "opportunity", domain: "market",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false, lowClarity: false },
      },
    });
    const output = buildPricingOutput(obj);
    expect(output.itemType).toBe("generic");
    expect(output.primaryRoute).toBe("Facebook Marketplace");
  });

  it("marks timeToSale with fast-sale priority when fastSale signal", () => {
    const obj = makeObject();
    const output = buildPricingOutput(obj);
    expect(output.timeToSale).toContain("fast-sale priority");
  });

  it("does not append fast-sale label when no urgency signals", () => {
    const obj = makeObject({
      normalised: "I have a bike to sell",
      classification: {
        intent: "resale", objectType: "opportunity", domain: "market",
        signals: { resale: true, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false, lowClarity: false },
      },
    });
    const output = buildPricingOutput(obj);
    expect(output.timeToSale).not.toContain("fast-sale priority");
  });

  it("output includes all required pricing fields", () => {
    const obj = makeObject();
    const output = buildPricingOutput(obj);
    for (const field of ["kind", "title", "diagnosis", "itemType", "primaryRoute",
      "secondaryRoute", "priceNote", "floor", "prep", "timeToSale", "reason"]) {
      expect(output).toHaveProperty(field);
    }
  });

  it("prep is a non-empty array", () => {
    const obj = makeObject();
    const output = buildPricingOutput(obj);
    expect(Array.isArray(output.prep)).toBe(true);
    expect(output.prep.length).toBeGreaterThan(0);
  });

  it("reason includes urgency + value scores", () => {
    const obj = makeObject();
    const output = buildPricingOutput(obj);
    expect(output.reason).toContain("urgency");
    expect(output.reason).toContain("value");
  });
});
