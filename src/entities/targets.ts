import { TRAINING_DESIGNATION_BY_KEY, WORKOUT_TARGET_BY_ID } from "../data/training";
import { normalizedDesignationKey } from "./text";


export function normalizeWorkoutTarget(value, fallback = "total_body") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const aliases = {
    legs: ["legs"],
    shoulders_rotator: [
      "shoulder rotator cuff",
      "shoulders rotator cuff",
      "shoulder and rotator cuff",
      "shoulders and rotator cuff",
    ],
    push: ["push"],
    pull: ["pull"],
    total_body: [
      "total body",
      "optional workout",
      "optional recovery",
      "full body",
    ],
    total_body_no_equipment: [
      "total body no equipment",
      "full body no equipment",
      "total body bodyweight",
      "bodyweight total body",
    ],
    custom: ["custom"],
  };
  if (WORKOUT_TARGET_BY_ID.has(String(value))) return String(value);
  return (
    Object.entries(aliases).find(([, names]) =>
      names.includes(normalized),
    )?.[0] || fallback
  );
}


export function workoutTarget(targetId) {
  return (
    WORKOUT_TARGET_BY_ID.get(normalizeWorkoutTarget(targetId)) ||
    WORKOUT_TARGET_BY_ID.get("total_body")
  );
}


export function trainingDesignation(value) {
  return (
    TRAINING_DESIGNATION_BY_KEY.get(String(value || "")) ||
    TRAINING_DESIGNATION_BY_KEY.get(normalizedDesignationKey(value)) ||
    null
  );
}


export function defaultDesignationLabel(targetId) {
  return workoutTarget(normalizeWorkoutTarget(targetId)).label;
}


export function isRemovedArmsUpperTarget(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return [
    "arms upper",
    "arms and upper",
    "arms upper body",
    "arms and upper body",
    "upper strength practice",
  ].includes(normalized);
}
