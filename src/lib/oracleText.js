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
    lowClarity:
      text.trim().split(/\s+/).length < 4 ||
      includesAny(lower, [
        "help",
        "thoughts",
        "maybe",
        "not sure",
        "something",
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

  const urgency = Math.max(
    1,
    Math.min(
      5,
      (classification.signals.overwhelmed ? 2 : 0) +
        (includesAny(lower, ["today", "now", "urgent", "asap", "need"])
          ? 2
          : 0) +
        1
    )
  );

  const value = Math.max(
    1,
    Math.min(
      5,
      (classification.intent === "resale" ? 4 : 0) +
        (classification.intent === "build" ? 3 : 0) +
        (classification.intent === "planning" ? 3 : 0) +
        (includesAny(lower, [
          "20",
          "inventory",
          "sell",
          "client",
          "proposal",
          "launch",
        ])
          ? 1
          : 0)
    )
  );

  const effort = Math.max(
    1,
    Math.min(
      5,
      (includesAny(lower, [
        "photograph",
        "sort",
        "organise",
        "organize",
        "list",
        "build",
      ])
        ? 3
        : 1) +
        (words > 16 ? 1 : 0)
    )
  );

  const clarity = Math.max(
    1,
    Math.min(
      5,
      (words >= 10 ? 4 : words >= 5 ? 3 : 2) -
        (classification.signals.lowClarity ? 1 : 0)
    )
  );

  return { urgency, value, effort, clarity };
}

export function chooseRoute(classification, score) {
  if (classification.intent === "unclear" || score.clarity <= 2) {
    return {
      routeState: "clarify",
      archiveLayer: "live",
      reasoning: "Signal is too weak or ambiguous for a clean operational move.",
    };
  }

  if (
    score.urgency >= 4 ||
    (classification.intent === "resale" && score.value >= 4)
  ) {
    return {
      routeState: "execute",
      archiveLayer:
        classification.intent === "resale" ? "market" : "process",
      reasoning:
        "Signal is clear enough to recommend one immediate action.",
    };
  }

  if (classification.intent === "question") {
    return {
      routeState: "suggest",
      archiveLayer: "process",
      reasoning:
        "Input asks for guidance rather than direct execution.",
    };
  }

  if (score.value <= 2 && score.urgency <= 2) {
    return {
      routeState: "hold",
      archiveLayer: "shadow",
      reasoning:
        "Signal is weak and should not consume active attention yet.",
    };
  }

  return {
    routeState: "suggest",
    archiveLayer:
      classification.intent === "resale" ? "market" : "process",
    reasoning:
      "Signal is valid but best served by a ranked recommendation.",
  };
}

function buildDiagnosis(object) {
  const { intent } = object.classification;

  if (intent === "resale")
    return "Mixed resale inventory with triage pressure and likely uneven value density.";
  if (intent === "planning")
    return "Operational planning signal with a sequencing problem.";
  if (intent === "build")
    return "Build signal with enough structure to move into execution framing.";
  if (intent === "creative")
    return "Creative material present, but it needs shaping into one concrete move.";
  if (intent === "question")
    return "Clear question signal with a decision gap, not a broad brainstorming need.";
  return "Input is still too ambiguous to route cleanly.";
}

function buildDecision(object) {
  const { intent } = object.classification;
  const { routeState } = object.route;

  if (routeState === "clarify") return "Clarify before acting.";
  if (routeState === "hold") return "Hold this until the signal strengthens.";
  if (intent === "resale" && routeState === "execute")
    return "Start with the highest-value, lowest-friction resale bucket first.";
  if (intent === "resale") return "Sort by value density before you list anything.";
  if (intent === "planning") return "Reduce this to one ordered operational sequence.";
  if (intent === "build") return "Commit to one build slice instead of expanding the brief.";
  if (intent === "creative") return "Choose the strongest material and shape one output from it.";
  return "Take one direct next move, not a broad response.";
}

function buildNextAction(object) {
  const text = object.normalised.toLowerCase();
  const { intent } = object.classification;
  const { routeState } = object.route;

  if (routeState === "clarify") {
    return "Which single outcome matters most right now: sell fast, maximise value, or reduce workload?";
  }

  if (
    intent === "resale" &&
    text.includes("clothes") &&
    (text.includes("jewellery") ||
      text.includes("jewelry") ||
      text.includes("bikes"))
  ) {
    return "Pull out the jewellery and bikes first, photograph only those today, and ignore the clothes pile until the higher-value items are separated.";
  }

  if (intent === "resale")
    return "Separate the top 5 likely highest-value items first and photograph only that shortlist.";
  if (intent === "planning")
    return "Write the task in three steps only: first action, blocking decision, final output.";
  if (intent === "build")
    return "Cut this down to one shippable build slice and execute that before adding anything else.";
  if (intent === "creative")
    return "Pick one idea from the input and convert it into a single finished draft today.";
  if (intent === "question")
    return "Answer the decision question directly and ignore secondary branches for now.";

  return "Clarify the main objective in one sentence before taking action.";
}

function buildReason(object) {
  const { routeState } = object.route;
  const { value, effort, clarity } = object.score;

  if (routeState === "clarify")
    return "The objective is not specific enough to recommend a reliable move without guessing.";
  if (routeState === "hold")
    return "The signal is low-value and low-urgency, so active attention would be wasted.";
  if (object.classification.intent === "resale")
    return "This concentrates effort on the highest-value items first and prevents low-value sorting from consuming the session.";

  return `Clarity is ${clarity}/5, value is ${value}/5, and effort is ${effort}/5 — one direct move is stronger than a broad response.`;
}

export function buildOutput(object) {
  return {
    kind: "oracle-decision",
    title: `Intent: ${object.classification.intent} · Route: ${object.route.routeState}`,
    diagnosis: buildDiagnosis(object),
    decision: buildDecision(object),
    nextAction: buildNextAction(object),
    reason: buildReason(object),
  };
}
