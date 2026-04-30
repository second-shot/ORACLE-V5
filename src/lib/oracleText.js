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
    // lowClarity: true when the input is too vague to route without guessing.
    // Exception: specific item-type words (bike, jewellery, iphone, etc.) anchor
    // the intent even in short inputs, so we suppress lowClarity for those.
    lowClarity: (() => {
      const hasItemAnchor = includesAny(lower, [
        "bike", "bicycle", "jewellery", "jewelry", "ring", "necklace",
        "bracelet", "earring", "watch", "iphone", "phone", "laptop",
        "ipad", "tablet", "console", "camera", "clothes", "clothing",
        "jacket", "coat", "jeans", "shirt", "dress", "art", "print",
        "painting", "electronics", "tech",
      ]);
      if (hasItemAnchor) return false;
      return (
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
        ])
      );
    })(),
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
  const { intent } = object.classification;
  const { routeState } = object.route;

  // Pricing branch: resale + execute
  if (intent === "resale" && routeState === "execute") {
    return buildPricingOutput(object);
  }

  // Proposal branch: build or creative + execute
  if ((intent === "build" || intent === "creative") && routeState === "execute") {
    return buildProposalOutput(object);
  }

  return {
    kind: "oracle-decision",
    title: `${object.classification.intent} · ${object.route.routeState}`,
    diagnosis: buildDiagnosis(object),
    decision: buildDecision(object),
    nextAction: buildNextAction(object),
    reason: buildReason(object),
  };
}

// ── Pricing Output Branch ──────────────────────────────────────────────────
// Fires when: intent === "resale" AND routeState === "execute"
// Every field ties to a detected signal. No generic templates.
// Price range is omitted when no item-type signal is present — the system
// instructs how to derive it rather than inventing a number.

const PRICING_MATRIX = {
  bike: {
    primary: "Facebook Marketplace",
    secondary: "eBay",
    secondaryTrigger: "no enquiry in 48 hours",
    speed: "24–72 hours",
    effort: "Low",
    priceNote: "Search Facebook Marketplace for the same model locally. Undercut by 10–15%.",
    floor: "Accept any firm offer above scrap value if deadline is hard.",
    prep: [
      "Clean the bike thoroughly.",
      "Photograph outdoors — both sides, close-up of any damage.",
      "Include make, model, frame size, and condition in the title.",
    ],
  },
  jewellery: {
    primary: "eBay",
    secondary: "Depop",
    secondaryTrigger: "no sale in 5 days",
    speed: "3–7 days",
    effort: "Medium",
    priceNote: "Search eBay sold listings for comparable pieces. Price at the lower end of recent sales.",
    floor: "Set floor at 60% of your target price.",
    prep: [
      "Clean each piece.",
      "Photograph on a neutral background with close-ups of hallmarks or damage.",
      "Include metal type, weight if known, and any certificates.",
    ],
  },
  "clothing-volume": {
    primary: "Vinted",
    secondary: "Facebook Marketplace",
    secondaryTrigger: "no sale in 5 days",
    speed: "2–5 days per item",
    effort: "High — time cost of listing volume",
    priceNote: "Price 10–20% below similar listed items on Vinted. Bundle where possible.",
    floor: "Accept bundle offers that clear multiple items at once.",
    prep: [
      "Photograph each item flat or on a hanger in natural light.",
      "Note brand, size, condition, and any flaws honestly.",
      "List in batches of 5 — do not try to list everything at once.",
    ],
  },
  "clothing-premium": {
    primary: "Depop",
    secondary: "Grailed",
    secondaryTrigger: "no sale in 7 days",
    speed: "5–14 days",
    effort: "Medium",
    priceNote: "Research sold prices on Depop for the same label and condition. Premium items hold price — do not undercut aggressively.",
    floor: "Set floor at 70% of target. Premium buyers expect to negotiate slightly.",
    prep: [
      "Style the item for photography — flat lay or worn.",
      "Include brand, size, condition, and a brief description of the piece.",
      "Tag accurately — wrong tags kill visibility.",
    ],
  },
  electronics: {
    primary: "eBay",
    secondary: "Facebook Marketplace",
    secondaryTrigger: "no enquiry in 72 hours",
    speed: "1–4 days",
    effort: "Low",
    priceNote: "Check eBay sold listings for the exact model. Price at median of last 10 sales.",
    floor: "Accept 80% of asking if buyer collects locally.",
    prep: [
      "Test the item and note any faults honestly.",
      "Photograph all sides including ports and any damage.",
      "Include model number, storage/spec, and accessories in the listing.",
    ],
  },
  art: {
    primary: "Etsy",
    secondary: "Direct sale",
    secondaryTrigger: "no sale in 14 days",
    speed: "7–30 days",
    effort: "High",
    priceNote: "Research comparable work on Etsy by medium, size, and artist profile level. Price reflects effort, materials, and edition status.",
    floor: "Do not price below material cost. Underpricing damages perceived value.",
    prep: [
      "Photograph in natural light — include detail shots and scale reference.",
      "Write an honest description of medium, dimensions, and process.",
      "Include edition info and certificate if applicable.",
    ],
  },
  generic: {
    primary: "Facebook Marketplace",
    secondary: "eBay",
    secondaryTrigger: "no enquiry in 72 hours",
    speed: "1–5 days",
    effort: "Low to medium",
    priceNote: "Search the platform for comparable items sold recently. Price at or slightly below the median.",
    floor: "Accept 75% of asking for quick local sale.",
    prep: [
      "Photograph clearly in good light.",
      "Include condition, dimensions or spec, and any flaws.",
    ],
  },
};

function detectItemType(text) {
  const lower = text.toLowerCase();
  if (includesAny(lower, ["bike", "bicycle", "cycling"])) return "bike";
  if (includesAny(lower, ["jewellery", "jewelry", "ring", "necklace", "bracelet", "earring", "watch"])) return "jewellery";
  if (includesAny(lower, ["depop", "grailed", "designer", "vintage clothing", "premium"])) return "clothing-premium";
  if (includesAny(lower, ["clothes", "clothing", "tops", "dresses", "jeans", "shirts", "jacket", "coat", "vinted"])) return "clothing-volume";
  if (includesAny(lower, ["phone", "laptop", "ipad", "tablet", "console", "camera", "electronics", "tech"])) return "electronics";
  if (includesAny(lower, ["art", "print", "painting", "artwork", "illustration", "drawing"])) return "art";
  return "generic";
}

function buildPricingReason(object, itemType, matrix) {
  const s = object.classification.signals;
  const { urgency, value } = object.score;
  const sum = urgency + value;
  const text = object.normalised.toLowerCase();

  const parts = [];

  if (s.fastSale || includesAny(text, ["need gone", "this week", "today", "fast"])) {
    parts.push(`Hard deadline detected — speed over maximum price`);
    parts.push(`${matrix.primary} is the fastest route for ${itemType === "generic" ? "this item type" : itemType}`);
  } else {
    parts.push(`Resale intent confirmed for ${itemType === "generic" ? "unspecified item" : itemType}`);
    parts.push(`${matrix.primary} matched on speed, audience fit, and effort`);
  }

  parts.push(`urgency ${urgency} + value ${value} = ${sum} — execute threshold met`);

  if (itemType === "generic") {
    parts.push(`Item type not detected — use the price note below to anchor your listing price`);
  }

  return parts.join(". ") + ".";
}

export function buildPricingOutput(object) {
  const text = object.normalised;
  const itemType = detectItemType(text);
  const matrix = PRICING_MATRIX[itemType];
  const s = object.classification.signals;
  const isFast = s.fastSale || includesAny(text.toLowerCase(), ["need gone", "this week", "today", "asap"]);

  return {
    kind: "oracle-pricing",
    title: `${object.classification.intent} · ${object.route.routeState}`,
    diagnosis: buildDiagnosis(object),
    itemType,
    primaryRoute: matrix.primary,
    secondaryRoute: `${matrix.secondary} — if ${matrix.secondaryTrigger}`,
    priceNote: matrix.priceNote,
    floor: matrix.floor,
    prep: matrix.prep,
    timeToSale: isFast
      ? `${matrix.speed} (fast-sale priority)`
      : matrix.speed,
    reason: buildPricingReason(object, itemType, matrix),
  };
}

// ── Proposal Output Branch ─────────────────────────────────────────────────
// Fires when: (intent === "build" OR intent === "creative") AND routeState === "execute"
// Fields: audience, format, deliverable tie directly to detected signals.
// No generic filler — each field reflects what the input actually contains.

function detectProposalAudience(object) {
  const text = object.normalised.toLowerCase();
  const { intent } = object.classification;

  if (includesAny(text, ["client", "clients"])) return "Client";
  if (includesAny(text, ["team", "colleagues", "stakeholders", "investors"])) return "Team / stakeholders";
  if (includesAny(text, ["user", "users", "audience", "customers", "readers", "followers", "viewers"])) return "End users";
  if (includesAny(text, ["myself", "personal", "me", "my own"])) return "Self / internal";
  if (intent === "build") return "Internal / team";
  return "Defined audience TBC";
}

function detectProposalFormat(object) {
  const text = object.normalised.toLowerCase();
  const { intent } = object.classification;

  if (intent === "build") {
    if (includesAny(text, ["deck", "pitch", "pitch deck", "presentation"])) return "Pitch deck";
    if (includesAny(text, ["proposal", "brief", "write-up", "writeup"])) return "Written proposal";
    if (includesAny(text, ["spec", "specification", "technical", "architecture", "system"])) return "Technical spec";
    if (includesAny(text, ["app", "application", "site", "website", "tool", "product"])) return "Working prototype";
    return "Shippable build slice";
  }

  // creative
  if (includesAny(text, ["story", "article", "essay", "piece", "blog", "post", "write"])) return "Written piece";
  if (includesAny(text, ["song", "track", "music", "audio", "record"])) return "Audio track";
  if (includesAny(text, ["art", "artwork", "painting", "illustration", "drawing", "print"])) return "Visual artwork";
  if (includesAny(text, ["brand", "branding", "identity", "logo"])) return "Brand identity";
  if (includesAny(text, ["design", "visual", "layout", "ui", "ux", "interface"])) return "Design output";
  if (includesAny(text, ["video", "film", "short", "clip", "reel"])) return "Video piece";
  return "Finished creative output";
}

function detectProposalDeliverable(object) {
  const text = object.normalised.toLowerCase();
  const { intent } = object.classification;
  const format = detectProposalFormat(object);

  if (intent === "build") {
    if (format === "Pitch deck") return "One complete pitch deck — structured, rehearsed, ready to present.";
    if (format === "Written proposal") return "One written proposal — clear scope, outcome, and timeline.";
    if (format === "Technical spec") return "One technical spec — architecture decisions locked, scope bounded.";
    if (format === "Working prototype") return "One working prototype — demonstrates the core loop end to end.";
    return "One shippable slice — the smallest version that proves the concept works.";
  }

  // creative
  if (format === "Written piece") return "One finished, edited piece — ready to share or publish.";
  if (format === "Audio track") return "One completed track — mixed and ready to share.";
  if (format === "Visual artwork") return "One finished piece — photographed, titled, and ready to present.";
  if (format === "Brand identity") return "One identity system — mark, palette, and one use-case example.";
  if (format === "Design output") return "One finished design — exported at correct spec, ready to hand off.";
  if (format === "Video piece") return "One finished cut — colour-corrected and ready to export.";
  return "One finished output — complete enough to share and receive real feedback.";
}

function buildProposalReason(object) {
  const { intent } = object.classification;
  const { urgency, value, clarity, effort } = object.score;
  const sum = urgency + value;

  return `${intent.charAt(0).toUpperCase() + intent.slice(1)} intent · execute threshold met (urgency ${urgency} + value ${value} = ${sum}). Clarity ${clarity}/5 · effort ${effort}/5. One concrete deliverable over a broad output.`;
}

export function buildProposalOutput(object) {
  return {
    kind: "oracle-proposal",
    title: `${object.classification.intent} · ${object.route.routeState}`,
    diagnosis: buildDiagnosis(object),
    audience: detectProposalAudience(object),
    format: detectProposalFormat(object),
    deliverable: detectProposalDeliverable(object),
    nextAction: buildNextAction(object),
    reason: buildProposalReason(object),
  };
}
