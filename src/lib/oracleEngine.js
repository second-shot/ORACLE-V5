import { createBaseObject } from "./oracleSchema.js";
import {
  normaliseInput,
  compressInput,
  classifyInput,
  scoreInput,
  chooseRoute,
  buildOutput,
} from "./oracleText.js";
import { storeInArchive } from "./oracleArchive.js";

function stamp(object, status, extra = {}) {
  return {
    ...object,
    status,
    updatedAt: Date.now(),
    ...extra,
    pipelineLog: [
      ...object.pipelineLog,
      { status, at: Date.now() },
    ],
  };
}

export function runOraclePipeline(rawInput) {
  let object = createBaseObject(rawInput);

  object = stamp(object, "captured");

  const normalised = normaliseInput(object.raw);
  object = stamp(object, "normalised", { normalised });

  const compressed = compressInput(normalised);
  object = stamp(object, "compressed", { compressed });

  const classification = classifyInput(compressed);
  object = stamp(object, "classified", {
    classification,
    type: classification.objectType,
  });

  const score = scoreInput(compressed, classification);
  object = stamp(object, "scored", { score });

  const route = chooseRoute(classification, score);
  object = stamp(object, "routed", {
    route,
    routeState: route.routeState,
    archiveLayer: route.archiveLayer,
    routeLog: [
      ...object.routeLog,
      { routeState: route.routeState, reasoning: route.reasoning, at: Date.now() },
    ],
  });

  object = stamp(object, "generating");

  const output = buildOutput(object);
  object = stamp(object, "validated", { output });

  object = stamp(object, "stored");

  object = stamp(object, "surfaced");

  return {
    object,
    archiveWriter: storeInArchive,
  };
}
