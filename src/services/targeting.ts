import { gateways } from "../gateways/registry";
import { SLOTS, namesMatching } from "../data/slots";
import { BODY_PART_OPTIONS, DAY_CONFIG, TARGET_BODY_PARTS } from "../data/training";
import { targetBodyPartsForCycle } from "../entities/cycles";
import { idFor, normalizeBodyParts } from "../entities/exercise";
import { normalizeWorkoutTarget, workoutTarget } from "../entities/targets";
import { cycleForDay, cycleForId } from "./cycle-schedule";
import { bodyPartOptions } from "./exercise-catalog";


export function targetIdForDay(dayId) {
  const dayData = gateways.week.current()?.days?.[dayId];
  const cycle = cycleForId(dayData?.cycleId);
  const fallback =
    DAY_CONFIG.find((day) => day.id === dayId)?.defaultTarget || "total_body";
  return normalizeWorkoutTarget(cycle?.target || dayData?.target, fallback);
}


export function targetBodyPartsForDay(dayId) {
  const cycle = cycleForDay(dayId);
  const selected = normalizeBodyParts(
    cycle?.bodyParts || gateways.week.current()?.days?.[dayId]?.bodyParts,
  );
  if (selected.length) return selected;
  return [...(TARGET_BODY_PARTS[targetIdForDay(dayId)] || BODY_PART_OPTIONS)];
}


export function bodyPartCoverage() {
  return bodyPartOptions().map((bodyPart) => ({
    bodyPart,
    count: gateways.cycles.all().filter((cycle) =>
      targetBodyPartsForCycle(cycle).includes(bodyPart),
    ).length,
  }));
}


export function matchesDayTargetMuscles(exercise, dayId) {
  const targetParts = targetBodyPartsForDay(dayId);
  return exercise.body_parts.some((part) => targetParts.includes(part));
}


export function circuitDefinitionsForTarget(targetId, used = new Set()) {
  const target = workoutTarget(targetId);
  const definitions = SLOTS[target.templateKey];
  const placeholderId = idFor("Shoulder Exercise Placeholder");
  if (target.id === "shoulders_rotator" && used.has(placeholderId)) {
    return definitions.map((definition, index) =>
      index === 2
        ? {
            ...definition,
            first: {
              label: "Shoulder movement",
              names: namesMatching(
                (exercise) =>
                  exercise.primary_body_part ===
                    "Shoulders and Rotator Cuff" && !exercise.always_locked,
                gateways.exercises.all(),
              ),
            },
          }
        : definition,
    );
  }
  return definitions;
}


export function withBodyPartFilter(definitions, bodyParts = []) {
  const selected = normalizeBodyParts(bodyParts);
  if (!selected.length) return definitions;
  return definitions.map((definition) => ({
    ...definition,
    first: { ...definition.first, bodyPartFilter: selected },
    second: { ...definition.second, bodyPartFilter: selected },
    extra: { ...definition.extra, bodyPartFilter: selected },
  }));
}


export function circuitDefinitionsForDay(dayId, used = null) {
  let qualificationUsed = used;
  if (!qualificationUsed) {
    qualificationUsed = new Set();
    const dayData = gateways.week.current()?.days?.[dayId];
    if (
      targetIdForDay(dayId) === "shoulders_rotator" &&
      dayData?.circuits?.[2]?.first?.exerciseId !==
        idFor("Shoulder Exercise Placeholder")
    ) {
      qualificationUsed.add(idFor("Shoulder Exercise Placeholder"));
    }
  }
  return withBodyPartFilter(
    circuitDefinitionsForTarget(targetIdForDay(dayId), qualificationUsed),
    cycleForDay(dayId)?.bodyParts,
  );
}
