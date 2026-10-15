// The built-in exercise library, read from the classic data scripts that
// index.html loads before app.js (exercise-data.js, equipment-exercises.js).
import type { Exercise, ExerciseRecord } from "../types";
import { CUSTOM_EXERCISES } from "./custom-exercises";
import { enrichExercise, inferEquipmentVarieties } from "../entities/exercise";
import { slugify } from "../entities/text";

declare global {
  interface Window {
    EXERCISE_SOURCE: ExerciseRecord[];
    EQUIPMENT_EXERCISE_SOURCE?: ExerciseRecord[];
  }
}

const equipmentSource: ExerciseRecord[] = Array.isArray(
  window.EQUIPMENT_EXERCISE_SOURCE,
)
  ? window.EQUIPMENT_EXERCISE_SOURCE
  : [];
const equipmentSourceById = new Map(
  equipmentSource.map((record) => [slugify(record.name), record]),
);
const originalRecords: ExerciseRecord[] = [
  ...window.EXERCISE_SOURCE,
  ...CUSTOM_EXERCISES,
].map((record) => {
  const expansion = equipmentSourceById.get(slugify(record.name));
  if (!expansion) return record;
  return {
    ...record,
    equipmentVarieties: [
      ...inferEquipmentVarieties(record),
      ...inferEquipmentVarieties(expansion),
    ],
  };
});
const originalIds = new Set(
  originalRecords.map((record) => slugify(record.name)),
);
const expandedRecords = equipmentSource.filter(
  (record) => !originalIds.has(slugify(record.name)),
);

export const BASE_EXERCISES: Exercise[] = [
  ...originalRecords,
  ...expandedRecords,
].map(enrichExercise);

export const BASE_EXERCISE_BY_ID = new Map(
  BASE_EXERCISES.map((exercise) => [exercise.id, exercise]),
);
