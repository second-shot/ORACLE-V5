function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function extractSignals(text) {
  const lower = text.toLowerCase();

  return {
    lower,
    hasQuestion:
      /\?|\bhow\b|\bwhat\b|\bwhich\b|\bshould\b|\bcan you\b|\bneed to know\b/.test(
        lower
      ),
    overwhelmed: includesAny(lower, [
      "overwhelmed",
      "stuck",
      "urgent",
      "asap",
      "today",
      "now",
    ]),
    resale: includesAny(lower, [
      "sell",
      "resell",
      "resale",
      "list",
      "listing",
      "price",
      "worth",
      "value",
      "marketplace",
      "vinted",
      "ebay",
      "depop",
      "grailed",
      "facebook marketplace",
      "jewellery",
      "jewelry",
      "bikes",
      "clothes",
      "inventory",
      "bags",
      "photograph",
      "gone",
    ]),
    build: includesAny(lower, [
      "build",
      "make",
      "create",
      "launch",
      "system",
      "app",
      "site",
      "deck",
      "proposal",
    ]),
    creative: includesAny(lower, [
      "idea",
      "concept",
      "creative",
      "story",
      "song",
      "art",
      "design",
      "brand",
      "visual",
    ]),
    planning: includesAny(lower, [
      "plan",
      "organise",
      "organize",
      "sort",
      "prioritise",
      "prioritize",
      "sequence",
      "first",
      "next",
      "roadmap",
    ]),
    fastSale: includesAny(lower, [
      "need gone",
      "gone",
      "fast",
      "quick",
      "this week",
      "today",
      "asap",
      "now",
    ]),
    lowClarity:
      text.trim().split(/\s+/).length < 4 ||
      includesAny(lower, [
        "help",
        "thoughts",
        "maybe",
        "not sure",
        "something",
        "can't decide",
        "cannot decide",
        "don't know",
        "do not know",
        "unsure",
      ]),
  };
}

export function normaliseInput(raw) {
  return raw.replace(/\s+/g, " ").trim();
}

export function compressInput(text) {
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function classifyInput(text) {
  const signals = extractSignals(text);

  let intent = "unclear";
  if (signals.resale) intent = "resale";
  else if (signals.build) intent = "build";
  else if (signals.creative) intent = "creative";
  else if (signals.planning) intent = "planning";
  else if (signals.hasQuestion) intent = "question";

  // Resale wins over planning if both signal
  if (intent !== "unclear" && signals.planning && signals.resale) {
    intent = "resale";
  }

  const objectType =
    intent === "resale"
      ? "opportunity"
      : intent === "build"
      ? "project"
      : intent === "creative"
      ? "draft"
      : intent === "planning"
      ? "project"
      : intent === "question"
      ? "memory"
      : "input";

  const domain =
    intent === "resale"
      ? "market"
      : intent === "build"
      ? "project"
      : intent === "creative"
      ? "creative"
      : intent === "planning"
      ? "operations"
      : intent === "question"
      ? "knowledge"
      : "intake";

  return { intent, objectType, domain, signals };
}

export function scoreInput(text, classification) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();
  const s = classification.signals;

  // Urgency: time pressure signals
  const urgencyRaw =
    (s.overwhelmed ? 2 : 0) +
    (includesAny(lower, ["today", "now", "urgent", "asap", "need", "this week", "need gone", "gone"]) ? 2 : 0) +
    (s.fastSale ? 1 : 0) +
    1;
  const urgency = Math.max(1, Math.min(5, urgencyRaw));

  // Value: commercial or strategic return
  const valueRaw =
    (classification.intent === "resale" ? 3 : 0) +
    (classification.intent === "build" ? 3 : 0) +
    (classification.intent === "planning" ? 2 : 0) +
    (includesAny(lower, ["inventory", "client", "proposal", "launch"]) ? 1 : 0);
  const value = Math.max(1, Math.min(5, valueRaw));

  // Effort: execution friction
  const effortRaw =
    (includesAny(lower, ["photograph", "sort", "organise", "organize", "list", "build"]) ? 3 : 1) +
    (words > 16 ? 1 : 0);
  const effort = Math.max(1, Math.min(5, effortRaw));

  // Clarity: signal quality
  const clarityRaw =
    (words >= 10 ? 4 : words >= 5 ? 3 : 2) -
    (s.lowClarity ? 1 : 0);
  const clarity = Math.max(1, Math.min(5, clarityRaw));

  return { urgency, value, effort, clarity };
}

// CANONICAL ROUTING RULE (V2.1):
// Single gate: urgency + value.
// Clarity gate fires first — low clarity never reaches execute.
// urgency + value >= 6 AND clarity >= 3 → execute
// urgency + value 3–5 AND clarity >= 3 → suggest
// clarity < 3 → clarify (scores not evaluated)
// urgency + value <= 2 → defer
export function chooseRoute(classification, score) {
  const { intent } = classification;
  const { urgency, value, clarity } = score;
  const sum = urgency + value;

  // Clarity gate — fires before any other check
  if (intent === "unclear" || clarity <= 2) {
    return {
      routeState: "clarify",
      archiveLayer: "live",
      reasoning:
        "Clarity is too low to route confidently. Single most unknown dimension surfaced.",
    };
  }

  // Execute threshold
  if (sum >= 6) {
    return {
      routeState: "execute",
      archiveLayer: intent === "resale" ? "market" : "process",
      reasoning: `urgency ${urgency} + value ${value} = ${sum} — above threshold. One immediate action recommended.`,
    };
  }

  // Defer threshold
  if (sum <= 2) {
    return {
      routeState: "hold",
      archiveLayer: "shadow",
      reasoning: `urgency ${urgency} + value ${value} = ${sum} — signal too weak for active attention. Deferred.`,
    };
  }

  // Default: suggest
  return {
    routeState: "suggest",
    archiveLayer: intent === "resale" ? "market" : "process",
    reasoning: `urgency ${urgency} + value ${value} = ${sum} — valid signal, below execute threshold. Structured recommendation surfaced.`,
  };
}

function buildDiagnosis(object) {
  const { intent } = object.classification;
  const { routeState } = object.route;
  const lower = object.normalised.toLowerCase();

  if (routeState === "clarify")
    return "Input too ambiguous to route — one clarifying question needed.";

  if (intent === "resale") {
    if (includesAny(lower, ["need gone", "gone", "this week", "fast"]))
      return "Single resale item · hard deadline · speed over price.";
    if (includesAny(lower, ["inventory", "clothes", "loads", "pile", "putting it off"]))
      return "Resale backlog · avoidance is the bottleneck, not capability.";
    return "Resale intent confirmed · triage and route.";
  }
  if (intent === "planning")
    return "Operational planning signal · sequencing problem detected.";
  if (intent === "build")
    return "Build signal · structure present, scope needs reduction.";
  if (intent === "creative")
    return "Creative material present · needs shaping into one concrete move.";
  if (intent === "question")
    return "Decision gap detected · not a broad brainstorming need.";
  return "Input ambiguous · route unclear.";
}

function buildDecision(object) {
  const { intent } = object.classification;
  const { routeState } = object.route;

  if (routeState === "clarify") return "Clarify before acting.";
  if (routeState === "hold") return "Hold — signal too weak for active attention.";
  if (intent === "resale" && routeState === "execute")
    return "List the item now. Fastest viable platform first.";
  if (intent === "resale") return "Sort by value density before listing anything.";
  if (intent === "planning") return "Reduce to one ordered sequence.";
  if (intent === "build") return "Commit to one build slice. Ship that first.";
  if (intent === "creative") return "Choose the strongest idea. Shape one finished output.";
  return "Take one direct next move.";
}

function buildNextAction(object) {
  const text = object.normalised.toLowerCase();
  const { intent } = object.classification;
  const { routeState } = object.route;
  const s = object.classification.signals;

  if (routeState === "clarify") {
    // Target the single most unknown dimension
    if (intent === "resale")
      return "What type of item are you pricing? (e.g. clothing, electronics, bike, jewellery)";
    if (intent === "creative")
      return "What kind of project? (e.g. something to build, something to sell, something to make)";
    return "What single outcome matters most right now?";
  }

  if (intent === "resale") {
    if (s.fastSale || includesAny(text, ["need gone", "gone", "this week"])) {
      return "List on Facebook Marketplace today. If no enquiry in 48 hours, move to eBay.";
    }
    if (
      (text.includes("clothes") || text.includes("clothing")) &&
      (text.includes("jewellery") || text.includes("jewelry") || text.includes("bikes"))
    ) {
      return "Pull out jewellery and bikes first. Photograph only those today. Leave the clothing pile.";
    }
    if (includesAny(text, ["putting it off", "keep", "avoidance", "should"])) {
      return "Start with 3 items only. List on Vinted this week. Do not wait until all items are ready.";
    }
    return "Separate the top 5 highest-value items and photograph only those first.";
  }

  if (intent === "planning")
    return "Write the task in three steps: first action, blocking decision, final output.";
  if (intent === "build")
    return "Cut to one shippable build slice and execute before adding anything else.";
  if (intent === "creative")
    return "Pick one idea. Convert it into a single finished draft today.";
  if (intent === "question")
    return "Answer the decision question directly. Ignore secondary branches.";

  return "Clarify the main objective in one sentence before acting.";
}

function buildReason(object) {
  const { routeState } = object.route;
  const { intent } = object.classification;
  const { urgency, value, effort, clarity } = object.score;
  const text = object.normalised.toLowerCase();
  const s = object.classification.signals;

  if (routeState === "clarify")
    return "Objective not specific enough to route without guessing. Question targets the single missing dimension.";
  if (routeState === "hold")
    return `urgency ${urgency} + value ${value} = ${urgency + value} — active attention would be wasted here.`;

  if (intent === "resale") {
    if (s.fastSale || includesAny(text, ["need gone", "this week"]))
      return `Hard deadline + fast-sale language → speed over price. urgency ${urgency} + value ${value} = ${urgency + value}.`;
    if (includesAny(text, ["putting it off", "keep", "should"]))
      return `Volume + avoidance pattern → smallest viable first action. Friction is the obstacle, not capability. urgency ${urgency} + value ${value} = ${urgency + value}.`;
    return `Resale signal confirmed. urgency ${urgency} + value ${value} = ${urgency + value}. Effort ${effort}/5.`;
  }

  return `Clarity ${clarity}/5 · value ${value}/5 · effort ${effort}/5 — one direct move is stronger than a broad response.`;
}

export function buildOutput(object) {
  return {
    kind: "oracle-decision",
    title: `${object.classification.intent} · ${object.route.routeState}`,
    diagnosis: buildDiagnosis(object),
    decision: buildDecision(object),
    nextAction: buildNextAction(object),
    reason: buildReason(object),
  };
}
