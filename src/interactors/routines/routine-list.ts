// Helpers shared by the warm-up and cool-down stories.
import type { RoutineExercise } from "../../types";

export const MAX_ROUTINE_EXERCISES = 24;

/** The first unused id of the form `${prefix}-N`. */
export function nextRoutineId(
  exercises: RoutineExercise[],
  prefix: string,
): string {
  const used = new Set(exercises.map((exercise) => exercise.id));
  let index = 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

/** Swaps an item with its neighbor; false when it cannot move that way. */
export function moveRoutineItem(
  exercises: RoutineExercise[],
  exerciseId: string,
  direction: number,
): boolean {
  const index = exercises.findIndex((exercise) => exercise.id === exerciseId);
  const nextIndex = index + Number(direction);
  if (index < 0 || nextIndex < 0 || nextIndex >= exercises.length)
    return false;
  [exercises[index], exercises[nextIndex]] = [
    exercises[nextIndex],
    exercises[index],
  ];
  return true;
}

/**
 * The label to keep after an edit. While typing (final = false) the text is
 * kept as typed; when the field is committed it is trimmed, and an empty
 * label falls back to a numbered default.
 */
export function routineLabel(
  value: string,
  final: boolean,
  fallback: string,
): string {
  if (!final) return String(value).slice(0, 100);
  return String(value || "").trim().slice(0, 100) || fallback;
}
